# Build stage for frontend assets
FROM node:22-alpine AS frontend-builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY resources ./resources
COPY vite.config.ts eslint.config.js tsconfig.json components.json ./
RUN npm run build

# Main application stage
FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    zip \
    unzip \
    mysql-client \
    nginx \
    supervisor

# Install PHP extensions
RUN docker-php-ext-install \
    pdo \
    pdo_sqlite \
    bcmath \
    ctype \
    fileinfo \
    json \
    mbstring \
    openssl \
    tokenizer \
    xml

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application files
COPY . .

# Copy built frontend assets from builder stage
COPY --from=frontend-builder /app/public/build ./public/build

# Install PHP dependencies
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Create SQLite database directory and file
RUN mkdir -p /app/database && \
    touch /app/database/laravel.sqlite && \
    chown -R www-data:www-data /app/storage /app/bootstrap/cache /app/database && \
    chmod -R 775 /app/database

# Configure Nginx
RUN mkdir -p /etc/nginx/sites-enabled
COPY <<EOF /etc/nginx/sites-available/default
server {
    listen 80;
    server_name _;
    root /app/public;
    index index.php;

    client_max_body_size 100M;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Configure Supervisor
COPY <<EOF /etc/supervisor/conf.d/laravel.conf
[program:php-fpm]
command=php-fpm
autostart=true
autorestart=true
stderr_logfile=/var/log/php-fpm.err.log

[program:nginx]
command=nginx -g 'daemon off;'
autostart=true
autorestart=true
stderr_logfile=/var/log/nginx.err.log

[program:laravel-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /app/artisan queue:work --sleep=3 --tries=3 --timeout=90
autostart=true
autorestart=true
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/laravel-worker.log
EOF

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Run migrations on container start
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'php /app/artisan migrate --force' >> /entrypoint.sh && \
    echo 'exec /usr/bin/supervisord -c /etc/supervisor/conf.d/laravel.conf' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Start services
CMD ["/entrypoint.sh"]
