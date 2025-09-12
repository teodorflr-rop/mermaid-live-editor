FROM docker.io/library/node:22.15.0-alpine3.21 AS mermaid-live-editor-dependencies

RUN apk --no-cache add build-base git python3 && \
    rm -rf /var/cache/apk/*

RUN corepack enable pnpm

WORKDIR /app

COPY ./package.json .
COPY ./pnpm-lock.yaml .

RUN pnpm install

FROM mermaid-live-editor-dependencies AS mermaid-live-editor-builder

ARG MERMAID_RENDERER_URL
ARG MERMAID_KROKI_RENDERER_URL
ARG MERMAID_ANALYTICS_URL
ARG MERMAID_DOMAIN
ARG MERMAID_IS_ENABLED_MERMAID_CHART_LINKS
ARG MERMAID_VIEW_ONLY_MODE
ARG MERMAID_BASE_PATH=""

COPY . ./

# Conditionally set base path in svelte.config.js based on build argument
RUN if [ "$MERMAID_BASE_PATH" != "" ]; then \
    sed -i "s|adapter: adapter({|paths: { base: '$MERMAID_BASE_PATH' },\\n    adapter: adapter({|" svelte.config.js; \
    fi

RUN NODE_OPTIONS="--max_old_space_size=4096" pnpm build

FROM mermaid-live-editor-builder AS mermaid-dev
LABEL stage="dev"
# The dev stage is kept for convenience, but we don't set a global ENTRYPOINT here
# to avoid accidentally making derived images run the dev server by default.

FROM nginx:1.28-alpine3.21 AS mermaid

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=mermaid-live-editor-builder /app/docs /usr/share/nginx/html
EXPOSE 80

# Run nginx in the foreground (production mode)
CMD ["nginx", "-g", "daemon off;"]
