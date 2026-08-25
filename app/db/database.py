import os
import psycopg2
from psycopg2 import pool
import psycopg2.extras
from contextlib import contextmanager

connection_pool = pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=40,
    dbname=os.environ.get("DB_NAME", "taskflow"),
    user=os.environ.get("DB_USER", "postgres"),
    password=os.environ["DB_PASSWORD"],
    host=os.environ.get("DB_HOST", "db"),
    port=os.environ.get("DB_PORT", "5432"),
)

@contextmanager
def get_cursor():
    conn = connection_pool.getconn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        connection_pool.putconn(conn)