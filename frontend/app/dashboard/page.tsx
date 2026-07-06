'use client'
import Sidebar from '@/components/Sidebar'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'
import { CalendarCheck, GraduationCap, TrendingUp, BookOpen, MessageCircle, AlertTriangle, Clock, ChevronDown } from 'lucide-react'
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'

export default function DashboardPage() {
  const router = useRouter()
  const [attendance, setAttendance] = useState<any[]>([])
  const [marks, setMarks] = useState<any[]>([])
  const [timetable, setTimetable] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [examType, setExamType] = useState<'Internal 1' | 'Internal 2' | 'External'>('Internal 2')
  const [semesterOpen, setSemesterOpen] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState('Sem 3')
  const availableSemesters = ['Sem 1', 'Sem 2', 'Sem 3']
  const CURRENT_SEMESTER = 3 // change this when the student progresses to a new sem
  const semesterNumber = parseInt(selectedSemester.replace('Sem ', ''))
  const isPastSemester = semesterNumber < CURRENT_SEMESTER

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchData(semesterNumber)
  }, [selectedSemester])

  const fetchData = async (semester: number) => {
    setLoading(true)
    try {
      const studentId = localStorage.getItem('student_id') || '1'
      const [attRes, marksRes] = await Promise.all([
        axios.get(`http://localhost:8000/attendance/${studentId}?semester=${semester}`),
        axios.get(`http://localhost:8000/marks/${studentId}?semester=${semester}`)
      ])
      setAttendance(attRes.data.attendance || [])
      setMarks(marksRes.data.marks || [])

      if (semester === CURRENT_SEMESTER) {
        const ttRes = await axios.get(`http://localhost:8000/timetable/${semester}`)
        setTimetable(ttRes.data.timetable || [])
      } else {
        setTimetable([])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  // Fixed: cumulative present/total, not an average of per-subject percentages
  const totalClasses = attendance.reduce((sum, a) => sum + (a.total ?? 0), 0)
  const totalPresent = attendance.reduce((sum, a) => sum + (a.present ?? 0), 0)
  const overallAttendance = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0

  const radialData = [{ name: 'Attendance', value: overallAttendance, fill: '#8B5CF6' }]

  const marksChartData = marks
    .filter((m: any) => m.exam_type === examType)
    .map((m: any) => ({ subject: m.subject.split(' ')[0], score: m.marks_obtained, total: m.total_marks }))

  // At-risk subjects: low attendance OR low latest exam score, whichever data exists
  const atRiskSubjects = attendance
    .filter((a: any) => a.percentage < 75)
    .map((a: any) => {
      const subjectMarks = marks.filter((m: any) => m.subject === a.subject)
      const latestExternal = subjectMarks.find((m: any) => m.exam_type === 'External')
      return {
        subject: a.subject,
        attendancePct: a.percentage,
        marksPct: latestExternal ? Math.round((latestExternal.marks_obtained / latestExternal.total_marks) * 100) : null,
      }
    })
    .sort((a, b) => a.attendancePct - b.attendancePct)
    .slice(0, 3)

  // Upcoming class: today's classes from timetable, find the next one after current time
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const now = new Date()
  const todayName = dayNames[now.getDay()]
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const todayClasses = timetable
    .filter((c: any) => c.day === todayName)
    .sort((a: any, b: any) => toMinutes(a.start_time) - toMinutes(b.start_time))

  const nextClass = todayClasses.find((c: any) => toMinutes(c.start_time) > nowMinutes)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F1419', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(139,92,246,0.3)', borderTop: '3px solid #8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: '14px', color: '#9CA3AF' }}>Loading your dashboard...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F1419' }} className="flex overflow-x-hidden">
      <style>{`
        .soft-card { transition: box-shadow 0.25s ease, border-color 0.25s ease; }
        .soft-card:hover {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 8px 28px rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.16) !important;
        }
        .sem-dropdown-item:hover { background: rgba(255,255,255,0.06); }
        .exam-tab { transition: all 0.2s ease; }
      `}</style>
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-hidden px-4 pb-28 sm:px-8 lg:px-14 pt-6 lg:pt-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between gap-4 mb-8 mt-14 lg:mt-0">
          <div className="min-w-0">
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'white' }} className="truncate">Good morning, Rohit 👋</h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>Here's what's happening with your academics today.</p>
          </div>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6, #F59E0B)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 600, fontSize: '14px', flexShrink: 0
          }}>RK</div>
        </motion.div>

        {/* Top cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="soft-card min-w-0"
            style={{ background: 'rgba(20,25,35,0.9)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarCheck size={20} color="#8B5CF6" />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: overallAttendance >= 75 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: overallAttendance >= 75 ? '#22c55e' : '#f59e0b' }}>
                {overallAttendance >= 75 ? 'Good' : 'Low'}
              </span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>{overallAttendance}%</p>
            <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px' }}>Overall Attendance</p>
            <div style={{ marginTop: '16px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${overallAttendance}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                style={{ height: '100%', borderRadius: '99px', background: overallAttendance >= 75 ? '#22c55e' : '#f59e0b' }} />
            </div>
          </motion.div>

          {/* Sem badge -> dropdown (UI only for now) */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="soft-card min-w-0"
            style={{ background: 'rgba(20,25,35,0.9)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.07)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={20} color="#14b8a6" />
              </div>

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setSemesterOpen(!semesterOpen)}
                  style={{
                    fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px',
                    background: 'rgba(20,184,166,0.15)', color: '#14b8a6', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                  {selectedSemester}
                  <ChevronDown size={12} />
                </button>
                {semesterOpen && (
                  <div style={{
                    position: 'absolute', top: '28px', right: 0, background: '#1a1f2e',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden',
                    zIndex: 20, minWidth: '90px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                  }}>
                    {availableSemesters.map((sem) => (
                      <div
                        key={sem}
                        className="sem-dropdown-item"
                        onClick={() => { setSelectedSemester(sem); setSemesterOpen(false) }}
                        style={{
                          padding: '8px 14px', fontSize: '12px', color: sem === selectedSemester ? '#14b8a6' : '#E5E7EB',
                          cursor: 'pointer'
                        }}>
                        {sem}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>{marks.length}</p>
            <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px' }}>Total Exam Records</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', color: '#14b8a6', fontSize: '14px', fontWeight: 500 }}>
              <TrendingUp size={14} />
              <span>{new Set(marks.map((m: any) => m.subject)).size} subjects tracked</span>
            </div>
          </motion.div>
        </div>

        {/* At-risk + Upcoming class row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="soft-card min-w-0"
            style={{ background: 'rgba(20,25,35,0.9)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <AlertTriangle size={16} color="#f59e0b" />
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>Subjects Needing Attention</p>
            </div>
            {atRiskSubjects.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#6B7280' }}>Nothing urgent — all subjects are on track. 🎉</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {atRiskSubjects.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#E5E7EB' }}>{s.subject}</span>
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                      {s.attendancePct}% attendance{s.marksPct !== null ? ` · ${s.marksPct}% marks` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="soft-card min-w-0"
            style={{ background: 'rgba(20,25,35,0.9)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Clock size={16} color="#8B5CF6" />
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'white', textDecoration: isPastSemester ? 'line-through' : 'none', opacity: isPastSemester ? 0.5 : 1 }}>Next Class</p>
            </div>
            {isPastSemester ? (
              <div>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#6B7280' }}>Completed</p>
                <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>{selectedSemester} has ended.</p>
              </div>
            ) : nextClass ? (
              <div>
                <p style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>{nextClass.subject}</p>
                <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>
                  {nextClass.start_time} – {nextClass.end_time} · {nextClass.room}
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#6B7280' }}>No more classes scheduled today.</p>
            )}
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="soft-card min-w-0"
            style={{ background: 'rgba(20,25,35,0.9)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'white', alignSelf: 'flex-start', marginBottom: '12px' }}>Attendance Health</p>
            <div style={{ width: '180px', height: '180px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '26px', fontWeight: 700, color: 'white' }}>{overallAttendance}%</span>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Overall</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="lg:col-span-2 soft-card min-w-0"
            style={{ background: 'rgba(20,25,35,0.9)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{examType} — Subject-wise Marks</p>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '3px' }}>
                {(['Internal 1', 'Internal 2', 'External'] as const).map((type) => (
                  <button
                    key={type}
                    className="exam-tab"
                    onClick={() => setExamType(type)}
                    style={{
                      fontSize: '11px', fontWeight: 600, padding: '5px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      background: examType === type ? '#8B5CF6' : 'transparent',
                      color: examType === type ? 'white' : '#9CA3AF'
                    }}>
                    {type === 'Internal 1' ? 'I1' : type === 'Internal 2' ? 'I2' : 'Ext'}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={marksChartData} margin={{ left: -8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={26} />
                <Tooltip
                  contentStyle={{ background: '#1a1f2e', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  trigger="hover"
                />
                <Bar dataKey="score" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Subject-wise Attendance */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="soft-card min-w-0"
          style={{ background: 'rgba(20,25,35,0.9)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '18px' }}>Subject-wise Attendance</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {attendance.map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={15} color="#6B7280" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#E5E7EB' }} className="truncate">{a.subject}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: a.percentage >= 75 ? '#22c55e' : '#f59e0b', flexShrink: 0 }}>{a.percentage}%</span>
                  </div>
                  <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${a.percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + i * 0.05 }}
                      style={{ height: '100%', borderRadius: '99px', background: a.percentage >= 75 ? '#22c55e' : '#f59e0b' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push('/chat')}
        style={{
          position: 'fixed', bottom: '20px', right: '20px',
          width: '50px', height: '50px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B5CF6, #F59E0B)',
          border: 'none', cursor: 'pointer', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
        }}>
        <MessageCircle size={22} color="white" />
      </motion.button>
    </div>
  )
}