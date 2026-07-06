'use client'
// import { useState, useEffect } from 'react'
import { useState, useEffect, MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { BookOpen, CheckCircle, AlertTriangle, X, ChevronDown } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

export default function AttendancePage() {
  const router = useRouter()
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [semesterOpen, setSemesterOpen] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState(3)
  const availableSemesters = [1, 2, 3]

  const [disputeModalOpen, setDisputeModalOpen] = useState(false)
  const [disputeTarget, setDisputeTarget] = useState<any>(null)
  const [disputeMessage, setDisputeMessage] = useState('')
  const [disputeSending, setDisputeSending] = useState(false)
  const [disputeSent, setDisputeSent] = useState(false)

  // Daily modal state
  const [dailyOpen, setDailyOpen] = useState(false)
  const [dailyLoading, setDailyLoading] = useState(false)
  const [dailyData, setDailyData] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchData(selectedSemester)
  }, [selectedSemester])

  const fetchData = async (semester: number) => {
    setLoading(true)
    try {
      const studentId = localStorage.getItem('student_id') || '1'
      const res = await axios.get(`http://localhost:8000/attendance/${studentId}?semester=${semester}`)
      setAttendance(res.data.attendance || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openDaily = async (subjectId: number) => {
    setDailyOpen(true)
    setDailyLoading(true)
    setDailyData(null)
    try {
      const studentId = localStorage.getItem('student_id') || '1'
      const res = await axios.get(`http://localhost:8000/attendance/${studentId}/daily/${subjectId}`)
      setDailyData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setDailyLoading(false)
    }
  }

   const openDispute = (row: any) => {
    setDisputeTarget({ ...row, subject_id: dailyData.subject_id })
    setDisputeMessage('')
    setDisputeSent(false)
    setDisputeModalOpen(true)
  }
 
  const submitDispute = async () => {
    if (!disputeMessage.trim() || !disputeTarget) return
    setDisputeSending(true)
    try {
      const studentId = localStorage.getItem('student_id') || '1'
      await axios.post('http://localhost:8000/disputes/', {
        student_id: parseInt(studentId),
        subject_id: disputeTarget.subject_id,
        type: 'attendance',
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

  // Cumulative present/total, not an average of per-subject percentages
  const totalClasses = attendance.reduce((sum, a) => sum + (a.total ?? 0), 0)
  const totalPresent = attendance.reduce((sum, a) => sum + (a.present ?? 0), 0)
  const overallAttendance = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-purple-900 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading attendance...</p>
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
        .daily-row:nth-child(odd) { background: rgba(255,255,255,0.02); }
      `}</style>
      <Sidebar />

      <main className="flex-1 min-w-0 px-4 pb-8 sm:px-8 lg:px-14 pt-16 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Attendance</h1>
            <p className="text-gray-400 text-sm mt-1">Subject-wise breakdown of your attendance record.</p>
          </div>

          {/* Semester selector */}
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

        {/* Overall Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="soft-card bg-[#15151f] rounded-2xl p-6 border border-white/6 shadow-sm mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Overall Attendance</p>
            <p className="text-4xl font-bold text-white">{overallAttendance}%</p>
            <p className={`text-sm font-medium mt-1 flex items-center gap-1 ${
              overallAttendance >= 75 ? 'text-green-400' : 'text-amber-400'
            }`}>
              {overallAttendance >= 75 ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              {overallAttendance >= 75 ? 'You are on track!' : 'Attendance below 75%'}
            </p>
          </div>
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: overallAttendance >= 75
              ? 'linear-gradient(135deg, #22c55e, #4ade80)'
              : 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
            {overallAttendance}%
          </div>
        </motion.div>

        {/* Subject Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {attendance.length === 0 ? (
            <p className="text-gray-500 text-sm col-span-2">No attendance records for this semester.</p>
          ) : attendance.map((a: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
              className="soft-card bg-[#15151f] rounded-2xl p-6 border border-white/6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <BookOpen size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{a.subject}</p>
                    <p className="text-xs text-gray-500">{a.present} / {a.total} classes attended</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    a.status === 'Safe' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {a.status === 'Safe' ? 'Safe' : 'Low'}
                  </span>
                  <button
                    onClick={() => openDaily(a.subject_id)}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                    Daily
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-white">{a.percentage}%</span>
              </div>

              <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${a.percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.07 }}
                  className="h-full rounded-full"
                  style={{ background: a.percentage >= 75
                    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                    : 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Daily Attendance Modal */}
      <AnimatePresence>
        {dailyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDailyOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              // onClick={(e) => e.stopPropagation()}
              onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
              className="bg-[#13131a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">

              <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Attendance Report {dailyData?.subject_code ? `— ${dailyData.subject_code}` : ''}
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">{dailyData?.subject_name}</p>
                </div>
                <button onClick={() => setDailyOpen(false)} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {dailyLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-purple-900 border-t-purple-500 rounded-full animate-spin"></div>
                  </div>
                ) : dailyData && dailyData.daily.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 text-xs uppercase border-b border-white/6">
                        <th className="px-6 py-3 font-medium">Course Code</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium text-right">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyData.daily.map((row: any, i: number) => (
                        <tr key={i} className="daily-row border-b border-white/3">
                          <td className="px-6 py-3 text-gray-400">{dailyData.subject_code}</td>
                          <td className="px-6 py-3 text-gray-200">{row.date}</td>
                          <td className="px-6 py-3 text-right">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              row.status === 'Present'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => openDispute(row)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-medium">
                            Raise Query
                          </button>
                        </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-16">No daily records found.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {disputeModalOpen && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={() => setDisputeModalOpen(false)}>
      <div onClick={(e) => e.stopPropagation()}
        className="bg-[#13131a] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="text-base font-bold text-white mb-1">Raise a Query</h3>
        <p className="text-xs text-gray-500 mb-4">
          {disputeTarget?.date} — currently marked {disputeTarget?.status}
        </p>
        {disputeSent ? (
          <p className="text-sm text-green-400">Query sent! Your teacher will review it.</p>
        ) : (
          <>
            <textarea
              value={disputeMessage}
              onChange={(e) => setDisputeMessage(e.target.value)}
              placeholder="e.g. I was present that day, please correct this"
              rows={3}
              className="w-full bg-white/3 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none focus:border-amber-500/50 mb-3"
            />
            <button
              onClick={submitDispute}
              disabled={!disputeMessage.trim() || disputeSending}
              className="w-full text-sm font-semibold py-2.5 rounded-xl text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              {disputeSending ? 'Sending...' : 'Send Query'}
            </button>
          </>
        )}
      </div>
    </div>
  )}
    </div>
  )
}