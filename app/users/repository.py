from app.db.database import get_cursor


def create_user(username, email, password_hash):
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO users (username, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id, created_at
        """, (username, email, password_hash))
        row = cur.fetchone()
        return {
            "id": row["id"],
            "username": username,
            "email": email,
            "created_at": row["created_at"],
        }


def get_user_by_email(email):
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM users
            WHERE email = %s
        """, (email,))
        return cur.fetchone()


def get_user_by_id(user_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM users
            WHERE id = %s
        """, (user_id,))
        return cur.fetchone()
