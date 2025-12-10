<?php
require_once 'db.php';

// Check if products already exist to avoid duplicates
$stmt = $conn->query("SELECT COUNT(*) FROM products");
if ($stmt->fetchColumn() > 0) {
    sendJson(["success" => false, "message" => "I dati sono già stati importati."]);
}

// Read JSON file (Assuming the file is in data/products.json relative to project root)
$jsonPath = '../data/products.json'; 

if (!file_exists($jsonPath)) {
    sendJson(["success" => false, "message" => "File JSON non trovato."], 404);
}

$jsonData = file_get_contents($jsonPath);
$products = json_decode($jsonData, true);

try {
    $conn->beginTransaction();

    foreach ($products as $product) {
        // Insert product
        $sql = "INSERT INTO products (name, description, full_details, category, price, rating, reviews_count) 
                VALUES (:name, :description, :fullDetails, :category, :price, :rating, :reviews)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':name' => $product['name'],
            ':description' => $product['description'],
            ':fullDetails' => $product['fullDetails'],
            ':category' => $product['category'],
            ':price' => $product['price'],
            ':rating' => $product['rating'],
            ':reviews' => $product['reviews']
        ]);
        
        $productId = $conn->lastInsertId();

        // Insert images
        foreach ($product['images'] as $image) {
            $sqlImg = "INSERT INTO product_images (product_id, image_url) VALUES (:pid, :url)";
            $stmtImg = $conn->prepare($sqlImg);
            $stmtImg->execute([':pid' => $productId, ':url' => $image]);
        }
    }

    $conn->commit();
    sendJson(["success" => true, "message" => "Prodotti importati con successo nel database!"]);

} catch (Exception $e) {
    $conn->rollBack();
    sendJson(["success" => false, "message" => "Errore durante l'importazione: " . $e->getMessage()], 500);
}
?>