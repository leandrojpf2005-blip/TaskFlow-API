import psycopg2

conn = psycopg2.connect(
    dbname="taskflow",
    user="postgres",
    password="352",
    host="localhost",
    port="5432"
)

cursor = conn.cursor()