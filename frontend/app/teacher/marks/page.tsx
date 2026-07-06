'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Save, Award } from 'lucide-react'
import TeacherSidebar from '@/components/TeacherSidebar'

const EXAM_TOTALS: Record<string, number> = { 'Internal 1': 30, 'Internal 2': 30, 'External': 100 }

export default function TeacherMarksPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [examType, setExamType] = useState<'Internal 1' | 'Internal 2' | 'External'>('Internal 1')
  const [roster, setRoster] = useState<any[]>([])
  const [marks, setMarks] = useState<Record<number, string>>({})
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
      const initial: Record<number, string> = {}
      res.data.students.forEach((s: any) => { initial[s.student_id] = '' })
      setMarks(initial)
    } catch (err) {
      console.error(err)
    }
  }

  const updateMark = (studentId: number, value: string) => {
    setMarks(prev => ({ ...prev, [studentId]: value }))
  }

  const total = EXAM_TOTALS[examType]
  const allFilled = roster.length > 0 && roster.every(s => marks[s.student_id] !== '' && marks[s.student_id] !== undefined)
  const anyInvalid = roster.some(s => {
    const v = parseFloat(marks[s.student_id])
    return marks[s.student_id] !== '' && (isNaN(v) || v < 0 || v > total)
  })

  const handleSave = async () => {
    if (!selectedSubject || !allFilled || anyInvalid) return
    setSaving(true)
    setSaveResult(null)
    try {
      const teacherId = localStorage.getItem('teacher_id') || '1'
      const entries = roster.map(s => ({
        student_id: s.student_id,
        marks_obtained: parseFloat(marks[s.student_id])
      }))
      await axios.post('http://localhost:8000/teacher/marks/enter', {
        teacher_id: parseInt(teacherId),
        subject_id: selectedSubject.subject_id,
        semester: selectedSubject.semester,
        exam_type: examType,
        entries
      })
      setSaveResult('success')
    } catch (err: any) {
      setSaveResult(err?.response?.data?.detail || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const classAverage = (() => {
    const vals = roster.map(s => parseFloat(marks[s.student_id])).filter(v => !isNaN(v))
    if (vals.length === 0) return null
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
  })()

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
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
      <TeacherSidebar />

      <main className="flex-1 min-w-0 px-4 pb-8 sm:px-8 lg:px-14 pt-16 lg:pt-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white">Enter Marks</h1>
          <p className="text-gray-400 text-sm mt-1">Select a class and exam, then enter each student's score.</p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
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
        </div>

        <div className="flex items-center gap-2 mb-6">
          {(['Internal 1', 'Internal 2', 'External'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setExamType(type)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-full transition-colors ${
                examType === type ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/3 text-gray-400 border border-white/6'
              }`}>
              {type} (out of {EXAM_TOTALS[type]})
            </button>
          ))}
        </div>

        {selectedSubject && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">{roster.length} students in Semester {selectedSubject.semester}</p>
              {classAverage && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Award size={13} className="text-purple-400" /> Class average so far: {classAverage}/{total}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {roster.map((student, i) => {
                const value = marks[student.student_id]
                const numVal = parseFloat(value)
                const isInvalid = value !== '' && (isNaN(numVal) || numVal < 0 || numVal > total)
                return (
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
                      <input
                        type="number"
                        min={0}
                        max={total}
                        value={value}
                        onChange={(e) => updateMark(student.student_id, e.target.value)}
                        placeholder="0"
                        className={`w-20 text-center bg-white/3 border rounded-lg px-2 py-1.5 text-sm text-white outline-none ${
                          isInvalid ? 'border-red-500/50' : 'border-white/8 focus:border-purple-500/50'
                        }`}
                      />
                      <span className="text-xs text-gray-500">/ {total}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={!allFilled || anyInvalid || saving}
                className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl text-white transition-opacity disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #14b8a6, #8B5CF6)' }}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Marks'}
              </button>
              {!allFilled && <p className="text-xs text-amber-400">Enter marks for every student.</p>}
              {anyInvalid && <p className="text-xs text-red-400">Some marks are out of range (0–{total}).</p>}
              {saveResult === 'success' && <p className="text-xs text-green-400">Saved! Students have been notified.</p>}
              {saveResult && saveResult !== 'success' && <p className="text-xs text-red-400">{saveResult}</p>}
            </div>
          </>
        )}
      </main>
    </div>
  )
}