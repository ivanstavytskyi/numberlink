FROM nginx:1.27-alpine
RUN apk add --no-cache wget \
    && mkdir -p /var/log/nginx-access \
    && printf 'ok\n' > /usr/share/nginx/healthz
