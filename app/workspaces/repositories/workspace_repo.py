from app.db.database import conn, cursor
import psycopg2.extras

cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

def get_workspaces():
    cursor.execute("""
        SELECT * FROM workspace
""")
    workspaces = cursor.fetchall()
    return workspaces

def get_workspace_by_id(workspace_id):
    cursor.execute("""
        SELECT * FROM workspace WHERE id = %s
    """, (workspace_id,))

    return cursor.fetchone()

def new_workspace(name):
    cursor.execute("""
        INSERT INTO workspace(name)
        VALUES (%s)
        RETURNING id
""", (name,))
    
    new_id = cursor.fetchone()["id"]
    conn.commit()

    return {
        "id": new_id,
        "name": name,
    }

def delete_workspace(workspace_id):
    cursor.execute("""
        DELETE FROM workspace WHERE id = %s
    """, (workspace_id,))

    conn.commit()