<?php
require_once __DIR__ . '/../config/config.php';

$action = $_GET['action'] ?? '';
$data = request_data();

try {
    if ($action === 'bootstrap') {
        $user = get_portal_user();

        $internshipRows = db()->query("SELECT * FROM internships ORDER BY created_at DESC")->fetchAll();
        $internships = array_map('format_internship', $internshipRows);

        $applications = [];
        $notifications = [];
        $activities = [];
        $quizScores = [];

        if ($user) {
            if ($user['role'] === 'student') {
                $stmt = db()->prepare("SELECT * FROM applications WHERE student_id = ? ORDER BY applied_at DESC");
                $stmt->execute([$user['id']]);
            } else {
                $stmt = db()->prepare(
                    "SELECT applications.*
                     FROM applications
                     INNER JOIN internships ON internships.id = applications.internship_id
                     WHERE internships.company_id = ?
                     ORDER BY applications.applied_at ASC"
                );
                $stmt->execute([$user['id']]);
            }

            $applications = array_map('format_application', $stmt->fetchAll());

            $stmt = db()->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC");
            $stmt->execute([$user['id']]);
            $notifications = array_map('format_notification', $stmt->fetchAll());

            $stmt = db()->prepare("SELECT * FROM activities WHERE user_id = ? ORDER BY id DESC LIMIT 12");
            $stmt->execute([$user['id']]);
            $activities = array_map('format_activity', $stmt->fetchAll());

            $stmt = db()->prepare("SELECT * FROM quiz_scores WHERE user_id = ? ORDER BY id DESC");
            $stmt->execute([$user['id']]);
            $quizScores = $stmt->fetchAll();
        }

        $statusCounts = [];
        foreach (['Pending', 'Shortlisted', 'Accepted', 'Rejected'] as $status) {
            $stmt = db()->prepare("SELECT COUNT(*) FROM applications WHERE status = ?");
            $stmt->execute([$status]);
            $statusCounts[$status] = (int) $stmt->fetchColumn();
        }

        $quizAvg = (int) db()->query("SELECT COALESCE(ROUND(AVG(score)), 0) FROM quiz_scores")->fetchColumn();

        $stats = [
            'users' => (int) db()->query("SELECT COUNT(*) FROM users")->fetchColumn(),
            'companies' => (int) db()->query("SELECT COUNT(*) FROM users WHERE role='company'")->fetchColumn(),
            'internships' => (int) db()->query("SELECT COUNT(*) FROM internships")->fetchColumn(),
            'applications' => (int) db()->query("SELECT COUNT(*) FROM applications")->fetchColumn(),
            'accepted' => $statusCounts['Accepted'],
            'statusCounts' => $statusCounts,
            'quizAverage' => $quizAvg
        ];

        json_response([
            'success' => true,
            'user' => $user,
            'internships' => $internships,
            'applications' => $applications,
            'notifications' => $notifications,
            'activities' => $activities,
            'quizScores' => $quizScores,
            'stats' => $stats
        ]);
    }

    if ($action === 'post_internship') {
        $userId = require_login();
        $user = get_portal_user();

        if ($user['role'] !== 'company') {
            json_response(['success' => false, 'message' => 'Only company account can post internships.'], 403);
        }

        $title = trim($data['title'] ?? '');
        $category = trim($data['category'] ?? '');
        $mode = trim($data['mode'] ?? '');
        $location = trim($data['location'] ?? '');
        $duration = trim($data['duration'] ?? '');
        $stipend = (int) ($data['stipend'] ?? -1);
        $deadline = trim($data['deadline'] ?? '');
        $skills = trim($data['skills'] ?? '');
        $description = trim($data['description'] ?? '');

        if (
            strlen($title) < 5 ||
            strlen($category) < 2 ||
            !in_array($mode, ['Remote', 'Onsite', 'Hybrid'], true) ||
            strlen($location) < 2 ||
            strlen($duration) < 2 ||
            $stipend < 0 ||
            !$deadline ||
            strlen($skills) < 3 ||
            strlen($description) < 20
        ) {
            json_response(['success' => false, 'message' => 'Please fill all internship fields correctly.'], 422);
        }

        $stmt = db()->prepare(
            "INSERT INTO internships
            (company_id, company_name, title, category, mode, location, duration, stipend, deadline, skills, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );

        $stmt->execute([
            $userId,
            'AH Nexues Lab',
            $title,
            $category,
            $mode,
            $location,
            $duration,
            $stipend,
            $deadline,
            $skills,
            $description
        ]);

        log_activity($userId, 'Posted internship: ' . $title);

        json_response(['success' => true, 'message' => 'Internship posted successfully.']);
    }

    if ($action === 'apply') {
        $userId = require_login();
        $user = get_portal_user();

        if ($user['role'] !== 'student') {
            json_response(['success' => false, 'message' => 'Only students can apply.'], 403);
        }

        $internshipId = (int) ($data['internship_id'] ?? 0);
        $resumeUrl = trim($data['resume_url'] ?? '');
        $coverLetter = trim($data['cover_letter'] ?? '');

        if (!$internshipId || !filter_var($resumeUrl, FILTER_VALIDATE_URL) || strlen($coverLetter) < 30) {
            json_response(['success' => false, 'message' => 'Enter valid resume URL and cover letter of at least 30 characters.'], 422);
        }

        $check = db()->prepare("SELECT id FROM applications WHERE internship_id = ? AND student_id = ? LIMIT 1");
        $check->execute([$internshipId, $userId]);

        if ($check->fetch()) {
            json_response(['success' => false, 'message' => 'You already applied for this internship.'], 409);
        }

        $stmt = db()->prepare("SELECT * FROM internships WHERE id = ? LIMIT 1");
        $stmt->execute([$internshipId]);
        $internship = $stmt->fetch();

        if (!$internship) {
            json_response(['success' => false, 'message' => 'Internship not found.'], 404);
        }

        $stmt = db()->prepare(
            "INSERT INTO applications
            (internship_id, student_id, student_name, student_email, resume_url, cover_letter)
            VALUES (?, ?, ?, ?, ?, ?)"
        );

        $stmt->execute([
            $internshipId,
            $userId,
            $user['fullName'],
            $user['email'],
            $resumeUrl,
            $coverLetter
        ]);

        log_activity($userId, 'Applied for internship: ' . $internship['title']);
        notify_user($userId, 'Your application for ' . $internship['title'] . ' has been submitted.');

        notify_user((int) $internship['company_id'], $user['fullName'] . ' applied for ' . $internship['title'] . '.');

        json_response(['success' => true, 'message' => 'Application submitted successfully.']);
    }

    if ($action === 'update_application') {
        $userId = require_login();
        $user = get_portal_user();

        if ($user['role'] !== 'company') {
            json_response(['success' => false, 'message' => 'Only company can update applications.'], 403);
        }

        $applicationId = (int) ($data['application_id'] ?? 0);
        $status = trim($data['status'] ?? 'Pending');
        $interviewDate = trim($data['interview_date'] ?? '');
        $feedback = trim($data['feedback'] ?? '');

        if (!in_array($status, ['Pending', 'Shortlisted', 'Accepted', 'Rejected'], true)) {
            json_response(['success' => false, 'message' => 'Invalid status.'], 422);
        }

        $stmt = db()->prepare(
            "SELECT applications.*, internships.title, internships.company_id
             FROM applications
             INNER JOIN internships ON internships.id = applications.internship_id
             WHERE applications.id = ?
             LIMIT 1"
        );
        $stmt->execute([$applicationId]);
        $app = $stmt->fetch();

        if (!$app || (int) $app['company_id'] !== $userId) {
            json_response(['success' => false, 'message' => 'Application not found for this company.'], 404);
        }

        $dateValue = $interviewDate ? date('Y-m-d H:i:s', strtotime($interviewDate)) : null;

        $stmt = db()->prepare(
            "UPDATE applications
             SET status = ?, interview_date = ?, feedback = ?
             WHERE id = ?"
        );
        $stmt->execute([$status, $dateValue, $feedback, $applicationId]);

        log_activity($userId, 'Updated application status to ' . $status . ' for ' . $app['title']);
        notify_user((int) $app['student_id'], 'Your application for ' . $app['title'] . ' is now ' . $status . '.');

        json_response(['success' => true, 'message' => 'Application updated successfully.']);
    }

    if ($action === 'toggle_save') {
        $userId = require_login();
        $user = get_portal_user();

        if ($user['role'] !== 'student') {
            json_response(['success' => false, 'message' => 'Only students can save internships.'], 403);
        }

        $internshipId = (int) ($data['internship_id'] ?? 0);
        $saved = $user['saved'] ?: [];

        if (in_array($internshipId, $saved, true)) {
            $saved = array_values(array_filter($saved, fn($id) => (int) $id !== $internshipId));
        } else {
            $saved[] = $internshipId;
        }

        $stmt = db()->prepare("UPDATE users SET saved_json = ? WHERE id = ?");
        $stmt->execute([json_encode($saved), $userId]);

        log_activity($userId, 'Updated saved internship shortlist.');

        json_response(['success' => true, 'user' => get_portal_user()]);
    }

    if ($action === 'update_profile') {
        $userId = require_login();
        $user = get_portal_user();

        if ($user['role'] !== 'student') {
            json_response(['success' => false, 'message' => 'Only student profile can be updated from this page.'], 403);
        }

        $fullName = trim($data['full_name'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $education = trim($data['education'] ?? '');
        $skills = trim($data['skills'] ?? '');

        if (!preg_match('/^[A-Za-z ]{3,80}$/', $fullName) || !preg_match('/^03[0-9]{9}$/', $phone)) {
            json_response(['success' => false, 'message' => 'Enter valid full name and phone number.'], 422);
        }

        $stmt = db()->prepare("UPDATE users SET full_name = ?, phone = ?, education = ?, skills = ? WHERE id = ?");
        $stmt->execute([$fullName, $phone, $education, $skills, $userId]);

        log_activity($userId, 'Updated candidate profile.');

        json_response(['success' => true, 'user' => get_portal_user()]);
    }

    if ($action === 'submit_quiz') {
        $userId = require_login();
        $score = (int) ($data['score'] ?? 0);

        if ($score < 0 || $score > 100) {
            json_response(['success' => false, 'message' => 'Invalid score.'], 422);
        }

        $stmt = db()->prepare("INSERT INTO quiz_scores (user_id, score) VALUES (?, ?)");
        $stmt->execute([$userId, $score]);

        log_activity($userId, 'Completed skill quiz with score ' . $score . '%.');

        json_response(['success' => true, 'message' => 'Quiz score saved.']);
    }

    json_response(['success' => false, 'message' => 'Invalid data action.'], 404);
} catch (Throwable $e) {
    json_response(['success' => false, 'message' => 'Server error: ' . $e->getMessage()], 500);
}
?>