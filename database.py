import sqlite3
import os
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

def get_db():
    try:
        from flask import g, has_app_context
        if has_app_context():
            if 'db' not in g:
                g.db = sqlite3.connect(DB_PATH)
                g.db.row_factory = sqlite3.Row
                g.db.execute("PRAGMA foreign_keys = ON")
            return g.db
    except ImportError:
        pass

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def close_db(e=None):
    try:
        from flask import g, has_app_context
        if has_app_context():
            db = g.pop('db', None)
            if db is not None:
                db.close()
    except ImportError:
        pass

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Tests table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        duration INTEGER NOT NULL DEFAULT 10,
        total_questions INTEGER NOT NULL DEFAULT 0,
        created_by TEXT DEFAULT 'admin@test.com',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Questions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option TEXT NOT NULL CHECK(correct_option IN ('A', 'B', 'C', 'D')),
        order_idx INTEGER DEFAULT 1,
        FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE
    )
    ''')

    # Submissions / Results table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        test_id INTEGER NOT NULL,
        test_title TEXT NOT NULL,
        score REAL NOT NULL,
        correct_count INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        answers_json TEXT,
        taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE
    )
    ''')

    conn.commit()

    # Seed default Admin and Student if not existing
    cursor.execute("SELECT id FROM users WHERE email = ?", ('admin@test.com',))
    admin_user = cursor.fetchone()
    if not admin_user:
        admin_hash = generate_password_hash('admin123')
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ('Administrator', 'admin@test.com', admin_hash, 'admin')
        )

    cursor.execute("SELECT id FROM users WHERE email = ?", ('student@test.com',))
    student_user = cursor.fetchone()
    if not student_user:
        student_hash = generate_password_hash('student123')
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ('Rutuja Deshmukh', 'student@test.com', student_hash, 'student')
        )
        student_id = cursor.lastrowid
    else:
        student_id = student_user['id']

    conn.commit()

    # Seed initial tests if no tests exist
    cursor.execute("SELECT COUNT(*) as count FROM tests")
    test_count = cursor.fetchone()['count']

    if test_count == 0:
        # Sample Test 1: Python Programming Basics
        cursor.execute(
            "INSERT INTO tests (title, description, duration, total_questions, created_by) VALUES (?, ?, ?, ?, ?)",
            ('Python Programming Basics', 'Test your understanding of core Python syntax, types, and functions.', 15, 5, 'admin@test.com')
        )
        t1_id = cursor.lastrowid

        t1_questions = [
            ("What is the output of print(2 ** 3) in Python?", "6", "8", "9", "5", "B", 1),
            ("Which of the following data types is immutable in Python?", "list", "set", "dictionary", "tuple", "D", 2),
            ("Which keyword is used to define a function in Python?", "func", "define", "def", "function", "C", 3),
            ("How do you start a single-line comment in Python?", "//", "/*", "#", "--", "C", 4),
            ("What is the correct file extension for Python scripts?", ".py", ".pyth", ".pt", ".python", "A", 5),
        ]
        for q in t1_questions:
            cursor.execute('''
            INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_option, order_idx)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (t1_id, q[0], q[1], q[2], q[3], q[4], q[5], q[6]))

        # Sample Test 2: Web Development Fundamentals
        cursor.execute(
            "INSERT INTO tests (title, description, duration, total_questions, created_by) VALUES (?, ?, ?, ?, ?)",
            ('Web Development Fundamentals', 'Assess your knowledge in HTML, CSS, JavaScript, and HTTP concepts.', 10, 5, 'admin@test.com')
        )
        t2_id = cursor.lastrowid

        t2_questions = [
            ("What does HTML stand for?", "Hyper Text Markup Language", "High Text Marking Language", "Hyperlinks Text Management Language", "Home Tool Markup Language", "A", 1),
            ("Which CSS property is used to change the text color of an element?", "text-color", "font-color", "color", "text-style", "C", 2),
            ("Which HTTP method is commonly used to submit form data securely to a server?", "GET", "POST", "FETCH", "PUSH", "B", 3),
            ("What is the purpose of the <title> tag in an HTML document?", "Sets the page heading", "Sets the browser title bar / tab text", "Styles the document header", "Creates an anchor tag", "B", 4),
            ("Which JavaScript method parses a JSON string into a JavaScript object?", "JSON.stringify()", "JSON.parse()", "JSON.object()", "JSON.toObject()", "B", 5),
        ]
        for q in t2_questions:
            cursor.execute('''
            INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_option, order_idx)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (t2_id, q[0], q[1], q[2], q[3], q[4], q[5], q[6]))

        # Seed sample submission for demo student so initial charts and results look great!
        cursor.execute("SELECT COUNT(*) as count FROM submissions WHERE user_id = ?", (student_id,))
        if cursor.fetchone()['count'] == 0:
            cursor.execute('''
            INSERT INTO submissions (user_id, test_id, test_title, score, correct_count, total_questions, answers_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (student_id, t1_id, 'Python Programming Basics', 80.0, 4, 5, '{"0":"B","1":"D","2":"C","3":"C","4":"B"}'))

        conn.commit()

    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database initialized successfully at:", DB_PATH)
