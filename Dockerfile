# БАЗА САЙТ — статические HTML-страницы + send.php (обработка форм)
FROM php:8.3-apache

# Копируем сайт в корень веб-сервера
COPY . /var/www/html/

# Apache слушает порт 80
EXPOSE 80
