<?php
require_once 'db.php';

// Fetch all products
$sql = "SELECT p.*, GROUP_CONCAT(pi.image_url) as images 
        FROM products p 
        LEFT JOIN product_images pi ON p.id = pi.product_id 
        GROUP BY p.id";

$stmt = $conn->query($sql);
$productsRaw = $stmt->fetchAll();

$products = array_map(function($p) {
    // Convert comma-separated images string back to array
    $p['images'] = $p['images'] ? explode(',', $p['images']) : [];
    // Cast types for consistency with JS expectation
    $p['id'] = (int)$p['id'];
    $p['price'] = (float)$p['price'];
    $p['rating'] = (float)$p['rating'];
    $p['reviews'] = (int)$p['reviews_count']; // Map reviews_count to reviews key
    return $p;
}, $productsRaw);

sendJson($products);
?>