from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import re

app = Flask(__name__)
CORS(app)

DB_NAME = 'reminders.db'

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                dark_mode INTEGER DEFAULT 1,  -- Changed default to 1 (dark mode ON)
                email TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                notifications_enabled INTEGER DEFAULT 0,
                daily_reminder INTEGER DEFAULT 0,
                sound_enabled INTEGER DEFAULT 1,
                notification_sound TEXT DEFAULT 'default',
                lock_screen_enabled INTEGER DEFAULT 0
            )
        ''')
        cursor.execute('''
             CREATE TABLE IF NOT EXISTS support_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                email TEXT,
                message TEXT NOT NULL,
                submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user TEXT NOT NULL,
                title TEXT NOT NULL,
                time TEXT NOT NULL,
                category TEXT DEFAULT 'All',
                done INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                recurring TEXT DEFAULT 'None'
            )
        ''')
        conn.commit()


        
def update_db_schema():
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        try: cursor.execute("ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''")
        except sqlite3.OperationalError: pass
        try: cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''")
        except sqlite3.OperationalError: pass
        try: cursor.execute("ALTER TABLE users ADD COLUMN notifications_enabled INTEGER DEFAULT 0")
        except sqlite3.OperationalError: pass
        try: cursor.execute("ALTER TABLE users ADD COLUMN daily_reminder INTEGER DEFAULT 0")
        except sqlite3.OperationalError: pass
        try: cursor.execute("ALTER TABLE users ADD COLUMN sound_enabled INTEGER DEFAULT 1")
        except sqlite3.OperationalError: pass
        try: cursor.execute("ALTER TABLE users ADD COLUMN notification_sound TEXT DEFAULT 'default'")
        except sqlite3.OperationalError: pass
        try: cursor.execute("ALTER TABLE users ADD COLUMN lock_screen_enabled INTEGER DEFAULT 0")
        except sqlite3.OperationalError: pass
        # Make sure dark_mode column default is 1 if added later
        try: cursor.execute("ALTER TABLE users ADD COLUMN dark_mode INTEGER DEFAULT 1")
        except sqlite3.OperationalError: pass
        try: cursor.execute("ALTER TABLE reminders ADD COLUMN recurring TEXT DEFAULT 'None'")
        except sqlite3.OperationalError: pass
        conn.commit()

init_db()
update_db_schema()

def parse_time_string(time_str):
    match = re.match(r'(\d{1,2}):(\d{2})\s*(AM|PM)', time_str)
    if not match:
        return None
    hour, minute, ampm = int(match.group(1)), int(match.group(2)), match.group(3)
    if ampm == 'PM' and hour != 12:
        hour += 12
    if ampm == 'AM' and hour == 12:
        hour = 0
    return hour, minute

def format_time_string(hour, minute):
    ampm = 'AM'
    if hour >= 12:
        ampm = 'PM'
    hour12 = hour % 12
    if hour12 == 0:
        hour12 = 12
    return f"{hour12}:{minute:02d} {ampm}"

def get_next_occurrence_time(current_time_str, recurring):
    parsed = parse_time_string(current_time_str)
    if not parsed:
        return current_time_str
    hour, minute = parsed

    now = datetime.now()

    base_dt = now.replace(hour=hour, minute=minute, second=0, microsecond=0)

    if recurring == 'Daily':
        next_dt = base_dt + timedelta(days=1)
    elif recurring == 'Weekly':
        next_dt = base_dt + timedelta(weeks=1)
    elif recurring == 'Monthly':
        month = base_dt.month + 1
        year = base_dt.year
        if month > 12:
            month = 1
            year += 1
        day = min(base_dt.day, 28)
        next_dt = base_dt.replace(year=year, month=month, day=day)
    else:
        return current_time_str

    return format_time_string(next_dt.hour, next_dt.minute)

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    print("Signup request data:", data)
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"status": "fail", "message": "Missing username or password"}), 400

    try:
        with sqlite3.connect(DB_NAME) as conn:
            conn.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
            conn.commit()
        return jsonify({"status": "success", "message": "User registered"})
    except sqlite3.IntegrityError:
        return jsonify({"status": "fail", "message": "User already exists"}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username, password = data.get('username'), data.get('password')
    print(f"Login attempt: username={username}, password={password}")

    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
        user = cursor.fetchone()
        print("User found:", user)

    if user:
        return jsonify({"status": "success", "message": "Login successful"})
    return jsonify({"status": "fail", "message": "Invalid credentials"}), 401

@app.route('/add_schedule', methods=['POST'])
def add_schedule():
    data = request.get_json()
    user = data.get('user')
    title = data.get('title')
    time = data.get('time')
    category = data.get('category', 'All')
    recurring = data.get('recurring', 'None')

    if not user or not title or not time:
        return jsonify({"status": "fail", "message": "Missing required fields"}), 400

    with sqlite3.connect(DB_NAME) as conn:
        conn.execute(
            "INSERT INTO reminders (user, title, time, category, recurring, done, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
            (user, title, time, category, recurring, datetime.now(timezone.utc).isoformat())
        )
        conn.commit()

    return jsonify({"status": "success", "message": "Reminder added"})

@app.route('/activities', methods=['GET'])
def get_activities():
    user = request.args.get('user')
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        if user:
            cursor.execute("SELECT * FROM reminders WHERE user = ?", (user,))
        else:
            cursor.execute("SELECT * FROM reminders")
        rows = cursor.fetchall()

    reminders = [
        {
            "id": row[0],
            "user": row[1],
            "title": row[2],
            "time": row[3],
            "category": row[4] if len(row) > 4 else "All",
            "done": bool(row[5]) if len(row) > 5 else False,
            "created_at": row[6] if len(row) > 6 else "",
            "recurring": row[7] if len(row) > 7 else "None",
        }
        for row in rows
    ]

   
    return jsonify({"status": "success", "count": len(reminders), "reminders": reminders})

@app.route('/user_achievements', methods=['GET'])
def get_user_achievements():
    username = request.args.get('username')
    if not username:
        return jsonify({"status": "fail", "message": "Missing username"}), 400

    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM achievements WHERE username = ?", (username,))
        if cursor.fetchone()[0] == 0:
            cursor.execute("SELECT achievement_id FROM achievements_meta")
            metas = cursor.fetchall()
            for meta in metas:
                cursor.execute('''
                    INSERT INTO achievements (username, achievement_id)
                    VALUES (?, ?)
                ''', (username, meta[0]))
            conn.commit()

        cursor.execute('''
            SELECT m.achievement_id, m.title, m.description, m.goal,
                   a.progress, a.unlocked
            FROM achievements_meta m
            JOIN achievements a ON m.achievement_id = a.achievement_id
            WHERE a.username = ?
        ''', (username,))
        rows = cursor.fetchall()

    achievements = [
        {
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "goal": row[3],
            "progress": row[4],
            "unlocked": bool(row[5]),
            "percent": min(100, int((row[4] / row[3]) * 100))
        }
        for row in rows
    ]

    return jsonify({"status": "success", "achievements": achievements})

def setup_achievement_tables():
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS achievements_meta (
                achievement_id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                goal INTEGER NOT NULL
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                achievement_id INTEGER NOT NULL,
                unlocked INTEGER DEFAULT 0,
                progress INTEGER DEFAULT 0
            )
        ''')
        cursor.execute('SELECT COUNT(*) FROM achievements_meta')
        if cursor.fetchone()[0] == 0:
            default_achievements = [
                (1, "First Task Done", "Complete your first task.", 1),
                (2, "On a Roll", "Complete 5 tasks.", 5),
                (3, "Task Pro", "Complete 25 tasks.", 25),
                (4, "Early Bird", "Add a reminder before 8 AM.", 1),
                (5, "Task Master", "Complete 100 tasks.", 100),
                (6, "Loyal User", "Open the app on 10 different days.", 10),
                (7, "Relentless", "Add 5 reminders in a single day.", 5),
                (8, "Full Streak", "Complete tasks 3 days in a row.", 3)
            ]
            cursor.executemany('''
                INSERT INTO achievements_meta (achievement_id, title, description, goal)
                VALUES (?, ?, ?, ?)
            ''', default_achievements)
        conn.commit()

setup_achievement_tables()

@app.route('/delete_schedule/<int:reminder_id>', methods=['DELETE'])
def delete_schedule(reminder_id):
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"status": "fail", "message": "Reminder not found"}), 404
    return jsonify({"status": "success", "message": f"Reminder {reminder_id} deleted"})

@app.route('/update_schedule/<int:reminder_id>', methods=['PUT'])
def update_schedule(reminder_id):
    data = request.get_json()
    title = data.get('title')
    time = data.get('time')
    done = data.get('done', False)
    category = data.get('category', 'All')
    recurring = data.get('recurring', 'None')

    if title is None or time is None:
        return jsonify({'status': 'error', 'message': 'Missing title or time'}), 400

    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()

            cursor.execute("SELECT done, recurring, user FROM reminders WHERE id = ?", (reminder_id,))
            row = cursor.fetchone()
            if not row:
                return jsonify({'status': 'error', 'message': 'Reminder not found'}), 404
            old_done, old_recurring, user = row

            cursor.execute('''
                UPDATE reminders SET title = ?, time = ?, done = ?, category = ?, recurring = ?
                WHERE id = ?
            ''', (title, time, int(done), category, recurring, reminder_id))
            conn.commit()

            if done and not old_done and recurring != 'None':
                next_time = get_next_occurrence_time(time, recurring)
                cursor.execute('''
                    INSERT INTO reminders (user, title, time, category, recurring, done, created_at)
                    VALUES (?, ?, ?, ?, ?, 0, ?)
                ''', (user, title, next_time, category, recurring, datetime.now(timezone.utc).isoformat()))
                conn.commit()

        return jsonify({'status': 'success'})
    except Exception as e:
        print("Update Error:", e)
        return jsonify({'status': 'error', 'message': 'Failed to update reminder'}), 500

@app.route('/user_profile', methods=['GET'])
def get_user_profile():
    username = request.args.get('username')
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT username, dark_mode, email, phone,
                   notifications_enabled, daily_reminder, sound_enabled,
                   notification_sound, lock_screen_enabled
            FROM users WHERE username = ?
        """, (username,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"status": "fail", "message": "User not found"}), 404

        profile = {
            "username": row[0],
            "dark_mode": bool(row[1]),
            "email": row[2] if row[2] else "",
            "phone": row[3] if row[3] else "",
            "notifications_enabled": bool(row[4]),
            "daily_reminder": bool(row[5]),
            "sound_enabled": bool(row[6]),
            "notification_sound": row[7] if row[7] else "default",
            "lock_screen_enabled": bool(row[8]),
        }

        return jsonify({"status": "success", "profile": profile})

@app.route('/update_profile', methods=['PUT'])
def update_profile():
    data = request.get_json()
    username = data.get('username')
    new_username = data.get('new_username')
    new_password = data.get('password')
    dark_mode = data.get('dark_mode')
    email = data.get('email')
    phone = data.get('phone')
    notifications_enabled = data.get('notifications_enabled')
    daily_reminder = data.get('daily_reminder')
    sound_enabled = data.get('sound_enabled')
    notification_sound = data.get('notification_sound')
    lock_screen_enabled = data.get('lock_screen_enabled')

    if not username:
        return jsonify({"status": "fail", "message": "Username required"}), 400

    try:
        with sqlite3.connect(DB_NAME) as conn:
            cursor = conn.cursor()

            cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
            user = cursor.fetchone()
            if not user:
                return jsonify({"status": "fail", "message": "User not found"}), 404

            if new_username and new_username != username:
                try:
                    cursor.execute("UPDATE users SET username = ? WHERE username = ?", (new_username, username))
                    cursor.execute("UPDATE reminders SET user = ? WHERE user = ?", (new_username, username))
                    username = new_username
                except sqlite3.IntegrityError:
                    return jsonify({"status": "fail", "message": "New username already taken"}), 400

            if new_password:
                cursor.execute("UPDATE users SET password = ? WHERE username = ?", (new_password, username))
            if dark_mode is not None:
                cursor.execute("UPDATE users SET dark_mode = ? WHERE username = ?", (int(dark_mode), username))
            if email is not None:
                cursor.execute("UPDATE users SET email = ? WHERE username = ?", (email, username))
            if phone is not None:
                cursor.execute("UPDATE users SET phone = ? WHERE username = ?", (phone, username))
            if notifications_enabled is not None:
                cursor.execute("UPDATE users SET notifications_enabled = ? WHERE username = ?", (int(notifications_enabled), username))
            if daily_reminder is not None:
                cursor.execute("UPDATE users SET daily_reminder = ? WHERE username = ?", (int(daily_reminder), username))
            if sound_enabled is not None:
                cursor.execute("UPDATE users SET sound_enabled = ? WHERE username = ?", (int(sound_enabled), username))
            if notification_sound is not None:
                cursor.execute("UPDATE users SET notification_sound = ? WHERE username = ?", (notification_sound, username))
            if lock_screen_enabled is not None:
                cursor.execute("UPDATE users SET lock_screen_enabled = ? WHERE username = ?", (int(lock_screen_enabled), username))

            conn.commit()

        return jsonify({"status": "success", "message": "Profile updated", "username": username})
    except Exception as e:
        print("Profile Update Error:", e)
        return jsonify({"status": "fail", "message": "Failed to update profile"}), 500

@app.route('/delete_user/<username>', methods=['DELETE'])
def delete_user(username):
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM reminders WHERE user = ?", (username,))
        cursor.execute("DELETE FROM users WHERE username = ?", (username,))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"status": "fail", "message": "User not found"}), 404
    return jsonify({"status": "success", "message": "User deleted"})

@app.route('/')
def home():
    return "Backend is running with SQLite!"

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
