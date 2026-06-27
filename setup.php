<?php
// Run this file once in browser:
// http://localhost/ah_nexues_lab_complete_frontend_backend/setup.php

$host = 'localhost';
$user = 'root';
$pass = '';
$dbName = 'ah_nexues_lab_portal';

try {
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbName`");

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    foreach (['quiz_scores','activities','notifications','applications','internships','users'] as $table) {
        $pdo->exec("DROP TABLE IF EXISTS `$table`");
    }
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    $pdo->exec("
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(80) NOT NULL,
          email VARCHAR(120) NOT NULL UNIQUE,
          phone VARCHAR(20) NOT NULL,
          username VARCHAR(40) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          dob DATE NOT NULL,
          role ENUM('student','company') NOT NULL,
          company_name VARCHAR(120) NULL,
          skills VARCHAR(255) NULL,
          education VARCHAR(120) NULL,
          saved_json TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $pdo->exec("
        CREATE TABLE internships (
          id INT AUTO_INCREMENT PRIMARY KEY,
          company_id INT NOT NULL,
          company_name VARCHAR(120) NOT NULL DEFAULT 'AH Nexues Lab',
          title VARCHAR(140) NOT NULL,
          category VARCHAR(80) NOT NULL,
          mode ENUM('Remote','Onsite','Hybrid') NOT NULL,
          location VARCHAR(100) NOT NULL,
          duration VARCHAR(60) NOT NULL,
          stipend INT NOT NULL DEFAULT 0,
          deadline DATE NOT NULL,
          skills VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");

    $pdo->exec("
        CREATE TABLE applications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          internship_id INT NOT NULL,
          student_id INT NOT NULL,
          student_name VARCHAR(100) NOT NULL,
          student_email VARCHAR(120) NOT NULL,
          resume_url VARCHAR(255) NOT NULL,
          cover_letter TEXT NOT NULL,
          status ENUM('Pending','Shortlisted','Accepted','Rejected') DEFAULT 'Pending',
          interview_date DATETIME NULL,
          feedback TEXT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_application (internship_id, student_id),
          FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");

    $pdo->exec("
        CREATE TABLE notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          message VARCHAR(255) NOT NULL,
          read_status TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");

    $pdo->exec("
        CREATE TABLE activities (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          message VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");

    $pdo->exec("
        CREATE TABLE quiz_scores (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          score INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");

    $password = password_hash('Password@123', PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        INSERT INTO users
        (full_name, email, phone, username, password_hash, dob, role, company_name, skills, education, saved_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        'Ali Student',
        'student@test.com',
        '03001234567',
        'ali_student',
        $password,
        '2004-06-15',
        'student',
        null,
        'HTML, CSS, JavaScript, PHP, MySQL',
        'BS Computer Science',
        '[]'
    ]);

    $studentId = (int) $pdo->lastInsertId();

    $stmt->execute([
        'AH Nexues Lab',
        'company@test.com',
        '03111234567',
        'ah_nexues_hr',
        $password,
        '1995-04-20',
        'company',
        'AH Nexues Lab',
        null,
        null,
        '[]'
    ]);

    $companyId = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare("
        INSERT INTO internships
        (company_id, company_name, title, category, mode, location, duration, stipend, deadline, skills, description)
        VALUES (?, 'AH Nexues Lab', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $demoInternships = [
        ['Frontend Developer Intern', 'Web Development', 'Remote', 'Remote', '3 Months', 25000, '2026-08-30', 'HTML, CSS, JavaScript', 'Create polished internship portal screens, reusable UI cards, responsive dashboards and interactive components for AH Nexues Lab projects.'],
        ['PHP Backend Intern', 'Backend Development', 'Hybrid', 'Lahore', '4 Months', 30000, '2026-09-15', 'PHP, MySQL, OOP', 'Practice PHP backend planning, database tables, authentication flow and CRUD logic used in AH Nexues Lab internship systems.'],
        ['UI/UX Design Intern', 'Design', 'Onsite', 'Karachi', '2 Months', 20000, '2026-07-25', 'Figma, Wireframes, Prototyping', 'Design clean internship portal screens, wireframes, student journeys and recruiter-friendly layouts.'],
        ['Data Analysis Intern', 'Data Science', 'Remote', 'Remote', '3 Months', 35000, '2026-10-10', 'Excel, Python, Charts', 'Analyze internship applications, student skill data and portal activity to prepare visual insight reports.'],
        ['Digital Marketing Intern', 'Marketing', 'Hybrid', 'Karachi', '2 Months', 18000, '2026-08-15', 'SEO, Canva, Social Media', 'Support AH Nexues Lab internship campaigns, content planning, SEO tasks and performance reports.']
    ];

    foreach ($demoInternships as $row) {
        $stmt->execute(array_merge([$companyId], $row));
    }

    $stmt = $pdo->prepare("INSERT INTO activities (user_id, message) VALUES (?, ?)");
    $stmt->execute([$studentId, 'Student demo account created.']);
    $stmt->execute([$companyId, 'Company demo account created.']);
    $stmt->execute([$companyId, 'Demo internships posted for AH Nexues Lab.']);

    $stmt = $pdo->prepare("INSERT INTO notifications (user_id, message) VALUES (?, ?)");
    $stmt->execute([$studentId, 'Welcome to AH Nexues Lab Internship Portal.']);
    $stmt->execute([$companyId, 'Company dashboard is ready to manage internship applications.']);

    echo "<h2>Setup Complete ✅</h2>";
    echo "<p>Database <strong>$dbName</strong> created successfully.</p>";
    echo "<p><strong>Student:</strong> student@test.com / Password@123</p>";
    echo "<p><strong>Company:</strong> company@test.com / Password@123</p>";
    echo "<p><a href='index.html'>Open Website</a></p>";
} catch (Throwable $e) {
    echo "<h2>Setup Failed ❌</h2>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
}
?>