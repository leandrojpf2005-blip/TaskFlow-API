import psycopg2
from psycopg2 import pool
import psycopg2.extras
from contextlib import contextmanager

connection_pool = pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=40,
    dbname="taskflow", user="postgres", password="352",
    host="localhost", port="5432",
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