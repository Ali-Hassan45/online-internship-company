<?php
require_once __DIR__ . '/../config/config.php';

$action = $_GET['action'] ?? '';
$data = request_data();

try {
    if ($action === 'register') {
        $errors = validate_register($data);

        if ($errors) {
            json_response(['success' => false, 'message' => $errors[0]], 422);
        }

        $email = strtolower(trim($data['email']));
        $username = trim($data['username']);

        $check = db()->prepare("SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1");
        $check->execute([$email, $username]);

        if ($check->fetch()) {
            json_response(['success' => false, 'message' => 'Email or username already exists.'], 409);
        }

        $role = $data['role'];
        $companyName = $role === 'company' ? 'AH Nexues Lab' : null;
        $skills = $role === 'student' ? 'HTML, CSS, JavaScript' : null;
        $education = $role === 'student' ? 'BS Computer Science' : null;

        $stmt = db()->prepare(
            "INSERT INTO users
            (full_name, email, phone, username, password_hash, dob, role, company_name, skills, education, saved_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]')"
        );

        $stmt->execute([
            trim($data['full_name']),
            $email,
            trim($data['phone']),
            $username,
            password_hash($data['password'], PASSWORD_DEFAULT),
            $data['dob'],
            $role,
            $companyName,
            $skills,
            $education
        ]);

        $id = (int) db()->lastInsertId();
        $_SESSION['user_id'] = $id;

        log_activity($id, 'Account registered successfully.');
        notify_user($id, 'Welcome to AH Nexues Lab Internship Portal! Your account data is saved in MySQL.');

        json_response(['success' => true, 'user' => get_portal_user()]);
    }

    if ($action === 'login') {
        $identity = strtolower(trim($data['identity'] ?? ''));
        $password = $data['password'] ?? '';

        if ($identity === '' || $password === '') {
            json_response(['success' => false, 'message' => 'Email/username and password are required.'], 422);
        }

        $stmt = db()->prepare("SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1");
        $stmt->execute([$identity, $identity]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            json_response(['success' => false, 'message' => 'Email/username or password is incorrect.'], 401);
        }

        $_SESSION['user_id'] = (int) $user['id'];
        log_activity((int) $user['id'], 'Logged in successfully.');

        json_response(['success' => true, 'user' => get_portal_user()]);
    }

    if ($action === 'logout') {
        $_SESSION = [];
        session_destroy();
        json_response(['success' => true, 'message' => 'Logged out successfully.']);
    }

    json_response(['success' => false, 'message' => 'Invalid auth action.'], 404);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
}
?>