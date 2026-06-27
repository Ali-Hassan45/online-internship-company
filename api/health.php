<?php
require_once __DIR__ . '/../config/config.php';

try {
    db()->query("SELECT 1");
    json_response(['success' => true, 'message' => 'Backend JSON and database connection are working.']);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Backend/database error: ' . $e->getMessage()], 500);
}
?>
