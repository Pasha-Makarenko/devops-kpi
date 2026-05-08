# Лабораторна робота №2 — контейнеризація

## Середовище експериментів

- ОС: Linux 6.19.11-arch1-1
- Docker: 29.4.0
- Docker Compose: 5.1.1

## 1) Python Application

Репозиторій для експериментів: `experiments/lab2/python-starter`.

### Dockerfile варіанти

- `Dockerfile.naive`: `COPY .` до встановлення залежностей.
- `Dockerfile.optimized`: спочатку `requirements`, потім `pip install`, потім код.
- `Dockerfile.optimized.alpine`: оптимізований варіант на `python:3.13-alpine`.

### Метрики

| Кейс | Час збірки | Розмір образу |
|---|---:|---:|
| naive v1 (debian, no-cache) | 17.209s | 1.54GB |
| optimized v1 (debian, no-cache) | 17.805s | 1.54GB |
| naive v2 (після зміни коду) | 15.413s | 1.54GB |
| optimized v2 (після зміни коду) | 3.637s | 1.54GB |
| optimized alpine v1 | 15.077s | 133MB |
| optimized debian + numpy | 53.876s | 1.63GB |
| optimized alpine + numpy | 52.863s | 232MB |

### Висновки (Python)

- Оптимізація шарів майже не змінює першу збірку, але різко прискорює повторну (3.6s vs 15.4s).
- Alpine значно зменшує розмір образу (133MB vs 1.54GB), але для важких пакетів (numpy) час збірки лишається співставним.
- Додавання `numpy` суттєво збільшує розмір образу на обох базах.

## 2) Musl (Alpine) vs glibc (Ubuntu)

Команди виконані в окремій мережі `dns-lab` з `dnsmasq`:

- `ubuntu:latest getent hosts myservice.internal` -> `10.0.0.50 myservice.internal.corp`
- `alpine:latest getent hosts myservice.internal` -> порожній результат

По логах `dnsmasq`:

- Для Ubuntu були запити з пошуковим суфіксом (`myservice.internal.corp`) і отримано `A` запис.
- Для Alpine видно іншу поведінку резолвера (`musl`), де `getent` у цьому сценарії не повернув очікуване значення.

### Висновки (DNS)

- Поведінка DNS-резолвера залежить від libc (glibc vs musl), навіть при однаковому контейнерному оточенні.
- Це може призводити до інтермітентних проблем резолву внутрішніх імен у mixed-середовищах.

## 3) Golang + multi-stage builds

Репозиторій для експериментів: `experiments/lab2/golang-starter`.

### Dockerfile варіанти

- `Dockerfile.single`: single-stage на `golang:1.24-bookworm`.
- `Dockerfile.multistage.scratch`: builder + `FROM scratch`.
- `Dockerfile.multistage.distroless`: builder + `distroless/static-debian12:nonroot`.

### Метрики

| Кейс | Час збірки | Розмір образу |
|---|---:|---:|
| single-stage | 18.630s | 1.41GB |
| multi-stage scratch | 20.640s | 19.4MB |
| multi-stage distroless | 21.001s | 25.5MB |

### Аналіз

- Single-stage містить компілятор та build-артефакти, що не потрібні рантайму.
- `scratch` та `distroless` зменшують розмір на порядок і успішно запускають сервіс.
- Усередині `scratch`/`distroless` немає shell (`/bin/sh`), тому дебаг усередині контейнера менш зручний.

## 4) Практична частина на базі ЛР1

У поточному репозиторії додано:

- `Dockerfile` для web app.
- `scripts/docker-entrypoint.sh` (міграція перед стартом).
- `deploy/nginx/mywebapp-docker.conf` для reverse proxy.
- `docker-compose.yml` з трьома сервісами: `db`, `web`, `nginx`.
- окрема мережа `mywebapp-net`.
- персистентний volume `mywebapp-db-data`.

### Перевірка персистентності

Після створення задачі в БД, `docker compose down` + `docker compose up -d` зберігає запис:

- до перезапуску: `tasks_count = 1`
- після перезапуску: `tasks_count = 1`

## Команди відтворення (ключові)

```bash
# Python
cd experiments/lab2/python-starter
docker build --no-cache -f Dockerfile.naive -t lab2-python:naive-v1 .
docker build -f Dockerfile.optimized -t lab2-python:optimized-v2 .
docker build --no-cache -f Dockerfile.optimized.alpine -t lab2-python:optimized-alpine-v1 .

# Golang
cd ../golang-starter
docker build --no-cache -f Dockerfile.single -t lab2-go:single .
docker build --no-cache -f Dockerfile.multistage.scratch -t lab2-go:scratch .
docker build --no-cache -f Dockerfile.multistage.distroless -t lab2-go:distroless .

# Практична частина (поточний репозиторій)
cd /mnt/data/KPI/devops-kpi
docker compose up -d --build
docker compose down
```
