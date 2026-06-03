from datetime import datetime
from uuid import uuid4
import os
import threading

import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, jsonify, request
from flask_cors import CORS

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
                CREATE TABLE IF NOT EXISTS notifications (
                    id TEXT PRIMARY KEY,
                    recipient TEXT NOT NULL,
                    channel TEXT NOT NULL,
                    message TEXT NOT NULL,
                    is_read BOOLEAN NOT NULL DEFAULT FALSE,
                    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
                    source TEXT NULL,
                    event_id TEXT NULL,
                    created_at TIMESTAMPTZ NOT NULL
                )
            ''')
            cur.execute('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE')
            cur.execute('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS source TEXT')
            cur.execute('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_id TEXT')
        conn.commit()


def row_to_dict(row):
    if row is None:
        return None
    return {
        'id': row['id'],
        'recipient': row['recipient'],
        'channel': row['channel'],
        'message': row['message'],
        'read': bool(row['is_read']),
        'created_at': row['created_at'].isoformat() if hasattr(row['created_at'], 'isoformat') else row['created_at'],
        'source': row.get('source'),
        'event_id': row.get('event_id')
    }


# -------------------------
# Notification patterns
# -------------------------


class NotificationCommand:
    """Command pattern: encapsulates a notification action."""
    def __init__(self, recipient, channel, message, meta=None):
        self.recipient = recipient
        self.channel = channel
        self.message = message
        self.meta = meta or {}

    def execute(self, observers):
        for obs in observers:
            try:
                obs.update(self)
            except Exception as e:
                print('Observer error', type(obs), e)


class ChannelStrategy:
    """Strategy pattern: different channel implementations."""
    def send(self, recipient, message):
        raise NotImplementedError()


class EmailStrategy(ChannelStrategy):
    def __init__(self, adapter):
        self.adapter = adapter

    def send(self, recipient, message):
        # adapter knows how to send email
        self.adapter.send_email(recipient, message)


class SmsStrategy(ChannelStrategy):
    def send(self, recipient, message):
        # Simulate SMS sending
        print(f"SMS to {recipient}: {message}")


class EmailAdapter:
    """Adapter pattern: adapts local calls to an external email provider."""
    def send_email(self, recipient, message):
        # In real system, integrate with SMTP or 3rd-party API here.
        print(f"[EmailAdapter] Sending email to {recipient}: {message}")


class NotificationObserver:
    """Base observer interface for Observer pattern."""
    def update(self, command: NotificationCommand):
        raise NotImplementedError()


class DatabaseObserver(NotificationObserver):
    """Saves notifications to DB."""
    def update(self, command: NotificationCommand):
        meta_event = command.meta.get('event') if isinstance(command.meta, dict) else None
        event_id = None
        if isinstance(meta_event, dict):
            event_id = meta_event.get('id') or meta_event.get('eventId')
        source = command.meta.get('source') if isinstance(command.meta, dict) else None

        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # deduplicate based on the same recipient/channel/source/event_id
                if source or event_id:
                    cur.execute(
                        '''
                        SELECT id FROM notifications
                        WHERE lower(recipient)=lower(%s)
                          AND channel=%s
                          AND is_deleted = FALSE
                          AND (source=%s OR (%s IS NULL AND source IS NULL))
                          AND (event_id=%s OR (%s IS NULL AND event_id IS NULL))
                        LIMIT 1
                        ''',
                        (command.recipient, command.channel.upper(), source, source, event_id, event_id)
                    )
                else:
                    cur.execute(
                        '''
                        SELECT id FROM notifications
                        WHERE lower(recipient)=lower(%s)
                          AND channel=%s
                          AND is_deleted = FALSE
                          AND message=%s
                        LIMIT 1
                        ''',
                        (command.recipient, command.channel.upper(), command.message)
                    )
                existing = cur.fetchone()
                if existing:
                    return

                notification = {
                    'id': str(uuid4()),
                    'recipient': command.recipient,
                    'channel': command.channel.upper(),
                    'message': command.message,
                    'is_read': False,
                    'is_deleted': False,
                    'source': source,
                    'event_id': event_id,
                    'created_at': datetime.utcnow()
                }
                cur.execute(
                    '''
                    INSERT INTO notifications (id, recipient, channel, message, is_read, is_deleted, source, event_id, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ''',
                    (
                        notification['id'],
                        notification['recipient'],
                        notification['channel'],
                        notification['message'],
                        notification['is_read'],
                        notification['is_deleted'],
                        notification['source'],
                        notification['event_id'],
                        notification['created_at']
                    )
                )
            conn.commit()


class ChannelObserver(NotificationObserver):
    """Sends notifications via a channel strategy. Uses Template Method for formatting."""
    def __init__(self, strategy: ChannelStrategy):
        self.strategy = strategy

    def format_message(self, command: NotificationCommand):
        # Template Method: subclasses could override steps; keep simple here.
        return f"[{command.meta.get('source','system')}] {command.message}"

    def update(self, command: NotificationCommand):
        formatted = self.format_message(command)
        # send in background to avoid blocking
        threading.Thread(target=self.strategy.send, args=(command.recipient, formatted), daemon=True).start()


class NotificationManager:
    """Singleton + Observer registry: manages observers and dispatching."""
    _instance = None

    def __init__(self):
        if NotificationManager._instance is not None:
            raise RuntimeError('Use get_instance()')
        self.observers = []

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = NotificationManager()
        return cls._instance

    def register(self, observer: NotificationObserver):
        self.observers.append(observer)

    def unregister(self, observer: NotificationObserver):
        self.observers.remove(observer)

    def notify(self, recipients, channel, message, meta=None):
        # recipients may be a list or a single recipient
        if isinstance(recipients, str):
            recipients = [recipients]
        for r in recipients:
            cmd = NotificationCommand(r, channel, message, meta)
            # execute command: persistence + channel delivery
            cmd.execute(self.observers)


# Initialize the notification manager and register observers
manager = NotificationManager.get_instance()
manager.register(DatabaseObserver())
email_adapter = EmailAdapter()
manager.register(ChannelObserver(EmailStrategy(email_adapter)))
manager.register(ChannelObserver(SmsStrategy()))

# -------------------------
# End patterns
# -------------------------


@app.route('/notifications', methods=['GET'])
def list_notifications():
    recipients = request.args.get('recipient')
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if recipients:
                cur.execute(
                    'SELECT * FROM notifications WHERE lower(recipient) = lower(%s) AND is_deleted = FALSE ORDER BY created_at DESC',
                    (recipients,)
                )
            else:
                cur.execute('SELECT * FROM notifications WHERE is_deleted = FALSE ORDER BY created_at DESC')
            rows = cur.fetchall()
    notifications = [row_to_dict(row) for row in rows]
    return jsonify(notifications)


@app.route('/notifications', methods=['POST'])
def create_notification():
    payload = request.get_json() or {}
    recipient = payload.get('recipient')
    channel = payload.get('channel', 'SYSTEM')
    message = payload.get('message')
    source = payload.get('source')
    event = payload.get('event') or {}
    event_id = None
    if isinstance(event, dict):
        event_id = event.get('id') or event.get('eventId')

    if not recipient or not message:
        return jsonify({'error': 'recipient and message are required.'}), 400

    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if source or event_id:
                cur.execute(
                    '''
                    SELECT * FROM notifications
                    WHERE lower(recipient)=lower(%s)
                      AND channel=%s
                      AND is_deleted = FALSE
                      AND (source=%s OR (%s IS NULL AND source IS NULL))
                      AND (event_id=%s OR (%s IS NULL AND event_id IS NULL))
                    LIMIT 1
                    ''',
                    (recipient, channel.upper(), source, source, event_id, event_id)
                )
            else:
                cur.execute(
                    '''
                    SELECT * FROM notifications
                    WHERE lower(recipient)=lower(%s)
                      AND channel=%s
                      AND is_deleted = FALSE
                      AND message=%s
                    LIMIT 1
                    ''',
                    (recipient, channel.upper(), message)
                )
            existing = cur.fetchone()
            if existing:
                return jsonify(row_to_dict(existing)), 200

            notification = {
                'id': str(uuid4()),
                'recipient': recipient,
                'channel': channel.upper(),
                'message': message,
                'is_read': False,
                'is_deleted': False,
                'source': source,
                'event_id': event_id,
                'created_at': datetime.utcnow()
            }
            cur.execute(
                '''
                INSERT INTO notifications (
                    id, recipient, channel, message, is_read, is_deleted, source, event_id, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''',
                (
                    notification['id'],
                    notification['recipient'],
                    notification['channel'],
                    notification['message'],
                    notification['is_read'],
                    notification['is_deleted'],
                    notification['source'],
                    notification['event_id'],
                    notification['created_at']
                )
            )
            cur.execute('SELECT * FROM notifications WHERE id = %s', (notification['id'],))
            notification = cur.fetchone()
        conn.commit()

    return jsonify(row_to_dict(notification)), 201


@app.route('/notifications/<notification_id>/read', methods=['PUT'])
def mark_read(notification_id):
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'UPDATE notifications SET is_read = TRUE WHERE id = %s AND is_deleted = FALSE',
                (notification_id,)
            )
            if cur.rowcount == 0:
                return jsonify({'error': 'Notification not found.'}), 404
            cur.execute('SELECT * FROM notifications WHERE id = %s', (notification_id,))
            notification = row_to_dict(cur.fetchone())
        conn.commit()
    return jsonify(notification)


@app.route('/notifications/<notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'UPDATE notifications SET is_deleted = TRUE WHERE id = %s AND is_deleted = FALSE',
                (notification_id,)
            )
            if cur.rowcount == 0:
                return jsonify({'error': 'Notification not found or already deleted.'}), 404
            cur.execute('SELECT * FROM notifications WHERE id = %s', (notification_id,))
            notification = row_to_dict(cur.fetchone())
        conn.commit()
    return jsonify({'status': 'deleted', 'notification': notification}), 200


@app.route('/notifications', methods=['DELETE'])
def clear_notifications():
    recipient = request.args.get('recipient')
    with get_db() as conn:
        with conn.cursor() as cur:
            if recipient:
                cur.execute(
                    'UPDATE notifications SET is_deleted = TRUE WHERE lower(recipient)=lower(%s) AND is_deleted = FALSE',
                    (recipient,)
                )
            else:
                cur.execute('UPDATE notifications SET is_deleted = TRUE WHERE is_deleted = FALSE')
            deleted = cur.rowcount
        conn.commit()
    return jsonify({'status': 'cleared', 'deleted': deleted}), 200


@app.route('/events/created', methods=['POST'])
def event_created():
    payload = request.get_json() or {}
    event = payload.get('event') or {}
    recipients = payload.get('recipients')  # optional list
    message = payload.get('message') or f"New event created: {event.get('title') if event else 'an event'}"
    channel = payload.get('channel', 'EMAIL')

    if not recipients:
        # default broadcast to students and admin
        recipients = ['ALL_STUDENTS', 'ADMIN']

    manager.notify(recipients, channel, message, meta={'source': 'event-created', 'event': event})
    return jsonify({'status': 'notified', 'recipients': recipients}), 202


@app.route('/events/deleted', methods=['POST'])
def event_deleted():
    payload = request.get_json() or {}
    event = payload.get('event') or {}
    affected_students = payload.get('affectedStudents') or []
    message = payload.get('message') or f"Event cancelled: {event.get('title') if event else 'an event'}"
    channel = payload.get('channel', 'EMAIL')

    # notify affected students and event organizer/admin
    recipients = affected_students + ([payload.get('organizer')] if payload.get('organizer') else []) + (['ADMIN'] if payload.get('notifyAdmin', True) else [])
    if not recipients:
        recipients = ['ADMIN']

    manager.notify(recipients, channel, message, meta={'source': 'event-deleted', 'event': event})
    return jsonify({'status': 'notified', 'recipients': recipients}), 202


@app.route('/registrations/created', methods=['POST'])
def registration_created():
    payload = request.get_json() or {}
    student = payload.get('studentEmail')
    event = payload.get('event') or {}
    organizer = payload.get('organizer')
    channel = payload.get('channel', 'EMAIL')

    message_student = payload.get('studentMessage') or f"You've been registered for {event.get('title', 'an event')}"
    message_organizer = payload.get('organizerMessage') or f"New registration for your event {event.get('title', 'an event')}"

    recipients = []
    if student:
        recipients.append(student)
        manager.notify([student], channel, message_student, meta={'source': 'registration-created', 'event': event})
    if organizer:
        recipients.append(organizer)
        manager.notify([organizer], channel, message_organizer, meta={'source': 'registration-created', 'event': event})

    return jsonify({'status': 'notified', 'recipients': recipients}), 202


@app.route('/registrations/cancel', methods=['POST'])
def registration_cancelled():
    payload = request.get_json() or {}
    student = payload.get('studentEmail')
    event = payload.get('event') or {}
    organizer = payload.get('organizer')
    channel = payload.get('channel', 'EMAIL')

    message = payload.get('message') or f"Registration cancelled for {event.get('title', 'an event')}"
    recipients = []
    if student:
        recipients.append(student)
    if organizer:
        recipients.append(organizer)
    if not recipients:
        recipients = ['ADMIN']

    manager.notify(recipients, channel, message, meta={'source': 'registration-cancel', 'event': event})
    return jsonify({'status': 'notified', 'recipients': recipients}), 202


@app.route('/events/full', methods=['POST'])
def event_full():
    payload = request.get_json() or {}
    event = payload.get('event') or {}
    organizer = payload.get('organizer')
    channel = payload.get('channel', 'EMAIL')
    message = payload.get('message') or f"Event is full: {event.get('title', 'an event')}"

    recipients = ([organizer] if organizer else []) + (['ADMIN'] if payload.get('notifyAdmin', True) else [])
    if not recipients:
        recipients = ['ADMIN']

    manager.notify(recipients, channel, message, meta={'source': 'event-full', 'event': event})
    return jsonify({'status': 'notified', 'recipients': recipients}), 202


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'notification-service'})


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
