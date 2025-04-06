



CREATE TABLE courses (
                         id INT AUTO_INCREMENT PRIMARY KEY,
                         title VARCHAR(255),
                         description TEXT,
                         teacher_id INT,
                         FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE enrollments (
                             id INT AUTO_INCREMENT PRIMARY KEY,
                             student_id INT,
                             course_id INT,
                             FOREIGN KEY (student_id) REFERENCES users(id),
                             FOREIGN KEY (course_id) REFERENCES courses(id)
);