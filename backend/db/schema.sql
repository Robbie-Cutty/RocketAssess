CREATE TABLE organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    email VARCHAR(100),
    phone VARCHAR(20),
    city VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT,
    teacher_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100),
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    gender VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT,
    invited_by INT,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    gender VARCHAR(10),
    grade VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(id),
    FOREIGN KEY (invited_by) REFERENCES teachers(id)
);

CREATE TABLE test_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT,
    name VARCHAR(100),
    subject VARCHAR(50),
    scheduled_at DATETIME,
    duration INT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT,
    subject VARCHAR(50),
    content TEXT,
    options JSON,
    correct_key VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE test_questions (
    test_id INT,
    question_id INT,
    order_no INT,
    PRIMARY KEY (test_id, question_id),
    FOREIGN KEY (test_id) REFERENCES test_rooms(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE test_invites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT,
    student_id INT,
    invite_token VARCHAR(64) NOT NULL UNIQUE,
    is_accepted TINYINT(1) DEFAULT 0,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES test_rooms(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id INT,
    student_id INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration INT,
    score DECIMAL(5,2),
    FOREIGN KEY (test_id) REFERENCES test_rooms(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE submission_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT,
    question_id INT,
    selected_key VARCHAR(5),
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);