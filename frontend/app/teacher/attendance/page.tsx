'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'
import { CheckCircle, XCircle, Save } from 'lucide-react'
import TeacherSidebar from '@/components/TeacherSidebar'

export default function TeacherAttendancePage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [roster, setRoster] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<number, boolean | null>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const teacherId = localStorage.getItem('teacher_id') || '1'
      const res = await axios.get(`http://localhost:8000/teacher/${teacherId}/subjects`)
      setSubjects(res.data.subjects || [])
      if (res.data.subjects?.length > 0) {
        selectSubject(res.data.subjects[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectSubject = async (subject: any) => {
    setSelectedSubject(subject)
    setSaveResult(null)
    try {
      const res = await axios.get(`http://localhost:8000/teacher/roster/${subject.subject_id}/${subject.semester}`)
      setRoster(res.data.students || [])
      const initial: Record<number, boolean | null> = {}
      res.data.students.forEach((s: any) => { initial[s.student_id] = null })
      setAttendance(initial)
    } catch (err) {
      console.error(err)
    }
  }

  const toggle = (studentId: number, value: boolean) => {
    setAttendance(prev => ({ ...prev, [studentId]: value }))
  }

  const markAllPresent = () => {
    const updated: Record<number, boolean | null> = {}
    roster.forEach(s => { updated[s.student_id] = true })
    setAttendance(updated)
  }

  const allMarked = roster.length > 0 && roster.every(s => attendance[s.student_id] !== null)

  const handleSave = async () => {
    if (!selectedSubject || !allMarked) return
    setSaving(true)
    setSaveResult(null)
    try {
      const teacherId = localStorage.getItem('teacher_id') || '1'
      const entries = roster.map(s => ({
        student_id: s.student_id,
        is_present: attendance[s.student_id]
      }))
      await axios.post('http://localhost:8000/teacher/attendance/mark', {
        teacher_id: parseInt(teacherId),
        subject_id: selectedSubject.subject_id,
        semester: selectedSubject.semester,
        date,
        entries
      })
      setSaveResult('success')
    } catch (err: any) {
      setSaveResult(err?.response?.data?.detail || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-teal-900 border-t-teal-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex overflow-x-hidden">
      <style>{`
        .soft-card { transition: box-shadow 0.25s ease, border-color 0.25s ease; }
        .soft-card:hover { box-shadow: 0 0 0 1px rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.16) !important; }
      `}</style>
      <TeacherSidebar />

      <main className="flex-1 min-w-0 px-4 pb-8 sm:px-8 lg:px-14 pt-16 lg:pt-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white">Mark Attendance</h1>
          <p className="text-gray-400 text-sm mt-1">Select a class and date, then mark each student.</p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          {subjects.map((s) => (
            <button
              key={`${s.subject_id}-${s.semester}`}
              onClick={() => selectSubject(s)}
              className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
                selectedSubject?.subject_id === s.subject_id && selectedSubject?.semester === s.semester
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'bg-white/3 text-gray-400 border border-white/6 hover:bg-white/5'
              }`}>
              {s.subject_name} — Sem {s.semester}
            </button>
          ))}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-[#15151f] border border-white/10 rounded-xl px-4 py-2 text-sm text-white"
          />
        </div>

        {selectedSubject && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">{roster.length} students in Semester {selectedSubject.semester}</p>
              <button
                onClick={markAllPresent}
                className="text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors">
                Mark all present
              </button>
            </div>

            <div className="space-y-2">
              {roster.map((student, i) => (
                <motion.div
                  key={student.student_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="soft-card bg-[#15151f] rounded-xl px-5 py-3.5 border border-white/6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.roll_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggle(student.student_id, true)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        attendance[student.student_id] === true
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/3 text-gray-500 border border-white/6 hover:bg-white/5'
                      }`}>
                      <CheckCircle size={13} /> Present
                    </button>
                    <button
                      onClick={() => toggle(student.student_id, false)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        attendance[student.student_id] === false
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/3 text-gray-500 border border-white/6 hover:bg-white/5'
                      }`}>
                      <XCircle size={13} /> Absent
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={!allMarked || saving}
                className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl text-white transition-opacity disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #14b8a6, #8B5CF6)' }}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
              {!allMarked && <p className="text-xs text-amber-400">Mark every student before saving.</p>}
              {saveResult === 'success' && <p className="text-xs text-green-400">Saved! Students have been notified.</p>}
              {saveResult && saveResult !== 'success' && <p className="text-xs text-red-400">{saveResult}</p>}
            </div>
          </>
        )}
      </main>
    </div>
  )
}