import { useEffect, useMemo, useState } from "react";
import "./App.css";

type TaskStatus = "not_started" | "in_progress" | "paused" | "finished";
type TaskPriority =
  | "no_priority"
  | "low_priority"
  | "normal_priority"
  | "high_priority"
  | "very_high_priority";

type Task = {
  id: number;
  title: string;
  status: TaskStatus;
  description: string;
  priority: TaskPriority;
  due_date: string | null;
};

type Workspace = {
  id: number;
  name: string;
};

type TaskColumn = {
  status: TaskStatus;
  label: string;
};

type PriorityOption = {
  value: TaskPriority;
  label: string;
};

const API_BASE_URL = "http://127.0.0.1:8000";

const columns: TaskColumn[] = [
  { status: "not_started", label: "Backlog" },
  { status: "in_progress", label: "Active" },
  { status: "paused", label: "Paused" },
  { status: "finished", label: "Done" },
];

const priorities: PriorityOption[] = [
  { value: "no_priority", label: "None" },
  { value: "low_priority", label: "Low" },
  { value: "normal_priority", label: "Normal" },
  { value: "high_priority", label: "High" },
  { value: "very_high_priority", label: "Urgent" },
];

const priorityLabels: Record<TaskPriority, string> = {
  no_priority: "None",
  low_priority: "Low",
  normal_priority: "Normal",
  high_priority: "High",
  very_high_priority: "Urgent",
};

const statusLabels: Record<TaskStatus, string> = {
  not_started: "Backlog",
  in_progress: "Active",
  paused: "Paused",
  finished: "Done",
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal_priority");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );

  const groupedTasks = useMemo(
    () =>
      columns.reduce<Record<TaskStatus, Task[]>>(
        (groups, column) => {
          groups[column.status] = tasks.filter(
            (task) => task.status === column.status,
          );
          return groups;
        },
        {
          not_started: [],
          in_progress: [],
          paused: [],
          finished: [],
        },
      ),
    [tasks],
  );

  const activeCount = groupedTasks.in_progress.length;
  const completedCount = groupedTasks.finished.length;
  const dueSoonCount = tasks.filter((task) => isDueSoon(task.due_date)).length;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(API_BASE_URL + path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const details = await response.json().catch(() => null);
      throw new Error(details?.detail ?? "TaskFlow could not complete that action.");
    }

    return response.json();
  }

  async function loadTasks(workspaceId = activeWorkspaceId) {
    if (!workspaceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const taskList = await request<Task[]>("/tasks?workspace_id=" + workspaceId);
      setTasks(taskList);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isCurrent = true;

    async function fetchWorkspaces() {
      try {
        const workspaceList = await request<Workspace[]>("/workspaces");

        if (!isCurrent) return;

        setWorkspaces(workspaceList);
        setActiveWorkspaceId((currentId) =>
          currentId ?? workspaceList.at(0)?.id ?? null,
        );
      } catch (loadError) {
        if (isCurrent) setError(getErrorMessage(loadError));
      }
    }

    void fetchWorkspaces();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    let isCurrent = true;

    async function fetchTasks() {
      setIsLoading(true);
      setError(null);

      try {
        const taskList = await request<Task[]>(
          "/tasks?workspace_id=" + activeWorkspaceId,
        );

        if (isCurrent) setTasks(taskList);
      } catch (loadError) {
        if (isCurrent) setError(getErrorMessage(loadError));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void fetchTasks();

    return () => {
      isCurrent = false;
    };
  }, [activeWorkspaceId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!activeWorkspaceId || !title.trim() || !description.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      await request<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
          due_date: dueDate || null,
          workspace_id: activeWorkspaceId,
        }),
      });

      setTitle("");
      setDescription("");
      setPriority("normal_priority");
      setDueDate("");
      await loadTasks(activeWorkspaceId);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function createWorkspace(event: React.FormEvent) {
    event.preventDefault();

    if (!workspaceName.trim()) return;

    setError(null);

    try {
      const workspace = await request<Workspace>("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: workspaceName.trim() }),
      });
      setWorkspaceName("");
      setWorkspaces((current) => [...current, workspace]);
      setActiveWorkspaceId(workspace.id);
    } catch (workspaceError) {
      setError(getErrorMessage(workspaceError));
    }
  }

  async function deleteTask(id: number) {
    setError(null);

    try {
      await request<{ message: string }>("/tasks/" + id, {
        method: "DELETE",
      });
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  }

  async function updateStatus(id: number, status: TaskStatus) {
    setError(null);

    try {
      await request<number>("/tasks/" + id, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === id ? { ...task, status } : task,
        ),
      );
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Workspace navigation">
        <div className="brand-lockup">
          <div className="brand-mark">TF</div>
          <div>
            <h1>TaskFlow</h1>
            <p>{activeWorkspace?.name ?? "No workspace"}</p>
          </div>
        </div>

        <div className="workspace-list" aria-label="Workspaces">
          {workspaces.map((workspace) => (
            <button
              className={workspace.id === activeWorkspaceId ? "is-active" : ""}
              key={workspace.id}
              onClick={() => setActiveWorkspaceId(workspace.id)}
              type="button"
            >
              <span>{workspace.name}</span>
              <strong>{workspace.id === activeWorkspaceId ? tasks.length : ""}</strong>
            </button>
          ))}
        </div>

        <form className="workspace-form" onSubmit={createWorkspace}>
          <label htmlFor="workspaceName">New workspace</label>
          <div>
            <input
              id="workspaceName"
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Design sprint"
              type="text"
              value={workspaceName}
            />
            <button type="submit">Add</button>
          </div>
        </form>
      </aside>

      <section className="workspace-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Today</p>
            <h2>{activeWorkspace?.name ?? "Create a workspace"}</h2>
          </div>
          <button className="ghost-button" onClick={() => loadTasks()} type="button">
            Refresh
          </button>
        </header>

        <section className="stats-grid" aria-label="Task summary">
          <Stat label="Total" value={tasks.length} />
          <Stat label="Active" value={activeCount} tone="green" />
          <Stat label="Due soon" value={dueSoonCount} tone="amber" />
          <Stat label="Done" value={completedCount} tone="blue" />
        </section>

        {error && <div className="error-banner">{error}</div>}

        <form className="task-composer" onSubmit={handleSubmit}>
          <div className="composer-main">
            <label htmlFor="taskTitle">Task</label>
            <input
              id="taskTitle"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Write the next concrete task"
              type="text"
              value={title}
            />
          </div>

          <div className="composer-main description-field">
            <label htmlFor="taskDescription">Details</label>
            <input
              id="taskDescription"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Outcome, context, or handoff note"
              type="text"
              value={description}
            />
          </div>

          <div className="composer-control">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              value={priority}
            >
              {priorities.map((priorityOption) => (
                <option key={priorityOption.value} value={priorityOption.value}>
                  {priorityOption.label}
                </option>
              ))}
            </select>
          </div>

          <div className="composer-control">
            <label htmlFor="dueDate">Due</label>
            <input
              id="dueDate"
              onChange={(event) => setDueDate(event.target.value)}
              type="datetime-local"
              value={dueDate}
            />
          </div>

          <button
            className="primary-button"
            disabled={!activeWorkspaceId || isSaving}
            type="submit"
          >
            {isSaving ? "Saving" : "Create"}
          </button>
        </form>

        <section className="board" aria-busy={isLoading} aria-label="Task board">
          {columns.map((column) => (
            <section className="task-column" key={column.status}>
              <header>
                <h3>{column.label}</h3>
                <span>{groupedTasks[column.status].length}</span>
              </header>

              <div className="task-stack">
                {groupedTasks[column.status].map((task) => (
                  <TaskCard
                    key={task.id}
                    onDelete={deleteTask}
                    onStatusChange={updateStatus}
                    task={task}
                  />
                ))}

                {!isLoading && groupedTasks[column.status].length === 0 && (
                  <div className="empty-state">No {column.label.toLowerCase()} tasks</div>
                )}
              </div>
            </section>
          ))}
        </section>
      </section>
    </main>
  );
}

function Stat({
  label,
  tone = "neutral",
  value,
}: {
  label: string;
  tone?: "neutral" | "green" | "amber" | "blue";
  value: number;
}) {
  return (
    <div className={"stat-card " + tone}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TaskCard({
  onDelete,
  onStatusChange,
  task,
}: {
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: TaskStatus) => void;
  task: Task;
}) {
  return (
    <article className={"task-card priority-" + task.priority}>
      <div className="task-card-header">
        <span className="priority-pill">{priorityLabels[task.priority]}</span>
        <span>{statusLabels[task.status]}</span>
      </div>

      <h4>{task.title}</h4>
      <p>{task.description}</p>

      <div className="task-meta">
        <span>{formatDueDate(task.due_date)}</span>
      </div>

      <div className="task-actions">
        {task.status === "not_started" && (
          <button onClick={() => onStatusChange(task.id, "in_progress")} type="button">
            Start
          </button>
        )}

        {task.status === "in_progress" && (
          <>
            <button onClick={() => onStatusChange(task.id, "paused")} type="button">
              Pause
            </button>
            <button onClick={() => onStatusChange(task.id, "finished")} type="button">
              Finish
            </button>
          </>
        )}

        {task.status === "paused" && (
          <>
            <button onClick={() => onStatusChange(task.id, "in_progress")} type="button">
              Continue
            </button>
            <button onClick={() => onStatusChange(task.id, "finished")} type="button">
              Finish
            </button>
          </>
        )}

        {task.status === "finished" && <span className="completed-label">Completed</span>}

        <button className="danger-button" onClick={() => onDelete(task.id)} type="button">
          Delete
        </button>
      </div>
    </article>
  );
}

function formatDueDate(value: string | null) {
  if (!value) return "No due date";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function isDueSoon(value: string | null) {
  if (!value) return false;

  const dueDate = new Date(value).getTime();
  const now = Date.now();
  const threeDays = 1000 * 60 * 60 * 24 * 3;

  return dueDate >= now && dueDate <= now + threeDays;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default App;
