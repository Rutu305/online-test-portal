import os
import json
import functools
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    session,
    redirect,
    url_for,
    g
)
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db, close_db, init_db

# Create Flask application
app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'online-test-portal-flask-secret-key-2026')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Teardown database connection per request
app.teardown_appcontext(close_db)


# -------------------------------------------------------------
# Authentication & Role Decorators
# -------------------------------------------------------------
def login_required(view):
    """Ensure user is logged in before accessing view/endpoint."""
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'success': False, 'message': 'Authentication required. Please log in.'}), 401
            return redirect(url_for('login_page'))
        return view(**kwargs)
    return wrapped_view


def admin_required(view):
    """Ensure authenticated user is an administrator."""
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'success': False, 'message': 'Authentication required.'}), 401
            return redirect(url_for('login_page'))
        if session.get('role') != 'admin':
            if request.path.startswith('/api/'):
                return jsonify({'success': False, 'message': 'Access forbidden: Admin access only.'}), 403
            return redirect(url_for('student_page'))
        return view(**kwargs)
    return wrapped_view


def student_required(view):
    """Ensure authenticated user is a student."""
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({'success': False, 'message': 'Authentication required.'}), 401
            return redirect(url_for('login_page'))
        if session.get('role') != 'student':
            if request.path.startswith('/api/'):
                return jsonify({'success': False, 'message': 'Access forbidden: Student access only.'}), 403
            return redirect(url_for('admin_page'))
        return view(**kwargs)
    return wrapped_view


# -------------------------------------------------------------
# Frontend Page Routes
# -------------------------------------------------------------
@app.route('/')
def index_page():
    """Home / Landing page."""
    return render_template('index.html')


@app.route('/login')
def login_page():
    """Login page; redirects to dashboard if already authenticated."""
    if 'user_id' in session:
        return redirect(url_for('admin_page' if session.get('role') == 'admin' else 'student_page'))
    return render_template('login.html')


@app.route('/signup')
def signup_page():
    """User registration page."""
    if 'user_id' in session:
        return redirect(url_for('admin_page' if session.get('role') == 'admin' else 'student_page'))
    return render_template('signup.html')


@app.route('/admin')
@admin_required
def admin_page():
    """Admin dashboard."""
    return render_template('admin.html')


@app.route('/test-form')
@admin_required
def test_form_page():
    """Admin test creation form."""
    return render_template('test-form.html')


@app.route('/all-tests')
@admin_required
def all_tests_page():
    """Admin view of all created tests and student submissions."""
    return render_template('all-tests.html')


@app.route('/student')
@student_required
def student_page():
    """Student dashboard."""
    return render_template('student.html')


@app.route('/take-test')
@student_required
def take_test_page():
    """List of available tests for student."""
    return render_template('take-test.html')


@app.route('/take-test-session')
@student_required
def take_test_session_page():
    """Live examination session page."""
    return render_template('take-test-session.html')


@app.route('/result-database')
@student_required
def result_database_page():
    """Student past test results page."""
    return render_template('result-database.html')


@app.route('/my-account')
@student_required
def my_account_page():
    """Student profile and stats page."""
    return render_template('my-account.html')


@app.route('/logout')
def logout_page():
    """Sign out user and redirect to login."""
    session.clear()
    return redirect(url_for('login_page'))


# -------------------------------------------------------------
# Authentication APIs
# -------------------------------------------------------------
@app.route('/api/login', methods=['POST'])
def api_login():
    """Authenticate user with email and password."""
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Please provide both email and password.'}), 400

    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ? OR LOWER(email) = ?", (email, email)).fetchone()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

    session.clear()
    session['user_id'] = user['id']
    session['name'] = user['name']
    session['email'] = user['email']
    session['role'] = user['role']

    redirect_url = '/admin' if user['role'] == 'admin' else '/student'
    return jsonify({
        'success': True,
        'message': 'Login successful.',
        'role': user['role'],
        'redirect': redirect_url
    })


@app.route('/api/signup', methods=['POST'])
def api_signup():
    """Register a new student or admin account."""
    data = request.get_json(silent=True) or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'student').strip().lower()

    if not name or len(name) < 3:
        return jsonify({'success': False, 'message': 'Name must contain at least 3 characters.'}), 400
    if not email or '@' not in email:
        return jsonify({'success': False, 'message': 'A valid email address is required.'}), 400
    if not password or len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters long.'}), 400
    if role not in ('student', 'admin'):
        return jsonify({'success': False, 'message': 'Role must be student or admin.'}), 400

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ? OR LOWER(email) = ?", (email, email)).fetchone()
    if existing:
        return jsonify({'success': False, 'message': 'This email is already registered. Please log in.'}), 400

    password_hash = generate_password_hash(password)
    db.execute(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        (name, email, password_hash, role)
    )
    db.commit()

    return jsonify({'success': True, 'message': 'Account created successfully! Please log in.'})


@app.route('/api/logout', methods=['POST'])
def api_logout():
    """Clear session on logout."""
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully.'})


@app.route('/api/reset-password', methods=['POST'])
def api_reset_password():
    """Simulate password reset instructions."""
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'success': False, 'message': 'Please provide an email address.'}), 400

    db = get_db()
    user = db.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,)).fetchone()
    if user:
        return jsonify({'success': True, 'message': f'Password reset link dispatched to {email}. Check your inbox.'})
    else:
        return jsonify({'success': True, 'message': 'If that email exists in our records, a reset link has been dispatched.'})


@app.route('/api/me')
@login_required
def api_me():
    """Return currently logged-in user profile."""
    return jsonify({
        'user': {
            'id': session.get('user_id'),
            'name': session.get('name'),
            'email': session.get('email'),
            'role': session.get('role')
        }
    })


# -------------------------------------------------------------
# Admin APIs
# -------------------------------------------------------------
@app.route('/api/admin/stats')
@admin_required
def api_admin_stats():
    """Summary statistics for admin dashboard."""
    db = get_db()
    test_count = db.execute("SELECT COUNT(*) AS count FROM tests").fetchone()['count']
    student_count = db.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'student'").fetchone()['count']
    submission_count = db.execute("SELECT COUNT(*) AS count FROM submissions").fetchone()['count']

    return jsonify({
        'testCount': test_count,
        'studentCount': student_count,
        'submissionCount': submission_count
    })


@app.route('/api/admin/tests', methods=['GET'])
@admin_required
def api_admin_get_tests():
    """List all created tests with participant submission count."""
    db = get_db()
    rows = db.execute('''
        SELECT t.id, t.title, t.description, t.duration, t.total_questions,
               COUNT(s.id) AS participant_count
        FROM tests t
        LEFT JOIN submissions s ON t.id = s.test_id
        GROUP BY t.id
        ORDER BY t.id DESC
    ''').fetchall()

    tests = []
    for r in rows:
        tests.append({
            'id': r['id'],
            'title': r['title'],
            'description': r['description'] or '',
            'duration': r['duration'],
            'total_questions': r['total_questions'],
            'participant_count': r['participant_count']
        })
    return jsonify(tests)


@app.route('/api/admin/tests', methods=['POST'])
@admin_required
def api_admin_create_test():
    """Create a new test with questions."""
    data = request.get_json(silent=True) or {}
    title = data.get('title', '').strip()
    duration = data.get('duration', 10)
    questions = data.get('questions', [])

    if not title:
        return jsonify({'success': False, 'message': 'Test title cannot be empty.'}), 400
    if not questions or len(questions) == 0:
        return jsonify({'success': False, 'message': 'At least one question is required.'}), 400

    try:
        duration = int(duration)
        if duration <= 0:
            duration = 10
    except (ValueError, TypeError):
        duration = 10

    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        "INSERT INTO tests (title, description, duration, total_questions, created_by) VALUES (?, ?, ?, ?, ?)",
        (title, f"{len(questions)} question test", duration, len(questions), session.get('email', 'admin@test.com'))
    )
    test_id = cursor.lastrowid

    for idx, q in enumerate(questions, start=1):
        q_text = q.get('text', '').strip()
        opts = q.get('options', {})
        opt_a = opts.get('A', '').strip()
        opt_b = opts.get('B', '').strip()
        opt_c = opts.get('C', '').strip()
        opt_d = opts.get('D', '').strip()
        correct = q.get('correct', 'A').strip().upper()
        if correct not in ('A', 'B', 'C', 'D'):
            correct = 'A'

        cursor.execute('''
            INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_option, order_idx)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (test_id, q_text, opt_a, opt_b, opt_c, opt_d, correct, idx))

    db.commit()
    return jsonify({'success': True, 'message': 'Test and questions successfully created.', 'testId': test_id})


@app.route('/api/admin/tests/<int:test_id>', methods=['DELETE'])
@admin_required
def api_admin_delete_test(test_id):
    """Delete a test and all its questions/submissions."""
    db = get_db()
    db.execute("DELETE FROM tests WHERE id = ?", (test_id,))
    db.commit()
    return jsonify({'success': True, 'message': 'Test deleted successfully.'})


@app.route('/api/admin/tests/<int:test_id>/participants')
@admin_required
def api_admin_test_participants(test_id):
    """List all students who submitted this test."""
    db = get_db()
    rows = db.execute('''
        SELECT s.id, s.score, s.correct_count, s.total_questions, s.taken_at,
               u.name, u.email
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        WHERE s.test_id = ?
        ORDER BY s.taken_at DESC
    ''', (test_id,)).fetchall()

    participants = []
    for r in rows:
        participants.append({
            'id': r['id'],
            'name': r['name'],
            'email': r['email'],
            'score': r['score'],
            'correct_count': r['correct_count'],
            'total_questions': r['total_questions'],
            'taken_at': r['taken_at']
        })
    return jsonify(participants)


# -------------------------------------------------------------
# Student APIs
# -------------------------------------------------------------
@app.route('/api/student/stats')
@student_required
def api_student_stats():
    """Summary statistics for current student."""
    user_id = session['user_id']
    db = get_db()

    total_tests = db.execute("SELECT COUNT(*) AS count FROM tests").fetchone()['count']
    completed_tests = db.execute("SELECT COUNT(*) AS count FROM submissions WHERE user_id = ?", (user_id,)).fetchone()['count']

    avg_row = db.execute("SELECT AVG(score) AS avg_score FROM submissions WHERE user_id = ?", (user_id,)).fetchone()
    avg_score = round(avg_row['avg_score'], 1) if avg_row and avg_row['avg_score'] is not None else 0.0

    recent_rows = db.execute('''
        SELECT test_title, score, taken_at
        FROM submissions
        WHERE user_id = ?
        ORDER BY taken_at DESC
        LIMIT 5
    ''', (user_id,)).fetchall()

    recent = []
    for r in recent_rows:
        recent.append({
            'testTitle': r['test_title'],
            'score': r['score'],
            'takenAt': r['taken_at']
        })

    return jsonify({
        'totalTests': total_tests,
        'completedTests': completed_tests,
        'averageScore': avg_score,
        'recent': recent
    })


@app.route('/api/student/tests')
@student_required
def api_student_tests():
    """Return all available tests for taking."""
    db = get_db()
    rows = db.execute("SELECT id, title, description, duration, total_questions FROM tests ORDER BY id DESC").fetchall()

    tests = []
    for r in rows:
        tests.append({
            'id': r['id'],
            'title': r['title'],
            'description': r['description'] or '',
            'duration': r['duration'],
            'total_questions': r['total_questions']
        })
    return jsonify(tests)


@app.route('/api/student/test/<int:test_id>')
@student_required
def api_student_get_test(test_id):
    """Return test metadata and questions (without correct answers)."""
    db = get_db()
    test = db.execute("SELECT * FROM tests WHERE id = ?", (test_id,)).fetchone()
    if not test:
        return jsonify({'error': 'Test not found'}), 404

    q_rows = db.execute("SELECT * FROM questions WHERE test_id = ? ORDER BY order_idx ASC, id ASC", (test_id,)).fetchall()
    questions = []
    for q in q_rows:
        questions.append({
            'id': q['id'],
            'text': q['question_text'],
            'options': {
                'A': q['option_a'],
                'B': q['option_b'],
                'C': q['option_c'],
                'D': q['option_d']
            }
        })

    return jsonify({
        'id': test['id'],
        'title': test['title'],
        'description': test['description'] or '',
        'duration': test['duration'],
        'questions': questions
    })


@app.route('/api/student/test/<int:test_id>/submit', methods=['POST'])
@student_required
def api_student_submit_test(test_id):
    """Grade examination answers and store test submission."""
    user_id = session['user_id']
    data = request.get_json(silent=True) or {}
    student_answers = data.get('answers', {})

    db = get_db()
    test = db.execute("SELECT * FROM tests WHERE id = ?", (test_id,)).fetchone()
    if not test:
        return jsonify({'success': False, 'message': 'Test not found'}), 404

    questions = db.execute("SELECT * FROM questions WHERE test_id = ? ORDER BY order_idx ASC, id ASC", (test_id,)).fetchall()
    total_questions = len(questions)
    if total_questions == 0:
        return jsonify({'success': False, 'message': 'Test contains no questions.'}), 400

    correct_count = 0
    for idx, q in enumerate(questions):
        user_ans = student_answers.get(str(idx), student_answers.get(idx))
        if user_ans and str(user_ans).strip().upper() == str(q['correct_option']).strip().upper():
            correct_count += 1

    score_percent = round((correct_count / total_questions) * 100, 1)

    db.execute('''
        INSERT INTO submissions (user_id, test_id, test_title, score, correct_count, total_questions, answers_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, test_id, test['title'], score_percent, correct_count, total_questions, json.dumps(student_answers)))
    db.commit()

    return jsonify({
        'success': True,
        'correct': correct_count,
        'total': total_questions,
        'percentage': score_percent
    })


@app.route('/api/student/results')
@student_required
def api_student_results():
    """Return historical test submissions for current student."""
    user_id = session['user_id']
    db = get_db()
    rows = db.execute('''
        SELECT test_title, score, correct_count, total_questions, taken_at
        FROM submissions
        WHERE user_id = ?
        ORDER BY taken_at DESC
    ''', (user_id,)).fetchall()

    results = []
    for r in rows:
        results.append({
            'testTitle': r['test_title'],
            'correct': r['correct_count'],
            'total': r['total_questions'],
            'score': r['score'],
            'takenAt': r['taken_at']
        })
    return jsonify(results)


@app.route('/api/student/account')
@student_required
def api_student_account():
    """Return account profile and overall metrics."""
    user_id = session['user_id']
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    total_tests = db.execute("SELECT COUNT(*) AS count FROM submissions WHERE user_id = ?", (user_id,)).fetchone()['count']
    avg_row = db.execute("SELECT AVG(score) AS avg_score FROM submissions WHERE user_id = ?", (user_id,)).fetchone()
    avg_score = round(avg_row['avg_score'], 1) if avg_row and avg_row['avg_score'] is not None else 0.0

    return jsonify({
        'name': user['name'],
        'email': user['email'],
        'role': user['role'],
        'joined': user['created_at'],
        'totalTests': total_tests,
        'averageScore': avg_score
    })


# -------------------------------------------------------------
# App Entry Point
# -------------------------------------------------------------
if __name__ == '__main__':
    # Initialize database if needed
    init_db()
    print("Flask application starting on http://127.0.0.1:5000 and http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
