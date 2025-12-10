<?php
// File: api/send_email.php
// Description: Wrapper function for PHPMailer to send emails.

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// IMPORTANT: Assume PHPMailer files are available in the 'vendor/PHPMailer/src/' directory
require '../vendor/PHPMailer/src/Exception.php';
require '../vendor/PHPMailer/src/PHPMailer.php';
require '../vendor/PHPMailer/src/SMTP.php';

require_once 'config.php'; // Load configuration

/**
 * Sends an email using PHPMailer library.
 * @param string $to Email recipient address.
 * @param string $subject Email subject line.
 * @param string $body HTML content of the email.
 * @return bool True on success, false on failure.
 */
function sendEmail($to, $subject, $body) {
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USERNAME;
        $mail->Password   = SMTP_PASSWORD;
        $mail->SMTPSecure = SMTP_SECURE;
        $mail->Port       = SMTP_PORT;
        
        // Use Italian language for PHPMailer error messages
        $mail->setLanguage('it'); 

        // Sender (From) - Uses the configured email
        $mail->setFrom(MAIL_FROM_EMAIL, MAIL_FROM_NAME);
        
        // Recipient (To)
        $mail->addAddress($to);

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = strip_tags($body); // Plain text body for non-HTML mail clients

        $mail->send();
        return true;
    } catch (Exception $e) {
        // Log the error internally for debugging
        error_log("Email non inviata a $to. Mailer Error: {$mail->ErrorInfo}");
        return false;
    }
}
?>