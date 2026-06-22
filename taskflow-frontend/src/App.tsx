import { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  status: string;
  description: string;
  priority: string;
  due_date: string | null;
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal_priority");
  const [dueDate, setDueDate] = useState("");

  const API_URL = "http://127.0.0.1:8000/tasks";

  // =====================
  // LOAD TASKS
  // =====================
  async function loadTasks() {
    const res = await fetch(API_URL);
    const data = await res.json();
    setTasks(data);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  // =====================
  // CREATE TASK
  // =====================
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) return;

    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        priority,
        due_date: dueDate || null,
      }),
    });

    setTitle("");
    setDescription("");
    setPriority("normal_priority");
    setDueDate("");

    loadTasks();
  }

  // =====================
  // DELETE TASK
  // =====================
  async function deleteTask(id: number) {
    await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    loadTasks();
  }

  // =====================
  // UPDATE STATUS
  // =====================
  async function updateStatus(id: number, status: string) {
    await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    loadTasks();
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>TaskFlow</h1>

      {/* ===================== */}
      {/* CREATE TASK FORM */}
      {/* ===================== */}
      <form onSubmit={handleSubmit}>
        <textarea
          rows={1}
          cols={40}
          placeholder="Task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <br />

        <textarea
          rows={1}
          cols={40}
          placeholder="Task Description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <br />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="no_priority">None</option>
          <option value="low_priority">Low</option>
          <option value="normal_priority">Normal</option>
          <option value="high_priority">High</option>
          <option value="very_high_priority">Very High</option>
        </select>

        <br />

        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <br />

        <button type="submit">Create Task</button>
      </form>

      <hr />

      <button onClick={loadTasks}>Refresh</button>

      <hr />

      {/* ===================== */}
      {/* TASK LIST */}
      {/* ===================== */}
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            marginBottom: "12px",
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ margin: "0 0 6px 0" }}>{task.title}</h3>

          <div style={{ marginBottom: "6px" }}>
            <span>🟢 {task.status}</span>{" "}
            <span>⚡ {task.priority}</span>
          </div>

          <p style={{ margin: 0 }}>{task.description}</p>

          <small style={{ color: "gray" }}>
            📅 {task.due_date ?? "No due date"}
          </small>

          <br />

          {/* ===================== */}
          {/* STATUS BUTTON LOGIC */}
          {/* ===================== */}

          {task.status === "not_started" && (
            <button
              onClick={() =>
                updateStatus(task.id, "in_progress")
              }
              style={{ marginTop: "8px" }}
            >
              Start
            </button>
          )}

          {task.status === "in_progress" && (
            <>
              <button
                onClick={() =>
                  updateStatus(task.id, "paused")
                }
                style={{
                  marginTop: "8px",
                  marginRight: "5px",
                }}
              >
                Pause
              </button>

              <button
                onClick={() =>
                  updateStatus(task.id, "finished")
                }
                style={{ marginTop: "8px" }}
              >
                Finish
              </button>
            </>
          )}

          {task.status === "paused" && (
            <>
              <button
                onClick={() =>
                  updateStatus(task.id, "in_progress")
                }
                style={{
                  marginTop: "8px",
                  marginRight: "5px",
                }}
              >
                Continue
              </button>

              <button
                onClick={() =>
                  updateStatus(task.id, "finished")
                }
                style={{ marginTop: "8px" }}
              >
                Finish
              </button>
            </>
          )}

          {task.status === "finished" && (
            <span
              style={{
                display: "block",
                marginTop: "8px",
                color: "green",
                fontWeight: "bold",
              }}
            >
              ✔ Completed
            </span>
          )}

          {/* ===================== */}
          {/* DELETE */}
          {/* ===================== */}
          <button
            onClick={() => deleteTask(task.id)}
            style={{
              marginTop: "8px",
              marginLeft: "8px",
              padding: "6px 10px",
              background: "red",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default App;