<?php
// File: api/auth.php (UPDATED)
// Description: Handles all user authentication actions (register, login, verify, reset).
require_once 'db.php';
require_once 'send_email.php'; // Include email sender wrapper

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Handle Registration
if ($action === 'register' && $method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Basic Validation
    if (empty($data['email']) || empty($data['password'])) {
        sendJson(["success" => false, "message" => "Tutti i campi sono obbligatori."], 400);
    }

    // Check if email exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        sendJson(["success" => false, "message" => "Email già registrata."], 409);
    }

    // Hash Password
    $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
    $activationToken = bin2hex(random_bytes(32));

    try {
        $sql = "INSERT INTO users (first_name, last_name, email, password, phone, gender, birth_date, is_active, activation_token) 
                VALUES (:nome, :cognome, :email, :password, :telefono, :genere, :dataNascita, 0, :token)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':nome' => $data['nome'],
            ':cognome' => $data['cognome'],
            ':email' => $data['email'],
            ':password' => $hashedPassword,
            ':telefono' => $data['telefono'],
            ':genere' => $data['genere'],
            ':dataNascita' => $data['dataNascita'],
            ':token' => $activationToken
        ]);

        // Build Activation Email Content
        $activationLink = "http://localhost/project-lab/api/auth.php?action=verify&token=" . $activationToken;
        $subject = "Attiva il tuo account Project Lab";
        $body = "
            <h1>Ciao {$data['nome']},</h1>
            <p>Grazie per esserti registrato. Per attivare il tuo account, fai clic sul link sottostante:</p>
            <p><a href='{$activationLink}'>Attiva il mio Account</a></p>
            <p>Se non hai richiesto questa registrazione، ignora questa email.</p>
        ";
        
        // Send email and check status
        if (!sendEmail($data['email'], $subject, $body)) {
            // Log failure and send a generic server error
            // We still proceed with success message to user as the registration succeeded, 
            // but log the email failure.
            sendJson(["success" => false, "message" => "Registrazione riuscita ma l'invio dell'email di attivazione è fallito. Contatta l'assistenza."], 500);
        }

        sendJson(["success" => true, "message" => "Registrazione avvenuta con successo! Controlla la tua email per attivare l'account."]);

    } catch (Exception $e) {
        error_log("Registration DB Error: " . $e->getMessage());
        sendJson(["success" => false, "message" => "Errore del server durante la registrazione."], 500);
    }
}

// Handle Login (No change needed)
if ($action === 'login' && $method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch();

    if ($user && password_verify($data['password'], $user['password'])) {
        if ($user['is_active'] == 0) {
            sendJson(["success" => false, "message" => "Account non attivato. Controlla la tua email."], 403);
        }

        // Set Session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['first_name'];
        $_SESSION['user_email'] = $user['email'];

        sendJson(["success" => true, "message" => "Login effettuato con successo!"]);
    } else {
        sendJson(["success" => false, "message" => "Credenziali non valide."], 401);
    }
}

// Handle Email Verification (No change needed)
if ($action === 'verify' && $method === 'GET') {
    $token = $_GET['token'] ?? '';
    $stmt = $conn->prepare("UPDATE users SET is_active = 1, activation_token = NULL WHERE activation_token = ?");
    $stmt->execute([$token]);

    if ($stmt->rowCount() > 0) {
        echo "<h1>Account Attivato!</h1><p>Ora puoi effettuare il login.</p><a href='../auth.html'>Vai al Login</a>";
    } else {
        echo "<h1>Link non valido o scaduto.</h1>";
    }
    exit;
}

// Handle Check Session (No change needed)
if ($action === 'check_session' && $method === 'GET') {
    if (isset($_SESSION['user_id'])) {
        sendJson([
            "success" => true, 
            "user" => [
                "id" => $_SESSION['user_id'],
                "name" => $_SESSION['user_name'],
                "email" => $_SESSION['user_email']
            ]
        ]);
    } else {
        sendJson(["success" => false, "message" => "Non autenticato"], 401);
    }
}

// Handle Get User Profile (No change needed)
if ($action === 'profile' && $method === 'GET') {
    if (!isset($_SESSION['user_id'])) sendJson(["success" => false], 401);

    $stmt = $conn->prepare("SELECT first_name, last_name, email, phone, gender, birth_date, address FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    sendJson(["success" => true, "data" => $user]);
}

// Handle Logout (No change needed)
if ($action === 'logout') {
    session_destroy();
    sendJson(["success" => true, "message" => "Logout effettuato."]);
}

// Handle Password Reset Request (Send Token) - LOGIC UPDATED TO CHECK EMAIL
if ($action === 'forgot_password' && $method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $email = $data['email'];
    
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Security Note: Always return a secure, generic message to the client
    // to prevent email enumeration attacks.
    $clientMessage = "Se l'indirizzo email è registrato، riceverai un link per reimpostare la password.";

    if ($user) {
        // ONLY proceed if the email exists in the database
        $token = bin2hex(random_bytes(32));
        // Token expires in 1 hour
        $stmt = $conn->prepare("UPDATE users SET reset_token = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?");
        $stmt->execute([$token, $user['id']]);

        // Build Reset Email Content
        $resetLink = "http://localhost/project-lab/auth.html?reset_token=" . $token;
        $subject = "Reimposta la tua password Project Lab";
        $body = "
            <h1>Reimpostazione Password</h1>
            <p>Hai richiesto la reimpostazione della password. Clicca sul link sottostante per procedere. Il link scade tra un'ora.</p>
            <p><a href='{$resetLink}'>Reimposta la Password</a></p>
            <p>Se non hai richiesto questa azione، ignora questa email.</p>
        ";
        
        // Send email
        if (!sendEmail($email, $subject, $body)) {
             // If email fails (server/network issue), log the error but still send the secure generic success message to the client.
            error_log("Password Reset Email failed for: $email");
        }
    }
    
    // Always return the secure, generic message to the client, whether email was found or not.
    sendJson(["success" => true, "message" => $clientMessage]);
}

// Handle Reset Password Action (No change needed)
if ($action === 'reset_password' && $method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $token = $data['token'];
    $newPass = $data['password'];

    $stmt = $conn->prepare("SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()");
    $stmt->execute([$token]);
    if ($stmt->fetch()) {
        $hashed = password_hash($newPass, PASSWORD_BCRYPT);
        $stmt = $conn->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE reset_token = ?");
        $stmt->execute([$hashed, $token]);
        sendJson(["success" => true, "message" => "Password aggiornata con successo."]);
    } else {
        sendJson(["success" => false, "message" => "Token non valido o scaduto."], 400);
    }
}
?>