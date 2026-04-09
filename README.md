# Task Tracker (mywebapp)

Лабораторна робота: розгортання web-сервісу з автоматизацією. Назва застосунку та systemd-юнітів згідно з завданням: mywebapp.

## Варіант (N = 16)

- N — номер у списку групи: 16
- V2 = (N % 2) + 1 = 1 → конфігурація: аргументи командного рядка; БД: MariaDB
- V3 = (N % 3) + 1 = 2 → застосунок: Task Tracker
- V5 = (N % 5) + 1 = 2 → порт застосунку: 5200

## Веб-застосунок

Task Tracker — сервіс для відстеження задач.

- Об'єкт задачі: `id`, `title`, `status`, `created_at`
- `GET /tasks` — список усіх задач
- `POST /tasks` (body: `{ "title": "..." }`) — створити задачу
- `POST /tasks/{id}/done` — змінити статус на «виконано»
- `GET /health/alive` — завжди 200 OK
- `GET /health/ready` — 200 OK якщо БД доступна, інакше 500
- `GET /` — тільки `text/html`, список ендпоінтів бізнес-логіки

API віддає `application/json` або `text/html` за заголовком `Accept`.

### Середовище та запуск

- Node.js 24 LTS, pnpm
- Конфігурація: аргументи CLI (порт, параметри підключення до MariaDB)
- Міграції: `pnpm run migrate -- --dbHost ... --dbPort ... --dbUser ... --dbPassword ... --dbName ...`

```bash
pnpm install
pnpm run migrate -- --dbHost 127.0.0.1 --dbPort 3306 --dbUser mywebapp --dbPassword secret --dbName mywebapp
pnpm start -- --port 5200 --dbHost 127.0.0.1 --dbPort 3306 --dbUser mywebapp --dbPassword secret --dbName mywebapp
```

### API

| Метод | Шлях | Опис |
|-------|------|------|
| GET | / | Список ендпоінтів (text/html) |
| GET | /tasks | Список задач |
| POST | /tasks | Створити задачу `{ "title": "..." }` |
| POST | /tasks/:id/done | Відмітити задачу виконаною |
| GET | /health/alive | Перевірка живого стану (внутрішній ендпоінт, не публікується через nginx) |
| GET | /health/ready | Готовність (БД) (внутрішній ендпоінт, не публікується через nginx) |

## Розгортання на ВМ

### Базовий образ та ресурси

- Образ: Ubuntu 22.04 LTS (Jammy) — `ubuntu/jammy64` (Vagrant)
- Ресурси: 1 CPU, 1024 MB RAM (у Vagrantfile)
- Мережа: nginx на 0.0.0.0:80, застосунок на 127.0.0.1:5200, MariaDB на 127.0.0.1:3306

### Вхід на ВМ

- Vagrant: `vagrant up`, потім `vagrant ssh` (ключі Vagrant; користувач `vagrant` після provision заблокований).
- Користувачі після provision: `student`, `teacher`, `operator` — пароль за замовчуванням 12345678 (потрібна зміна при першому вході).
- Сервіс: користувач `mywebapp` (системний, без входу).

### Запуск автоматизації

```bash
vagrant up
```

Під час `vagrant up` виконується `scripts/provision.sh`: пакети, користувачі, MariaDB, rsync у `/opt/mywebapp`, генерується `/etc/mywebapp/app.env` (значення з `deploy/deployment.defaults` + пароль БД), копіюється `deploy/launch-mywebapp.sh` → `launch.sh`, з шаблонів `deploy/templates/` збираються nginx та systemd (`envsubst`), міграція, socket activation, `gradebook`, блокування `vagrant`. Порти, шляхи та ім’я юніта змінюйте в `deploy/deployment.defaults` (за замовчуванням `mywebapp`, порт застосунку 5200).

Після provision доступ до сервісу: на хості http://localhost:8080 (порт 80 гостя проброшений на 8080 хоста).

### Логи застосунку

Застосунок пише в stdout у форматі JSON. У systemd це потрапляє в journal.

На ВМ (після `vagrant ssh` під student / teacher з sudo):

```bash
sudo journalctl -u mywebapp -n 100 --no-pager
sudo journalctl -u mywebapp -f
```

Логи nginx:

```bash
sudo tail -f /var/log/nginx/mywebapp.access.log
sudo tail -f /var/log/nginx/mywebapp.error.log
```

### Використання

- Відкрити в браузері: `http://localhost:8080/`
- `curl -X POST http://localhost:8080/tasks -H "Content-Type: application/json" -d '{"title":"Test"}'`
- `curl http://localhost:8080/tasks`

Перевірка health-ендпоінтів виконується зсередини ВМ (напряму до застосунку):

```bash
vagrant ssh
curl http://127.0.0.1:5200/health/alive
curl http://127.0.0.1:5200/health/ready
```

Користувач operator:

```bash
sudo systemctl status mywebapp
sudo systemctl restart mywebapp
sudo systemctl reload nginx
```