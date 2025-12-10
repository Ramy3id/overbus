<?php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(["success" => false, "message" => "Metodo non consentito"], 405);
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    sendJson(["success" => false, "message" => "Devi effettuare il login per completare l'ordine."], 401);
}

$input = json_decode(file_get_contents("php://input"), true);
$cart = $input['cart'] ?? [];
$shipping = $input['shipping'] ?? [];

if (empty($cart)) {
    sendJson(["success" => false, "message" => "Il carrello è vuoto."], 400);
}

try {
    $conn->beginTransaction();

    // Calculate total (Server side calculation for security)
    $totalAmount = 9.99; // Shipping cost
    foreach ($cart as $item) {
        $stmt = $conn->prepare("SELECT price FROM products WHERE id = ?");
        $stmt->execute([$item['id']]);
        $price = $stmt->fetchColumn();
        if ($price) {
            $totalAmount += ($price * $item['quantity']);
        }
    }

    // Create Order
    $addressString = $shipping['address'] . ", " . $shipping['city'] . " " . $shipping['zipCode'];
    $stmt = $conn->prepare("INSERT INTO orders (user_id, total_amount, shipping_address) VALUES (?, ?, ?)");
    $stmt->execute([$_SESSION['user_id'], $totalAmount, $addressString]);
    $orderId = $conn->lastInsertId();

    // Insert Order Items
    $sqlItem = "INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)";
    $stmtItem = $conn->prepare($sqlItem);

    foreach ($cart as $item) {
        $stmtItem->execute([$orderId, $item['id'], $item['quantity'], $item['price']]);
    }

    $conn->commit();
    sendJson(["success" => true, "message" => "Ordine #$orderId completato con successo!"]);

} catch (Exception $e) {
    $conn->rollBack();
    sendJson(["success" => false, "message" => "Errore durante l'elaborazione dell'ordine: " . $e->getMessage()], 500);
}
?>