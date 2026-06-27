# AH Nexues Lab Internship Portal - Complete Frontend + Backend

## Note

This is a full-stack project built with PHP and MySQL.

GitHub Pages does not support PHP or MySQL, so this project cannot run directly on GitHub Pages.

To run this project:

1. Install XAMPP.
2. Start Apache and MySQL.
3. Import `database.sql`.
4. Open `setup.php`.
5. Visit `http://localhost/...`.

## What is included

### Frontend
- index.html
- register.html
- login.html
- dashboard.html
- internships.html
- apply.html
- my-applications.html
- company-dashboard.html
- saved.html
- profile.html
- notifications.html
- interviews.html
- certificate.html
- resume-builder.html
- skill-quiz.html
- compare.html
- admin-analytics.html
- about.html
- assets/css/style.css
- assets/js/app.js

### Backend
- config/config.php
- api/auth.php
- api/data.php
- setup.php
- database.sql

## Data saved in MySQL

- Register/Login users: `users`
- Internship posts: `internships`
- Student applications: `applications`
- Notifications: `notifications`
- Dashboard activities: `activities`
- Skill quiz scores: `quiz_scores`
- Saved internships: `users.saved_json`

## How to run in XAMPP

1. Start XAMPP.
2. Start Apache and MySQL.
3. Extract this project.
4. Copy folder into:

```
C:\xampp\htdocs\
```

5. Open in browser:

```
http://localhost/ah_nexues_lab_complete_frontend_backend/setup.php
```

This will create database, tables, and demo data automatically.

6. Then open:

```
http://localhost/ah_nexues_lab_complete_frontend_backend/index.html
```

## Demo login

Student:

```
student@test.com
Password@123
```

Company:

```
company@test.com
Password@123
```

## Important

Do not open `index.html` by double-clicking if you want backend to work.
Open it through localhost, because fetch API needs PHP backend:

```
http://localhost/ah_nexues_lab_complete_frontend_backend/index.html
```

## Company name

All old demo company references have been replaced with:

```
AH Nexues Lab
```


## Fixed Backend Notes

This corrected version fixes the JSON/register issue caused by a PHP function-name conflict.  
The backend now uses `get_portal_user()` instead of PHP's built-in `get_current_user()`.

### Correct Run Steps

1. Put this folder in `C:/xampp/htdocs/`
2. Start Apache and MySQL
3. Open `http://localhost/ah_nexues_lab_backend_fixed/setup.php`
4. Open `http://localhost/ah_nexues_lab_backend_fixed/api/health.php`
   - You should see JSON: `{ "success": true, ... }`
5. Open `http://localhost/ah_nexues_lab_backend_fixed/index.html`

### If Browser Still Shows Old Data

Hard refresh the page:
`Ctrl + F5`

This backend version does not depend on browser `localStorage` for register/login.
