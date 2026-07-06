'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'
import { GraduationCap, Award, ChevronDown, TrendingUp } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from 'recharts'

const EXAM_ORDER = ['Internal 1', 'Internal 2', 'External']

export default function MarksPage() {
  const router = useRouter()
  const [marks, setMarks] = useState<any[]>([])
  const [classAverages, setClassAverages] = useState<any[]>([])
  const [gpaData, setGpaData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [semesterOpen, setSemesterOpen] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState(3)
  const availableSemesters = [1, 2, 3]

  const [disputeModalOpen, setDisputeModalOpen] = useState(false)
  const [disputeTarget, setDisputeTarget] = useState<any>(null)
  const [disputeMessage, setDisputeMessage] = useState('')
  const [disputeSending, setDisputeSending] = useState(false)
  const [disputeSent, setDisputeSent] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchData(selectedSemester)
    fetchGpa()
  }, [selectedSemester])

  const fetchData = async (semester: number) => {
    setLoading(true)
    try {
      const studentId = localStorage.getItem('student_id') || '1'
      const [marksRes, avgRes] = await Promise.all([
        axios.get(`http://localhost:8000/marks/${studentId}?semester=${semester}`),
        axios.get(`http://localhost:8000/marks/${studentId}/class-average?semester=${semester}`)
      ])
      setMarks(marksRes.data.marks || [])
      setClassAverages(avgRes.data.averages || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchGpa = async () => {
    try {
      const studentId = localStorage.getItem('student_id') || '1'
      const res = await axios.get(`http://localhost:8000/marks/${studentId}/gpa`)
      setGpaData(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const openMarksDispute = (subjectId: number, exam: any) => {
  setDisputeTarget({
    id: exam.id,
    subject_id: subjectId,
    exam_type: exam.exam_type,
    marks_obtained: exam.marks_obtained,
    total_marks: exam.total_marks
  })

  setDisputeMessage('')
  setDisputeSent(false)
  setDisputeModalOpen(true)
}

const submitMarksDispute = async () => {
  if (!disputeMessage.trim() || !disputeTarget) return

  setDisputeSending(true)

  try {
    const studentId = localStorage.getItem('student_id') || '1'

    await axios.post('http://localhost:8000/disputes/', {
      student_id: parseInt(studentId),
      subject_id: disputeTarget.subject_id,
      type: 'marks',
      related_id: disputeTarget.id,
      student_message: disputeMessage
    })

    setDisputeSent(true)
  } catch (err) {
    console.error(err)
  } finally {
    setDisputeSending(false)
  }
}

  const getClassAvg = (subjectId: number, examType: string) => {
    const found = classAverages.find((a: any) => a.subject_id === subjectId && a.exam_type === examType)
    return found ? found.class_average : null
  }

  // Group marks by subject
  const grouped: Record<string, any[]> = {}
  marks.forEach((m: any) => {
    if (!grouped[m.subject]) grouped[m.subject] = []
    grouped[m.subject].push(m)
  })

  const sgpaThisSem = gpaData?.sgpa_by_semester?.[selectedSemester]
  const cgpa = gpaData?.cgpa

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-purple-900 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading marks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex overflow-x-hidden">
      <style>{`
        .soft-card { transition: box-shadow 0.25s ease, border-color 0.25s ease; }
        .soft-card:hover {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 8px 28px rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.16) !important;
        }
        .sem-dropdown-item:hover { background: rgba(255,255,255,0.06); }
        .avg-marker { position: relative; }
        .avg-marker:hover .avg-tooltip { opacity: 1; transform: translateY(0); }
        .avg-tooltip {
          position: absolute; bottom: 14px; left: 50%; transform: translate(-50%, 4px);
          background: #1a1f2e; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;
          padding: 6px 10px; font-size: 11px; white-space: nowrap; opacity: 0; pointer-events: none;
          transition: all 0.15s ease; z-index: 10; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }
      `}</style>
      <Sidebar />

      <main className="flex-1 min-w-0 px-4 pb-8 sm:px-8 lg:px-14 pt-16 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Marks</h1>
            <p className="text-gray-400 text-sm mt-1">Your exam performance, subject by subject.</p>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setSemesterOpen(!semesterOpen)}
              className="flex items-center gap-2 text-sm font-medium text-gray-200 bg-[#15151f] border border-white/10 rounded-xl px-4 py-2 hover:bg-white/5 transition-colors">
              Semester {selectedSemester}
              <ChevronDown size={14} />
            </button>
            {semesterOpen && (
              <div style={{
                position: 'absolute', top: '42px', right: 0, background: '#15151f',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden',
                zIndex: 20, minWidth: '130px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
              }}>
                {availableSemesters.map((sem) => (
                  <div
                    key={sem}
                    className="sem-dropdown-item"
                    onClick={() => { setSelectedSemester(sem); setSemesterOpen(false) }}
                    style={{
                      padding: '10px 16px', fontSize: '13px',
                      color: sem === selectedSemester ? '#a78bfa' : '#E5E7EB',
                      cursor: 'pointer'
                    }}>
                    Semester {sem}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* GPA / CGPA card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="soft-card bg-[#15151f] rounded-2xl p-6 border border-white/6 shadow-sm mb-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">SGPA — Semester {selectedSemester}</p>
            <p className="text-3xl font-bold text-white">{sgpaThisSem ?? '—'}</p>
          </div>
          <div className="border-l border-white/6 pl-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">CGPA (Overall)</p>
            <p className="text-3xl font-bold text-purple-400">{cgpa ?? '—'}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Object.entries(grouped).map(([subject, exams], i) => {
            const externalExam = exams.find((e: any) => e.exam_type === 'External')
            const subjectId = exams[0]?.subject_id

            // Build trend data in fixed exam order, using PERCENTAGE so Internal (out of 30)
            // and External (out of 100) are actually comparable on one axis
            const trendData = EXAM_ORDER.map((examType) => {
              const exam = exams.find((e: any) => e.exam_type === examType)
              return {
                exam: examType === 'Internal 1' ? 'I1' : examType === 'Internal 2' ? 'I2' : 'Ext',
                pct: exam ? exam.percentage : null,
                obtained: exam ? exam.marks_obtained : null,
                total: exam ? exam.total_marks : null,
              }
            }).filter((d) => d.pct !== null)

            return (
              <motion.div
                key={subject}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="soft-card bg-[#15151f] rounded-2xl p-6 border border-white/6 shadow-sm">

                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <GraduationCap size={18} className="text-purple-400" />
                    </div>
                    <p className="font-semibold text-white">{subject}</p>
                  </div>
                  {externalExam && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      externalExam.percentage >= 75 ? 'bg-green-500/10 text-green-400' :
                      externalExam.percentage >= 40 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      <Award size={12} />
                      {externalExam.percentage}%
                    </span>
                  )}
                </div>

                {/* Trend line across I1 -> I2 -> External */}
                {trendData.length > 1 && (
                  <div className="mb-5 -mx-2">
                    <div className="flex items-center gap-1.5 mb-2 px-2">
                      <TrendingUp size={12} className="text-gray-500" />
                      <span className="text-[11px] text-gray-500 uppercase tracking-wide">Trend</span>
                    </div>
                    <ResponsiveContainer width="100%" height={90}>
                      <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <XAxis dataKey="exam" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: 'white', fontSize: '11px' }}
                          formatter={(value: any, name: any, props: any) => [`${props.payload.obtained}/${props.payload.total} (${value}%)`, 'Score']}
                        />
                        <Line type="monotone" dataKey="pct" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: '#a78bfa' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="space-y-4">
                  {exams.map((exam: any, j: number) => {
                    const classAvg = getClassAvg(subjectId, exam.exam_type)
                    const avgPct = classAvg !== null ? (classAvg / exam.total_marks) * 100 : null
                    const isFullMarks = exam.marks_obtained === exam.total_marks
                    const isAboveAvg = avgPct !== null && exam.percentage >= avgPct
                    const barColor = isFullMarks
                      ? 'linear-gradient(90deg, #facc15, #fde047)'
                      : isAboveAvg
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                      : 'linear-gradient(90deg, #ef4444, #f87171)'

                    let hoverMsg = ''
                    if (isFullMarks) hoverMsg = 'Bravo! Full marks 🎉'
                    else if (isAboveAvg) hoverMsg = 'Above class average'
                    else if (avgPct !== null) hoverMsg = 'Below average'

                    return (
                      <div key={j}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-gray-400">{exam.exam_type}</span>
                          <div className="flex items-center gap-3">
                          <button
                            onClick={() => openMarksDispute(subjectId, exam)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                          >
                            Raise Query
                          </button>
                          <span className="text-sm font-semibold text-white">
                            {exam.marks_obtained} / {exam.total_marks}
                          </span>
                          </div>
                        </div>
                        <div className="h-3 bg-white/6 rounded-full relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${exam.percentage}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + i * 0.08 + j * 0.05 }}
                            className="h-full rounded-full avg-marker overflow-hidden"
                            style={{ background: barColor }}>
                            {hoverMsg && (
                              <div className="avg-tooltip" style={{ left: '100%' }}>{hoverMsg}</div>
                            )}
                          </motion.div>
                          {/* Class average marker — thick brown bar */}
                          {avgPct !== null && (
                            <div
                              title={`Class avg: ${classAvg}/${exam.total_marks}`}
                              style={{
                                position: 'absolute', top: '-3px', bottom: '-3px', left: `${Math.min(avgPct, 100)}%`,
                                width: '4px', background: '#92400e', borderRadius: '2px',
                                boxShadow: '0 0 0 1px rgba(0,0,0,0.3)'
                              }}
                            />
                          )}
                        </div>
                        {classAvg !== null && (
                          <p className="text-[11px] text-gray-500 mt-1">Class avg: {classAvg}/{exam.total_marks}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
           </main>

      {disputeModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setDisputeModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#13131a] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white mb-1">
              Raise a Query
            </h3>

            <p className="text-xs text-gray-500 mb-4">
              {disputeTarget?.exam_type}
            </p>

            {disputeSent ? (
              <p className="text-sm text-green-400">
                Query sent! Your teacher will review it.
              </p>
            ) : (
              <>
                <textarea
                  value={disputeMessage}
                  onChange={(e) => setDisputeMessage(e.target.value)}
                  placeholder="Explain why these marks should be reviewed..."
                  rows={3}
                  className="w-full bg-white/3 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none focus:border-amber-500/50 mb-3"
                />

                <button
                  onClick={submitMarksDispute}
                  disabled={!disputeMessage.trim() || disputeSending}
                  className="w-full text-sm font-semibold py-2.5 rounded-xl text-white disabled:opacity-40"
                  style={{
                    background:
                      "linear-gradient(135deg,#f59e0b,#d97706)"
                  }}
                >
                  {disputeSending ? "Sending..." : "Send Query"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}