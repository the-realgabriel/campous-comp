# Docker Setup Guide

This project includes Docker configuration for running the Laravel + React application in containers with SQLite database.

## Files Created

- **Dockerfile** - Multi-stage build that:
  - Builds React/TypeScript frontend assets with Node.js
  - Creates PHP-FPM container with Nginx and Supervisor
  - Configures SQLite database (embedded, no external DB needed)
  - Runs migrations automatically on startup
  - Installs all PHP and system dependencies

- **docker-compose.yml** - Single container orchestration:
  - `app` - Main Laravel application with SQLite
  - Includes file-based caching and sessions
  - Automatic migrations on startup

- **.dockerignore** - Excludes unnecessary files from the build context

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Build and Run

```bash
# Build the Docker image and start the application
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

### Access the Application

- **Web Application**: http://localhost:8000

## Environment Variables

The docker-compose.yml uses SQLite by default. The database file is stored at `/app/database/laravel.sqlite` and persists in a Docker volume.

## Database Access

```bash
# Access SQLite CLI inside container
docker-compose exec app sqlite3 /app/database/laravel.sqlite

# Run Artisan commands
docker-compose exec app php artisan tinker

# Check application logs
docker-compose exec app tail -f storage/logs/laravel.log

# Seed the database
docker-compose exec app php artisan db:seed
```

## Development vs Production

The current setup is configured for **production**. For development:

Modify docker-compose.yml:
```yaml
environment:
  - APP_DEBUG=true
  - APP_ENV=local
```

## Troubleshooting

### Port Already in Use
If port 8000 is in use, modify docker-compose.yml:
```yaml
ports:
  - "8080:80"  # Change first port to available port
```

### Permission Denied on Database
The SQLite database permissions are set automatically. If issues persist:
```bash
docker-compose exec app chown -R www-data:www-data /app/database
```

### Reset Database
```bash
# Remove volume and restart (clears database)
docker-compose down -v
docker-compose up -d
```

## Building for Different Environments

### Production Build
```bash
docker-compose build --no-cache
```

### Push to Registry (e.g., Docker Hub)
```bash
docker tag campous-comp:latest your-registry/campous-comp:latest
docker push your-registry/campous-comp:latest
```

## Architecture

- Frontend assets are built during Docker image build (not at runtime)
- SQLite database is embedded - no external database service needed
- Queue worker runs in background via Supervisor
- Nginx serves static files and proxies PHP requests to PHP-FPM
- File-based caching and sessions (no Redis needed)
- Automatic migrations run on container startup

## Notes

- SQLite is ideal for single-server deployments
- For multi-server deployments, switch back to MySQL/PostgreSQL and Redis
- Database file persists in Docker volume `./database`
- Storage and cache files persist in Docker volumes for reliability
