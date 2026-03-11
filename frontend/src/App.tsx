import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import './App.css'

type Student = {
  id: string
  name: string
  email: string
  age: number
}

type StudentDraft = {
  name: string
  email: string
  age: string
}

type DraftErrors = Partial<Record<keyof StudentDraft, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:3000'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (res.ok) return (await res.json()) as T

  let msg = `Request failed (${res.status})`
  try {
    const body = await res.json()
    if (typeof body?.message === 'string') msg = body.message
    else if (Array.isArray(body?.message)) msg = body.message.join(' ')
  } catch {
    // ignore
  }
  throw new Error(msg)
}

function validateDraft(draft: StudentDraft): DraftErrors {
  const errors: DraftErrors = {}

  if (!draft.name.trim()) errors.name = 'Name is required.'

  if (!draft.email.trim()) errors.email = 'Email is required.'
  else if (!EMAIL_RE.test(draft.email.trim())) errors.email = 'Enter a valid email.'

  if (!draft.age.trim()) errors.age = 'Age is required.'
  else {
    const n = Number(draft.age)
    if (!Number.isInteger(n)) errors.age = 'Age must be a whole number.'
    else if (n < 1 || n > 120) errors.age = 'Age must be between 1 and 120.'
  }

  return errors
}

function App() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [query, setQuery] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<StudentDraft>({ name: '', email: '', age: '' })
  const [errors, setErrors] = useState<DraftErrors>({})

  async function loadStudents() {
    setApiError(null)
    try {
      const rows = await api<Student[]>('/students')
      setStudents(rows)
    } catch (e: any) {
      setStudents([])
      setApiError(e?.message ?? 'Failed to load students.')
    }
  }

  useEffect(() => {
    setLoading(true)
    const t = window.setTimeout(async () => {
      await loadStudents()
      setLoading(false)
    }, 650)
    return () => window.clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) => {
      const hay = `${s.name} ${s.email} ${s.age}`.toLowerCase()
      return hay.includes(q)
    })
  }, [query, students])

  const isEditing = editingId !== null

  function startAdd() {
    setEditingId(null)
    setDraft({ name: '', email: '', age: '' })
    setErrors({})
  }

  function startEdit(s: Student) {
    setEditingId(s.id)
    setDraft({ name: s.name, email: s.email, age: String(s.age) })
    setErrors({})
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft({ name: '', email: '', age: '' })
    setErrors({})
  }

  async function submitDraft(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors = validateDraft(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const payload = {
      name: draft.name.trim(),
      email: draft.email.trim(),
      age: Number(draft.age),
    }

    setSaving(true)
    setApiError(null)
    try {
      if (editingId) {
        const updated = await api<Student>(`/students/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        setStudents((prev) => prev.map((s) => (s.id === editingId ? updated : s)))
        cancelEdit()
      } else {
        const created = await api<Student>('/students', { method: 'POST', body: JSON.stringify(payload) })
        setStudents((prev) => [created, ...prev])
        setDraft({ name: '', email: '', age: '' })
        setErrors({})
      }
    } catch (e: any) {
      setApiError(e?.message ?? 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteStudent(s: Student) {
    const ok = window.confirm(`Delete ${s.name}? This cannot be undone.`)
    if (!ok) return
    setSaving(true)
    setApiError(null)
    try {
      await api<{ ok: true }>(`/students/${s.id}`, { method: 'DELETE' })
      setStudents((prev) => prev.filter((x) => x.id !== s.id))
      if (editingId === s.id) cancelEdit()
    } catch (e: any) {
      setApiError(e?.message ?? 'Delete failed.')
    } finally {
      setSaving(false)
    }
  }

  function downloadExcel(rows: Student[], filename: string) {
    const data = rows.map((s) => ({
      Name: s.name,
      Email: s.email,
      Age: s.age,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, filename)
  }

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <div className="mark" aria-hidden />
          <div className="brandText">
            <h1>Students</h1>
            <p>CRUD with validation, loading, filtering, and Excel export. API: {API_BASE}</p>
          </div>
        </div>

        <div className="actions">
          <div className="search">
            <label className="srOnly" htmlFor="q">
              Search
            </label>
            <input
              id="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, age…"
              inputMode="search"
              autoComplete="off"
            />
          </div>
          <button
            className="btn"
            type="button"
            onClick={() => downloadExcel(filtered, 'students_filtered.xlsx')}
            disabled={loading || filtered.length === 0}
            title="Download currently filtered rows"
          >
            Download filtered
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={() => downloadExcel(students, 'students_all.xlsx')}
            disabled={loading || students.length === 0}
            title="Download full dataset"
          >
            Download all
          </button>
        </div>
      </header>

      <main className="grid">
        <section className="panel formPanel" aria-label={isEditing ? 'Edit student' : 'Add student'}>
          <div className="panelHeader">
            <h2>{isEditing ? 'Edit student' : 'Add student'}</h2>
            <div className="panelHeaderRight">
              {!isEditing ? null : (
                <button className="linkBtn" type="button" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
              <button className="linkBtn" type="button" onClick={startAdd} disabled={loading}>
                New
              </button>
            </div>
          </div>

          <form className="form" onSubmit={submitDraft} noValidate>
            {!apiError ? null : <div className="error">{apiError}</div>}
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                aria-invalid={Boolean(errors.name)}
                disabled={loading || saving}
              />
              {!errors.name ? null : <div className="error">{errors.name}</div>}
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                aria-invalid={Boolean(errors.email)}
                inputMode="email"
                autoComplete="email"
                disabled={loading || saving}
              />
              {!errors.email ? null : <div className="error">{errors.email}</div>}
            </div>

            <div className="field">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                value={draft.age}
                onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value }))}
                aria-invalid={Boolean(errors.age)}
                inputMode="numeric"
                disabled={loading || saving}
              />
              {!errors.age ? null : <div className="error">{errors.age}</div>}
            </div>

            <button className="btn primary" type="submit" disabled={loading || saving}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add student'}
            </button>
          </form>
        </section>

        <section className="panel tablePanel" aria-label="Students table">
          <div className="panelHeader">
            <h2>
              Student list <span className="muted">({filtered.length})</span>
            </h2>
            <div className="muted">{loading ? 'Loading…' : `${students.length} total`}</div>
          </div>

          <div className="tableWrap" role="region" aria-label="Scrollable students table" tabIndex={0}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th className="age">Age</th>
                  <th className="actionsCol">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="skeletonRow" aria-hidden>
                        <td>
                          <div className="sk sk1" />
                        </td>
                        <td>
                          <div className="sk sk2" />
                        </td>
                        <td>
                          <div className="sk sk3" />
                        </td>
                        <td>
                          <div className="sk sk4" />
                        </td>
                      </tr>
                    ))}
                  </>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className={editingId === s.id ? 'activeRow' : undefined}>
                      <td>{s.name}</td>
                      <td className="mono">{s.email}</td>
                      <td className="age">{s.age}</td>
                      <td className="actionsCol">
                        <button className="miniBtn" type="button" onClick={() => startEdit(s)}>
                          Edit
                        </button>
                        <button className="miniBtn danger" type="button" onClick={() => deleteStudent(s)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="foot">
        <span className="muted">
          Tip: Use the search box to filter, then click “Download filtered” to export only visible rows.
        </span>
      </footer>
    </div>
  )
}

export default App
