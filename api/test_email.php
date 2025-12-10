<?php
// File: api/test_email.php
// Description: Standalone script to test SMTP connection and email sending.

// IMPORTANT: Ensure you have PHPMailer files in '../vendor/PHPMailer/src/'

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// 1. استدعاء ملفات PHPMailer
require '../vendor/PHPMailer/src/Exception.php';
require '../vendor/PHPMailer/src/PHPMailer.php';
require '../vendor/PHPMailer/src/SMTP.php';

// 2. استدعاء ملف الإعدادات
require_once 'config.php'; 

// --- إعدادات الاختبار ---
// سنرسل الاختبار إلى نفس الإيميل المستخدم للتسجيل للتبسيط
$recipientEmail = SMTP_USERNAME; 
$subject = "TEST EMAIL - PHPMailer Configuration";
$body = "<h1>Test di configurazione SMTP riuscito?</h1><p>Se vedi questo, le impostazioni SMTP funzionano! Ora prova la registrazione.</p>";

$mail = new PHPMailer(true);

try {
    // ----------------------------------------------------
    // تفعيل وضع التصحيح لعرض سجل الاتصال الكامل
    // ----------------------------------------------------
    $mail->SMTPDebug = 4; // Max debugging output
    $mail->Debugoutput = 'html'; 
    
    // Server settings
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USERNAME;
    $mail->Password   = SMTP_PASSWORD;
    $mail->SMTPSecure = SMTP_SECURE;
    $mail->Port       = SMTP_PORT;
    $mail->setLanguage('it'); 

    // Sender (From)
    $mail->setFrom(MAIL_FROM_EMAIL, MAIL_FROM_NAME);
    
    // Recipient (To)
    $mail->addAddress($recipientEmail);

    // Content
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body    = $body;
    $mail->AltBody = strip_tags($body);

    echo "<h2>▶️ سجل الاتصال (SMTP Debug Log):</h2><hr>";
    $mail->send();
    echo "<h1>✅ Successo!</h1><p>تم إرسال الإيميل بنجاح. يمكنك الآن حذف ملف test_email.php وإعادة محاولة التسجيل في auth.php.</p>";

} catch (Exception $e) {
    echo "<h2>❌ Errore critico di Mailer</h2>";
    echo "<p><strong>رسالة الخطأ الحاسمة (مفتاح حل المشكلة):</strong></p>";
    // PHPMailer's ErrorInfo contains the most critical information
    echo "<pre>" . htmlspecialchars($mail->ErrorInfo) . "</pre>";
    echo "<hr><p>الرجاء نسخ النص الذي يظهر في منطقة **Errore critico di Mailer** بالكامل وإرساله لي، سيوضح سبب الرفض من سيرفر Gmail.</p>";
}
?>