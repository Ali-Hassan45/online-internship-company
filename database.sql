CREATE DATABASE IF NOT EXISTS ah_nexues_lab_portal
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ah_nexues_lab_portal;

DROP TABLE IF EXISTS quiz_scores;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS internships;
DROP TABLE IF EXISTS users;

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
);

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
);

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
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  read_status TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE quiz_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  score INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Demo data is inserted automatically by setup.php with secure password_hash().
-- Demo password after setup.php:
-- Student: student@test.com / Password@123
-- Company: company@test.com / Password@123
