#!/bin/sh
set -e

php artisan config:clear
php artisan migrate --force

exec php-fpm
