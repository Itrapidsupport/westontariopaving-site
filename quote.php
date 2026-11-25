<?php
// West Ontario Paving quote form handler (ITRS, 2026-11-24).
// Sends to office@ via the HostPapa server's mail(); envelope sender on our domain so SPF (+a) passes and DMARC aligns.
declare(strict_types=1);
const TO = 'office@westontariopaving.com';
const FROM = 'website@westontariopaving.com';

function back(string $msg, bool $ok): void {
    $title = $ok ? 'Thanks, we got your request' : 'Something went wrong';
    $body = htmlspecialchars($msg, ENT_QUOTES);
    http_response_code($ok ? 200 : 400);
    header('Content-Type: text/html; charset=utf-8');
    echo "<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><meta name=robots content=noindex><title>$title | West Ontario Paving</title>"
       . "<style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f5f3ef;color:#231F20;margin:0;display:grid;place-items:center;min-height:100vh;padding:24px}main{max-width:560px}h1{font-size:2rem;margin:0 0 .5em}a.b{display:inline-block;margin-top:1.2em;background:#C8161D;color:#fff;padding:.9em 1.4em;border-radius:999px;text-decoration:none;font-weight:600}</style></head>"
       . "<body><main><img src='/logo.svg' alt='West Ontario Paving' width=180><h1>$title</h1><p>$body</p><p>Prefer to talk? Call <a href='tel:+18444672831'>1-844-467-2831</a>.</p><a class=b href='/'>Back to the home page</a></main></body></html>";
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: /request-a-quote/', true, 303); exit; }
if (!empty($_POST['website'])) { back('Thanks. We will be in touch within one business day.', true); } // honeypot

$f = fn(string $k): string => trim(str_replace(["\r", "\n"], ' ', (string)($_POST[$k] ?? '')));
$name = $f('Name'); $email = $f('Email'); $phone = $f('Phone'); $type = $f('Type_of_work');
$city = $f('City'); $addr = $f('Address'); $int = $f('Main_intersection'); $time = $f('Best_time_to_call');
$msg = trim((string)($_POST['Message'] ?? ''));
if ($name === '' || $phone === '' || $city === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    back('Please go back and fill in your name, a valid email address, your phone number and your city.', false);
}
if (mb_strlen($msg) > 5000 || preg_match_all('#https?://#i', $msg) > 3) { back('Please shorten your message and remove links, then try again.', false); }

$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$lines = [
  "New quote request from westontariopaving.com", "",
  "Name: $name", "Email: $email", "Phone: $phone", "Type of work: $type",
  "Address: $addr", "City: $city, Ontario", "Main intersection: $int", "Best time to call: $time", "",
  "Project details:", $msg === '' ? '(none)' : $msg, "",
  "Sent " . date('Y-m-d H:i T') . " from IP $ip",
];
$subject = 'Quote request: ' . mb_substr($name, 0, 60) . ' (' . mb_substr($city, 0, 40) . ')';
$headers = [
  'From: West Ontario Paving website <' . FROM . '>',
  'Reply-To: ' . mb_substr($name, 0, 60) . ' <' . $email . '>',
  'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'X-WOP-Form: quote',
];
$ok = mail(TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', implode("\r\n", $lines), implode("\r\n", $headers), '-f' . FROM);
@file_put_contents(__DIR__ . '/../wop-form-log.txt', date('c') . " ok=" . ($ok ? 1 : 0) . " ip=$ip\n", FILE_APPEND);
$ok ? back('Thanks, ' . $name . '. Your request is with our office and we will get back to you within one business day.', true)
    : back('Your request could not be sent. Please call us at 1-844-467-2831 or email office@westontariopaving.com.', false);
