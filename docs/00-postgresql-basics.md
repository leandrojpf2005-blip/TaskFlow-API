# PostgreSQL Basics (TaskFlow Handbook)

## What is PostgreSQL?

PostgreSQL is a relational database system used to permanently store application data.

In TaskFlow:
- FastAPI receives requests (create, update, delete tasks)
- PostgreSQL stores and manages the data
- Data remains saved even if the server stops

Simple idea:
FastAPI = logic  
PostgreSQL = storage

------------------------------------------------------------

## How to connect to PostgreSQL

psql -U postgres

Inside psql:

\l        → list databases  
\c taskflow → connect to database  
\dt       → list tables  
\d tasks  → describe table structure  
\q        → exit

------------------------------------------------------------

## Most common SQL commands

CREATE DATABASE taskflow;

SELECT * FROM tasks;

SELECT * FROM tasks WHERE id = 1;

------------------------------------------------------------

## Create a table

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT,
    description TEXT,
    priority TEXT,
    due_date TIMESTAMP
);

------------------------------------------------------------

## Key idea

PostgreSQL is responsible for data persistence.

TaskFlow flow:

Frontend → FastAPI → Repository → PostgreSQL

Each layer has one responsibility.

------------------------------------------------------------

## What I learned

- PostgreSQL stores data permanently
- psql is used to interact with the database
- SQL commands handle CRUD operations
- FastAPI communicates with PostgreSQL through backend queries