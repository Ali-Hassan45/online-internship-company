<?php
// AH Nexues Lab Internship Portal - Database Config
// XAMPP defaults: user=root, password empty

ini_set('display_errors', '0');
error_reporting(E_ALL);
if (!ob_get_level()) { ob_start(); }

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('DB_HOST', 'localhost');
define('DB_NAME', 'ah_nexues_lab_portal');
define('DB_USER', 'root');
define('DB_PASS', '');

function db(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';

        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
    }

    return $pdo;
}

function json_response(array $data, int $status = 200): void {
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function request_data(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (is_array($data)) {
        return $data;
    }

    return $_POST ?: [];
}

function current_user_id(): ?int {
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}

function require_login(): int {
    $id = current_user_id();

    if (!$id) {
        json_response(['success' => false, 'message' => 'Please login first.'], 401);
    }

    return $id;
}

function get_portal_user(): ?array {
    $id = current_user_id();

    if (!$id) {
        return null;
    }

    $stmt = db()->prepare("SELECT id, full_name, email, phone, username, dob, role, company_name, skills, education, saved_json, created_at FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    if (!$user) {
        return null;
    }

    return format_user($user);
}

function format_user(array $user): array {
    return [
        'id' => (int) $user['id'],
        'fullName' => $user['full_name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'username' => $user['username'],
        'dob' => $user['dob'],
        'role' => $user['role'],
        'companyName' => $user['company_name'] ?: ($user['role'] === 'company' ? 'AH Nexues Lab' : ''),
        'skills' => $user['skills'] ?: '',
        'education' => $user['education'] ?: '',
        'saved' => json_decode($user['saved_json'] ?: '[]', true) ?: [],
        'createdAt' => $user['created_at']
    ];
}

function log_activity(int $userId, string $message): void {
    $stmt = db()->prepare("INSERT INTO activities (user_id, message) VALUES (?, ?)");
    $stmt->execute([$userId, $message]);
}

function notify_user(int $userId, string $message): void {
    $stmt = db()->prepare("INSERT INTO notifications (user_id, message) VALUES (?, ?)");
    $stmt->execute([$userId, $message]);
}

function validate_register(array $data): array {
    $errors = [];

    $fullName = trim($data['full_name'] ?? '');
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $username = trim($data['username'] ?? '');
    $dob = trim($data['dob'] ?? '');
    $role = trim($data['role'] ?? '');
    $password = $data['password'] ?? '';
    $confirm = $data['confirm_password'] ?? '';

    if (!preg_match('/^[A-Za-z ]{3,80}$/', $fullName)) {
        $errors[] = 'Full name must be 3-80 letters only.';
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Enter a valid email address.';
    }

    if (!preg_match('/^03[0-9]{9}$/', $phone)) {
        $errors[] = 'Phone must be Pakistani format: 03XXXXXXXXX.';
    }

    if (!preg_match('/^[A-Za-z0-9_]{4,20}$/', $username)) {
        $errors[] = 'Username must be 4-20 characters using letters, numbers or underscore.';
    }

    if (!$dob) {
        $errors[] = 'Date of birth is required.';
    } else {
        try {
            $birth = new DateTime($dob);
            $today = new DateTime();

            if ($birth >= $today) {
                $errors[] = 'Date of birth cannot be future date.';
            } elseif ($today->diff($birth)->y < 13) {
                $errors[] = 'Minimum age should be 13 years.';
            }
        } catch (Exception $e) {
            $errors[] = 'Invalid date of birth.';
        }
    }

    if (!in_array($role, ['student', 'company'], true)) {
        $errors[] = 'Select valid account type.';
    }

    if (
        strlen($password) < 10 ||
        !preg_match('/[A-Z]/', $password) ||
        !preg_match('/[a-z]/', $password) ||
        !preg_match('/[0-9]/', $password) ||
        !preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)
    ) {
        $errors[] = 'Password must be 10+ characters with uppercase, lowercase, number and special character.';
    }

    if ($password !== $confirm) {
        $errors[] = 'Confirm password does not match.';
    }

    return $errors;
}

function format_internship(array $row): array {
    return [
        'id' => (int) $row['id'],
        'companyId' => (int) $row['company_id'],
        'companyName' => $row['company_name'] ?: 'AH Nexues Lab',
        'title' => $row['title'],
        'category' => $row['category'],
        'mode' => $row['mode'],
        'location' => $row['location'],
        'duration' => $row['duration'],
        'stipend' => (int) $row['stipend'],
        'deadline' => $row['deadline'],
        'skills' => $row['skills'],
        'description' => $row['description'],
        'createdAt' => $row['created_at']
    ];
}

function format_application(array $row): array {
    return [
        'id' => (int) $row['id'],
        'internshipId' => (int) $row['internship_id'],
        'studentId' => (int) $row['student_id'],
        'studentName' => $row['student_name'],
        'studentEmail' => $row['student_email'],
        'resumeUrl' => $row['resume_url'],
        'coverLetter' => $row['cover_letter'],
        'status' => $row['status'],
        'interviewDate' => $row['interview_date'] ? date('Y-m-d\TH:i', strtotime($row['interview_date'])) : '',
        'feedback' => $row['feedback'] ?: '',
        'appliedAt' => $row['applied_at']
    ];
}

function format_notification(array $row): array {
    return [
        'id' => (int) $row['id'],
        'userId' => (int) $row['user_id'],
        'message' => $row['message'],
        'read' => (bool) $row['read_status'],
        'createdAt' => $row['created_at']
    ];
}

function format_activity(array $row): array {
    return [
        'id' => (int) $row['id'],
        'userId' => (int) $row['user_id'],
        'message' => $row['message'],
        'createdAt' => $row['created_at']
    ];
}
?>