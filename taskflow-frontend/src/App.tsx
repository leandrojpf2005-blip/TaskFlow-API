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
  const [status, setStatus] = useState("not_started");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal_priority");
  const [dueDate, setDueDate] = useState("");

  const API_URL = "http://127.0.0.1:8000/tasks";


  // =====================
  // Delete function
  // =====================

  async function deleteTask(id: number) {
    await fetch(`http://127.0.0.1:8000/tasks/${id}`, {
      method: "DELETE",
    });

    loadTasks();
  }

  // =====================
  // GET TASKS
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
  // CREATE TASK (TITLE ONLY)
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
        status,
        priority,
        due_date: dueDate,
      }),
    });

    setTitle("");
    setStatus("not_started");
    setDescription("");
    setPriority("normal_priority");
    setDueDate("");
    await loadTasks();
  }

  
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>TaskFlow</h1>

      {/* CREATE */}
      <form onSubmit={handleSubmit}>
        <textarea
          rows={1}
          cols={40}
          placeholder="Task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <br></br>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
        <option value="not_started">Not Started</option>
        <option value="in_progress">In Progress</option>
        <option value="finished">Finished</option>
        </select>

        <br></br>

        <textarea
          rows={1}
          cols={40}
          placeholder="Task Description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <br></br>

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

        <br></br>

        <input
        type="datetime-local"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        />

        <br></br>

        <button type="submit">Create Task</button>
      </form>

      <hr />

      <button onClick={loadTasks}>Refresh</button>

      <hr />

      {/* READ */}
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

          <div style={{gap: "10px", marginBottom: "6px" }}>
            <span>🟢 {task.status}</span>
            <span>⚡ {task.priority}</span>
          </div>

          <p style={{ margin: "0 0 6px 0" }}>{task.description}</p>

          <small style={{ color: "gray" }}>
            📅 {task.due_date ?? "No due date"}
          </small>
          <br></br>
          <button
            onClick={() => deleteTask(task.id)}
            style={{
            marginTop: "8px",
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