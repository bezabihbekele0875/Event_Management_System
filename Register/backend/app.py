from datetime import datetime
from uuid import uuid4
import os
import logging

import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

EVENT_SERVICE_URL = os.getenv('EVENT_SERVICE_URL', 'http://localhost:8080/api/events')
NOTIFICATION_SERVICE_BASE = os.getenv('NOTIFICATION_SERVICE_URL', 'http://localhost:5000')
POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'university_event_system')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '1234')

app = Flask(__name__)
CORS(app)


def get_db():
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        dbname=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD
    )


def init_db():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute('''
                CREATE TABLE IF NOT EXISTS registrations (
                    id TEXT PRIMARY KEY,
                    event_id TEXT NOT NULL,
                    student_email TEXT NOT NULL,
                    channel TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL,
                    event_title TEXT,
                    event_description TEXT,
                    event_date TEXT,
                    event_capacity INTEGER,
                    event_type TEXT
                )
            ''')
        conn.commit()
    
    # Handle legacy schema migrations separately to avoid transaction abort issues
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("ALTER TABLE registrations RENAME COLUMN registered_at TO created_at")
            conn.commit()
    except Exception:
        pass
    
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("ALTER TABLE registrations ALTER COLUMN id TYPE TEXT USING id::text")
            conn.commit()
    except Exception:
        pass
    
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'EMAIL'")
                cur.execute("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS event_title TEXT")
                cur.execute("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS event_description TEXT")
                cur.execute("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS event_date TEXT")
                cur.execute("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS event_capacity INTEGER")
                cur.execute("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS event_type TEXT")
                cur.execute('''
                    CREATE UNIQUE INDEX IF NOT EXISTS registration_unique_event_student
                    ON registrations (event_id, lower(student_email))
                ''')
            conn.commit()
    except Exception:
        pass


def row_to_dict(row):
    if row is None:
        return None
    return {
        'id': row['id'],
        'eventId': row['event_id'],
        'studentEmail': row['student_email'],
        'channel': row['channel'],
        'createdAt': row['created_at'].isoformat() if hasattr(row['created_at'], 'isoformat') else row['created_at'],
        'eventTitle': row['event_title'],
        'eventDescription': row['event_description'],
        'eventDate': row['event_date'],
        'eventCapacity': row['event_capacity'],
        'eventType': row['event_type']
    }


def find_registration(event_id, student_email):
    event_id = str(event_id).strip()
    normalized_email = student_email.strip().lower()
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT * FROM registrations WHERE event_id = %s AND lower(student_email) = lower(%s)',
                (event_id, normalized_email)
            )
            return row_to_dict(cur.fetchone())


def retrieve_event(event_id):
    try:
        response = requests.get(f"{EVENT_SERVICE_URL}/{event_id}", timeout=3)
        if response.status_code == 200:
            return response.json()
    except requests.RequestException:
        pass
    return None


def create_notification(recipient, channel, message):
    payload = {
        'recipient': recipient,
        'channel': channel.upper() if channel else 'EMAIL',
        'message': message
    }
    try:
        requests.post(f"{NOTIFICATION_SERVICE_BASE}/notifications", json=payload, timeout=2)
    except requests.RequestException as ex:
        app.logger.warning('Unable to send notification: %s', ex)


@app.route('/registrations', methods=['GET'])
def list_registrations():
    student_email = request.args.get('studentEmail')
    event_id = request.args.get('eventId')

    if not student_email and not event_id:
        return jsonify({'error': 'Missing studentEmail or eventId query parameter.'}), 400

    query = 'SELECT * FROM registrations'
    conditions = []
    params = []

    if student_email:
        conditions.append('lower(student_email) = lower(%s)')
        params.append(student_email)
    if event_id:
        conditions.append('event_id = %s')
        params.append(event_id)

    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)

    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
    registrations = [row_to_dict(row) for row in rows]
    return jsonify(registrations)


@app.route('/registrations/counts', methods=['GET'])
def registration_counts():
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('SELECT event_id, COUNT(*) AS count FROM registrations GROUP BY event_id')
            rows = cur.fetchall()
    counts = {row['event_id']: row['count'] for row in rows}
    return jsonify(counts)


@app.route('/registrations', methods=['POST'])
def add_registration():
    payload = request.get_json() or {}
    app.logger.debug('add_registration called with payload: %s', payload)
    raw_event_id = payload.get('eventId')
    event_id = str(raw_event_id).strip() if raw_event_id is not None else None
    student_email = payload.get('studentEmail')
    channel = payload.get('channel', 'EMAIL')

    if not event_id or not student_email:
        return jsonify({'error': 'eventId and studentEmail are required.'}), 400

    if find_registration(event_id, student_email):
        return jsonify({'error': 'You are already registered for this event.'}), 409

    event = retrieve_event(event_id)
    if event is None:
        return jsonify({'error': 'Event not found or event service unavailable.'}), 404

    registration = {
        'id': str(uuid4()),
        'event_id': event_id,
        'student_email': student_email,
        'channel': channel.upper(),
        'created_at': datetime.utcnow(),
        'event_title': event.get('title'),
        'event_description': event.get('description'),
        'event_date': event.get('date'),
        'event_capacity': event.get('capacity'),
        'event_type': event.get('typeName') or event.get('type')
    }

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                '''
                INSERT INTO registrations (
                    id,
                    event_id,
                    student_email,
                    channel,
                    created_at,
                    event_title,
                    event_description,
                    event_date,
                    event_capacity,
                    event_type
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''',
                (
                    registration['id'],
                    registration['event_id'],
                    registration['student_email'],
                    registration['channel'],
                    registration['created_at'],
                    registration['event_title'],
                    registration['event_description'],
                    registration['event_date'],
                    registration['event_capacity'],
                    registration['event_type']
                )
            )
        conn.commit()

    create_notification(student_email, channel, f'Registration confirmed for "{registration["event_title"]}".')
    # Notify organizer of new registration and check capacity
    organizer = event.get('organizerId') or event.get('organizer')
    try:
        # notify via specialized endpoint so Notification service can handle observer logic
        requests.post(f"{NOTIFICATION_SERVICE_BASE}/registrations/created", json={
            'studentEmail': student_email,
            'event': event,
            'organizer': organizer,
            'channel': channel
        }, timeout=2)
    except requests.RequestException:
        app.logger.debug('Unable to call notification registration-created endpoint')

    # check if event is now full
    try:
        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('SELECT COUNT(*) AS count FROM registrations WHERE event_id = %s', (event_id,))
                row = cur.fetchone()
                current = int(row['count']) if row and row.get('count') is not None else 0
                capacity = int(event.get('capacity') or 0)
                if capacity > 0 and current >= capacity:
                    try:
                        requests.post(f"{NOTIFICATION_SERVICE_BASE}/events/full", json={
                            'event': event,
                            'organizer': organizer,
                            'channel': channel
                        }, timeout=2)
                    except requests.RequestException:
                        app.logger.debug('Unable to call notification event-full endpoint')
    except Exception:
        pass
    return jsonify(row_to_dict(registration)), 201


@app.route('/registrations/cancel', methods=['POST'])
def cancel_registration():
    payload = request.get_json() or {}
    app.logger.debug('cancel_registration called with payload: %s', payload)
    raw_event_id = payload.get('eventId')
    event_id = str(raw_event_id).strip() if raw_event_id is not None else None
    student_email = payload.get('studentEmail')
    channel = payload.get('channel', 'EMAIL')

    if not event_id or not student_email:
        return jsonify({'error': 'eventId and studentEmail are required.'}), 400

    try:
        registration = find_registration(event_id, student_email)
    except Exception as ex:
        app.logger.exception('Error looking up registration: %s', ex)
        return jsonify({'error': 'Internal error while looking up registration.'}), 500

    if registration is None:
        app.logger.debug('No registration found for event=%s student=%s', event_id, student_email)
        return jsonify({'error': 'No active registration found for this event and student.'}), 404

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    'DELETE FROM registrations WHERE event_id = %s AND lower(student_email) = lower(%s)',
                    (event_id, student_email)
                )
                deleted = cur.rowcount
            conn.commit()
        app.logger.debug('Deleted registrations rows=%s for event=%s student=%s', deleted, event_id, student_email)
        if deleted == 0:
            return jsonify({'error': 'No active registration found for this event and student.'}), 404
    except Exception as ex:
        app.logger.exception('Error deleting registration: %s', ex)
        return jsonify({'error': 'Internal error while cancelling registration.'}), 500

    # `find_registration` returns keys via `row_to_dict` which uses camelCase keys
    event_title = registration.get('eventTitle') or registration.get('event_title') or ''
    create_notification(student_email, channel, f'Registration cancelled for "{event_title}".')
    # Notify organizer as well via specialized endpoint
    organizer = registration.get('eventOrganizer') or registration.get('organizer') or None
    try:
        requests.post(f"{NOTIFICATION_SERVICE_BASE}/registrations/cancel", json={
            'studentEmail': student_email,
            'event': {
                'id': event_id,
                'title': event_title
            },
            'organizer': organizer,
            'channel': channel
        }, timeout=2)
    except requests.RequestException:
        app.logger.debug('Unable to call notification registrations/cancel endpoint')

    return jsonify({'message': 'Registration cancelled successfully.'})


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'registration-service'})


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5001, debug=True)
