from app.db.database import get_cursor


def get_workspaces():
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM workspace
        """)
        return cur.fetchall()


def get_workspace_by_id(workspace_id):
    with get_cursor() as cur:
        cur.execute("""
            SELECT * FROM workspace WHERE id = %s
        """, (workspace_id,))
        return cur.fetchone()


def new_workspace(name):
    with get_cursor() as cur:
        cur.execute("""
            INSERT INTO workspace(name)
            VALUES (%s)
            RETURNING id
        """, (name,))
        new_id = cur.fetchone()["id"]
        return {
            "id": new_id,
            "name": name,
        }


def delete_workspace(workspace_id):
    with get_cursor() as cur:
        cur.execute("""
            DELETE FROM workspace WHERE id = %s
        """, (workspace_id,))
