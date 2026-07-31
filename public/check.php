<?php
/**
 * أداة التشخيص التلقائي لمجلد /masa/ على استضافة cPanel / LiteSpeed
 * Diagnostic Tool for /masa/ subdirectory on cPanel/LiteSpeed
 */

header('Content-Type: text/html; charset=utf-8');

$dir = __DIR__;
$logFile = $dir . '/masa_diagnostic_log.txt';

$results = [];
$diagnoses = [];
$actionSteps = [];

// 1. فحص معلومات السيرفر
$serverSoftware = $_SERVER['SERVER_SOFTWARE'] ?? 'غير معروف';
$phpVersion = phpversion();
$documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? 'غير معروف';
$scriptPath = $_SERVER['SCRIPT_FILENAME'] ?? __FILE__;

$results['السيرفر (Web Server)'] = $serverSoftware;
$results['إصدار PHP'] = $phpVersion;
$results['المسار الحالي (Directory)'] = $dir;
$results['المسار الرئيسي (Document Root)'] = $documentRoot;

// 2. فحص وجود الملفات الأساسية وتصاريحها
$filesToCheck = [
    'index.html' => 'ملف الواجهة الرئيسي',
    '.htaccess' => 'ملف قواعد التوجيه',
    'check.php' => 'أداة التشخيص الحالي'
];

$fileCheckOutput = [];
foreach ($filesToCheck as $file => $desc) {
    $filePath = $dir . '/' . $file;
    if (file_exists($filePath)) {
        $perms = substr(sprintf('%o', fileperms($filePath)), -4);
        $size = filesize($filePath) . ' bytes';
        $fileCheckOutput[$file] = "موجود (التصريح: $perms | الحجم: $size) - $desc";
        
        if ($perms !== '0644' && $perms !== '0655') {
            $diagnoses[] = "⚠️ تصريح الملف $file هو $perms (الموصى به 0644).";
        }
    } else {
        $fileCheckOutput[$file] = "❌ غير موجود!";
        $diagnoses[] = "🚨 الملف الأساسي $file مفقود من داخل المجلد!";
    }
}
$results['فحص الملفات الأساسية'] = $fileCheckOutput;

// 3. فحص مجلد الأصول assets
$assetsDir = $dir . '/assets';
if (is_dir($assetsDir)) {
    $assetsFiles = array_diff(scandir($assetsDir), ['.', '..']);
    $results['مجلد assets'] = "موجود ويحتوي على " . count($assetsFiles) . " ملف/ملفات.";
} else {
    $results['مجلد assets'] = "❌ غير موجود أو لم يتم رفع مجلد assets بنجاح!";
    $diagnoses[] = "🚨 مجلد assets مفقود. تطبيق React لن يعمل بدون ملفات JS/CSS الموجودة بداخل assets.";
}

// 4. كشف تداخل Node.js / LiteSpeed / Phusion Passenger (السبب الرئيسي لخطأ SyntaxError: Unexpected token '<')
$nodeDetected = false;
if (isset($_ENV['PASSENGER_APP_ENV']) || isset($_SERVER['PASSENGER_APP_ENV']) || strpos($serverSoftware, 'lsnode') !== false) {
    $nodeDetected = true;
}

// فحص محتوى .htaccess للتأكد من وجود تعليق Passenger
$htaccessContent = file_exists($dir . '/.htaccess') ? file_get_contents($dir . '/.htaccess') : '';

if (strpos($htaccessContent, 'lsnode') !== false || strpos($htaccessContent, 'PassengerAppRoot') !== false) {
    $nodeDetected = true;
    $diagnoses[] = "🚨 تم كشف قواعد Node.js / Phusion Passenger داخل .htaccess في المجلد!";
}

// 5. التحليل الدقيق وتحديد المشكلة والحلول
if ($nodeDetected || file_exists($dir . '/app.js') || file_exists($dir . '/server.js')) {
    $diagnoses[] = "🚨 المشكلة الأساسية: تطبيق Node.js مفعّل على هذا المجلد في cPanel (عبر Setup Node.js App أو LiteSpeed lsnode). قم بإلغائه فوراً لأن تطبيق React هو تطبيق استاتيكي (Static HTML/JS) لا يحتاج محرك Node.js على السيرفر!";
    
    $actionSteps[] = "اذهب إلى لوحة تحكم cPanel -> اختر (Setup Node.js App).";
    $actionSteps[] = "ابحث عن التطبيق المربوط بالمجلد masa أو louts.co/masa وقم بعمله Destroy أو Delete Remove Application.";
    $actionSteps[] = "أو تأكد من حذف ملفات Node مثل app.js أو server.js إن وجدت داخل المجلد masa.";
}

if (file_exists($dir . '/index.html')) {
    $indexContent = file_get_contents($dir . '/index.html');
    if (strpos($indexContent, '/masa/') === false && strpos($indexContent, './assets') === false && strpos($indexContent, 'assets/') === false) {
        $diagnoses[] = "⚠️ تنبيه: مسارات الملفات في index.html قد لا تكون نسبية بشكل صحيح.";
    }
}

// إنشاء تقرير النتيجه في ملف masa_diagnostic_log.txt
$logContent = "========================================================\n";
$logContent .= "     تقرير تشخيص سيرفر cPanel / LiteSpeed لمجلد /masa/ \n";
$logContent .= "     التاريخ والوقت: " . date('Y-m-d H:i:s') . "\n";
$logContent .= "========================================================\n\n";

foreach ($results as $key => $val) {
    $logContent .= "[$key]:\n";
    if (is_array($val)) {
        foreach ($val as $k => $v) {
            $logContent .= "  - $k: $v\n";
        }
    } else {
        $logContent .= "  $val\n";
    }
    $logContent .= "\n";
}

$logContent .= "--------------------------------------------------------\n";
$logContent .= "التشخيص والمشاكل المكتشفة (Diagnostic Issues):\n";
$logContent .= "--------------------------------------------------------\n";
if (empty($diagnoses)) {
    $logContent .= "✅ لم يتم العثور على أخطاء هيكلية ظاهرة. الخادم مهيأ لقراءة الملفات الاستاتيكية.\n";
} else {
    foreach ($diagnoses as $diag) {
        $logContent .= "$diag\n";
    }
}

$logContent .= "\n--------------------------------------------------------\n";
$logContent .= "خطوات الحل المطلوبة فوراً (Action Steps):\n";
$logContent .= "--------------------------------------------------------\n";
if (!empty($actionSteps)) {
    foreach ($actionSteps as $idx => $step) {
        $logContent .= ($idx + 1) . ". $step\n";
    }
} else {
    $logContent .= "1. تأكد من زيارة الرابط المباشر https://louts.co/masa/index.html في المتصفح.\n";
    $logContent .= "2. تأكد من أن تصريحات مجلد masa هي 0755 والملفات 0644.\n";
}

file_put_contents($logFile, $logContent);

?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>أداة التشخيص التلقائي - مجلد Masa</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            padding: 2rem;
            max-width: 900px;
            margin: 0 auto;
            line-height: 1.6;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
            border: 1px solid #e2e8f0;
        }
        h1 { color: #1e293b; font-size: 1.5rem; margin-top: 0; }
        h2 { color: #334155; font-size: 1.2rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; }
        .badge-success { background: #dcfce7; color: #166534; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: bold; }
        .badge-error { background: #fee2e2; color: #991b1b; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: bold; }
        .badge-warning { background: #fef3c7; color: #92400e; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: bold; }
        pre {
            background: #0f172a;
            color: #38bdf8;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            direction: ltr;
            text-align: left;
            font-size: 0.9rem;
        }
        .btn {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 0.6rem 1.2rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 1rem;
        }
        .btn:hover { background: #1d4ed8; }
        ul { padding-right: 1.2rem; }
        li { margin-bottom: 0.5rem; }
    </style>
</head>
<body>

    <div class="card">
        <h1>🔍 تقرير التشخيص التلقائي للاستضافة (مجلد /masa/)</h1>
        <p>تم إعداد هذا التقرير تلقائياً عبر قراءة بيئة الخادم والملفات المرفوعة.</p>
        <a href="masa_diagnostic_log.txt" target="_blank" class="btn">📄 فتح ملف اللوج masa_diagnostic_log.txt</a>
    </div>

    <div class="card">
        <h2>🚨 المشكلة المكتشفة والسبب المباشر</h2>
        <?php if (!empty($diagnoses)): ?>
            <ul>
                <?php foreach ($diagnoses as $diag): ?>
                    <li style="color: #b91c1c; font-weight: 600;"><?php echo htmlspecialchars($diag); ?></li>
                <?php endforeach; ?>
            </ul>
        <?php else: ?>
            <p><span class="badge-success">ممتاز</span> لم يتم كشف أخطاء تمنع الخادم من قراءة الملفات.</p>
        <?php endif; ?>
    </div>

    <?php if (!empty($actionSteps)): ?>
    <div class="card" style="border-right: 6px solid #ef4444;">
        <h2 style="color: #b91c1c;">🛠️ خطوات الحل الدقيقة والخطوات الواجب اتخاذها في cPanel</h2>
        <ol>
            <?php foreach ($actionSteps as $step): ?>
                <li style="font-size: 1.05rem; font-weight: 600;"><?php echo htmlspecialchars($step); ?></li>
            <?php endforeach; ?>
        </ol>
    </div>
    <?php endif; ?>

    <div class="card">
        <h2>📋 تفاصيل بيئة الخادم والملفات</h2>
        <table>
            <?php foreach ($results as $key => $val): ?>
                <tr>
                    <td style="font-weight: bold; padding: 0.4rem 0 0.4rem 1rem; vertical-align: top; width: 220px;"><?php echo htmlspecialchars($key); ?>:</td>
                    <td style="padding: 0.4rem 0;">
                        <?php if (is_array($val)): ?>
                            <ul style="margin:0; padding-right:1rem;">
                                <?php foreach ($val as $k => $v): ?>
                                    <li><strong><?php echo htmlspecialchars($k); ?>:</strong> <?php echo htmlspecialchars($v); ?></li>
                                <?php endforeach; ?>
                            </ul>
                        <?php else: ?>
                            <code><?php echo htmlspecialchars($val); ?></code>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </table>
    </div>

    <div class="card">
        <h2>📄 سجل اللوج الكامل (Log File Output)</h2>
        <pre><?php echo htmlspecialchars($logContent); ?></pre>
    </div>

</body>
</html>
