import os
import uuid
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('POSTGRES_DB', 'university_event_system')
POSTGRES_USER = os.getenv('POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', '1234')

conn = psycopg2.connect(host=POSTGRES_HOST, port=POSTGRES_PORT, dbname=POSTGRES_DB, user=POSTGRES_USER, password=POSTGRES_PASSWORD)
try:
    with conn:
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO registrations (id, event_id, student_email, channel, created_at, event_title, event_description, event_date, event_capacity, event_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            ''', (
                str(uuid.uuid4()),
                '1',
                'foo@example.com',
                'EMAIL',
                datetime.utcnow(),
                'Test Event',
                'Test description',
                '2026-06-02T12:00:00',
                10,
                'WORKSHOP'
            ))
    print('Inserted test registration for event 1 / foo@example.com')
finally:
    conn.close()
