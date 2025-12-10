<?php
// File: api/config.php
// Description: Global configuration for the application, especially SMTP settings.

// ----------------------------------------------------
// REQUIRED: CONFIGURE YOUR REAL EMAIL SETTINGS HERE
// (Use an App Password if you are using Gmail)
// ----------------------------------------------------
define('SMTP_HOST', 'smtp.gmail.com');      // Host for Gmail
define('SMTP_USERNAME', 'www.ahmadreda1234567890@gmail.com'); // Your email address (UPDATED)
define('SMTP_PASSWORD', 'iqya wwoy pqng ikdf'); // Your email password or App Password (UPDATED)
define('SMTP_PORT', 587);                     // 587 for TLS, 465 for SSL
define('SMTP_SECURE', 'tls');                 // 'tls' or 'ssl'

// Sender Details (Updated to match the authentication email)
define('MAIL_FROM_EMAIL', 'www.ahmadreda1234567890@gmail.com'); // Email address that appears as the sender
define('MAIL_FROM_NAME', 'Project Lab - Assistenza'); // Name that appears as the sender
?>