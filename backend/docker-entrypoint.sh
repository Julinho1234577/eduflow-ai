#!/bin/sh

set -e

echo "======================================"
echo " EduFlow AI - Inicializando backend"
echo "======================================"

echo "Limpiando configuración de Laravel..."
php artisan config:clear
php artisan cache:clear || true

echo "Comprobando APP_KEY..."

if [ -z "$APP_KEY" ]; then
    echo "APP_KEY no encontrada. Generando..."
    php artisan key:generate --force
else
    echo "APP_KEY encontrada."
fi

echo "Ejecutando migraciones..."
php artisan migrate --force

USER_COUNT=$(php artisan tinker --execute="echo \\App\\Models\\User::count();")

echo "Usuarios encontrados: $USER_COUNT"

if [ "$USER_COUNT" = "0" ]; then
    echo "Base de datos nueva detectada."
    echo "Ejecutando datos demo..."
    php artisan db:seed --force
else
    echo "Base de datos existente."
    echo "No se ejecutarán los seeders."
fi

echo "======================================"
echo " Iniciando Laravel"
echo "======================================"

exec php artisan serve --host=0.0.0.0 --port=8000
