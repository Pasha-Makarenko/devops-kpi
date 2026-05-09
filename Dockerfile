FROM node:24-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/router/package.json packages/router/package.json
COPY packages/router/index.js packages/router/index.js
COPY packages/router/src packages/router/src

RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY public public
COPY src src
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5200

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
