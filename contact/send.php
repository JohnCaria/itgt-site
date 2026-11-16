<?php
/* ITGT contact form handler: mails the request to info@ and keeps a server-side copy. */
declare(strict_types=1);
mb_internal_encoding('UTF-8');
date_default_timezone_set('Europe/Istanbul');

const TO      = 'info@itgovernanceturkey.com';
const FROM    = 'info@itgovernanceturkey.com';
const DATADIR_OUT = __DIR__ . '/../../itgt-contact-data';   // outside public_html when the host allows it
const DATADIR_IN  = __DIR__ . '/../contact-data';
const MAX_PER_HOUR = 5;

$lang = (($_POST['lang'] ?? 'en') === 'tr') ? 'tr' : 'en';
$back = $lang === 'tr' ? '/tr/contact/' : '/contact/';
$ajax = (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch');

function finish(bool $ok, string $err = ''): void {
    global $ajax, $back;
    if ($ajax) {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        if (!$ok) http_response_code($err === 'need' ? 422 : ($err === 'rate' ? 429 : 500));
        echo json_encode(['ok' => $ok, 'error' => $err]);
    } else {
        header('Location: ' . $back . ($ok ? '?sent=1' : '?error=' . rawurlencode($err ?: 'send')) . '#contact', true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Location: ' . $back, true, 303); exit; }

$field = static function (string $k, int $max = 300): string {
    $v = (string)($_POST[$k] ?? '');
    $v = str_replace(["\0", "\r"], '', $v);
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return trim(mb_substr($v, 0, $max));
};
$oneLine = static fn(string $v): string => trim(preg_replace('/\s+/u', ' ', $v) ?? '');

if ($field('website') !== '') finish(true);          // honeypot: bots get a silent "ok"

$d = [
    'name'  => $oneLine($field('name', 120)),
    'org'   => $oneLine($field('org', 160)),
    'role'  => $oneLine($field('role', 120)),
    'email' => $oneLine($field('email', 160)),
    'topic' => $oneLine($field('topic', 160)),
    'score' => $oneLine($field('score', 60)),
    'msg'   => $field('msg', 5000),
];
if ($d['name'] === '' || $d['org'] === '' || !filter_var($d['email'], FILTER_VALIDATE_EMAIL) || empty($_POST['consent'])) finish(false, 'need');

$dir = DATADIR_OUT;
if (!is_dir($dir) && !@mkdir($dir, 0750, true)) { $dir = DATADIR_IN; @mkdir($dir, 0750, true); }
if (!is_writable($dir)) { $dir = DATADIR_IN; @mkdir($dir, 0750, true); }
define('DATADIR', $dir);
if (!is_file(DATADIR . '/.htaccess')) {
    @file_put_contents(DATADIR . '/.htaccess', "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nOrder allow,deny\nDeny from all\n</IfModule>\n");
    @file_put_contents(DATADIR . '/index.html', '');
}

/* simple per-IP rate limit */
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
$rl = DATADIR . '/rate-' . substr(hash('sha256', $ip . '|itgt'), 0, 16) . '.txt';
$now = time();
$hits = array_filter(array_map('intval', @file($rl, FILE_IGNORE_NEW_LINES) ?: []), static fn($t) => $t > $now - 3600);
if (count($hits) >= MAX_PER_HOUR) finish(false, 'rate');
$hits[] = $now;
@file_put_contents($rl, implode("\n", $hits), LOCK_EX);

/* server-side copy, one JSON line per request */
$record = $d + ['lang' => $lang, 'time' => date('c'), 'ip_hash' => substr(hash('sha256', $ip), 0, 12)];
$logged = @file_put_contents(DATADIR . '/requests-' . date('Y-m') . '.jsonl', json_encode($record, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX) !== false;

$labels = $lang === 'tr'
    ? ['name' => 'Ad Soyad', 'org' => 'Kurum', 'role' => 'Rol', 'email' => 'E-posta', 'topic' => 'Konu', 'score' => 'Teşhis skoru', 'msg' => 'Mesaj']
    : ['name' => 'Full name', 'org' => 'Organization', 'role' => 'Role', 'email' => 'Email', 'topic' => 'Topic', 'score' => 'Diagnostic score', 'msg' => 'Message'];
$body = "Web sitesi iletişim formu / Website contact form\n\n";
foreach ($labels as $k => $l) { $body .= $l . ': ' . ($d[$k] !== '' ? $d[$k] : '-') . "\n"; }
$body .= "\nDil / Language: " . strtoupper($lang) . "\nZaman / Time: " . date('Y-m-d H:i') . "\n";

$subject = '=?UTF-8?B?' . base64_encode('Görüşme talebi / Website: ' . $d['org'] . ' – ' . $d['name']) . '?=';
$headers = implode("\r\n", [
    'From: ITGT Website <' . FROM . '>',
    'Reply-To: ' . $d['email'],
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: ITGT-Site',
]);
$sent = @mail(TO, $subject, $body, $headers, '-f' . FROM);

if ($sent || $logged) finish(true);
finish(false, 'send');
