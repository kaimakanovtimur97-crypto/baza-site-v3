<?php
/**
 * БАЗА — приём заявок с форм (Timeweb, PHP mail).
 * Поменяйте $to на свою почту. Если письма не доходят —
 * в панели Timeweb включите отправку почты для домена или используйте SMTP.
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	http_response_code(405);
	echo json_encode(['ok' => false, 'error' => 'method']);
	exit;
}

// Ханипот от ботов: скрытое поле должно быть пустым
if (!empty($_POST['website'])) {
	echo json_encode(['ok' => true]);
	exit;
}

$to = 'atanasov5nikita@gmail.com'; // ← почта для заявок

$name    = trim(strip_tags($_POST['name'] ?? ''));
$phone   = trim(strip_tags($_POST['phone'] ?? ''));
$problem = trim(strip_tags($_POST['problem'] ?? ''));
$page    = trim(strip_tags($_POST['page'] ?? ''));

if ($name === '' || $phone === '') {
	http_response_code(400);
	echo json_encode(['ok' => false, 'error' => 'fields']);
	exit;
}

$subject = 'Заявка с сайта БАЗА: ' . $name;
$body  = "Имя: {$name}\n";
$body .= "Телефон: {$phone}\n";
if ($problem !== '') $body .= "Суть проблемы: {$problem}\n";
if ($page !== '')    $body .= "Страница: {$page}\n";
$body .= 'Время: ' . date('d.m.Y H:i');

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=utf-8\r\n";
$headers .= 'From: noreply@' . ($_SERVER['HTTP_HOST'] ?? 'site.ru') . "\r\n";

$sent = mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);

if ($sent) {
	echo json_encode(['ok' => true]);
} else {
	http_response_code(500);
	echo json_encode(['ok' => false, 'error' => 'mail']);
}
