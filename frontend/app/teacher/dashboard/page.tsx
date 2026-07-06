'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'
import { CalendarCheck, GraduationCap, CalendarPlus, Bell, BookOpen } from 'lucide-react'
import TeacherSidebar from '@/components/TeacherSidebar'

export default function TeacherDashboardPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const teacherId = localStorage.getItem('teacher_id') || '1'
      const res = await axios.get(`http://localhost:8000/teacher/${teacherId}/subjects`)
      setSubjects(res.data.subjects || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { label: 'Mark Attendance', icon: CalendarCheck, path: '/teacher/attendance', color: '#14b8a6' },
    { label: 'Enter Marks', icon: GraduationCap, path: '/teacher/marks', color: '#8B5CF6' },
    { label: 'Schedule Class', icon: CalendarPlus, path: '/teacher/timetable', color: '#f59e0b' },
    { label: 'Post Notice', icon: Bell, path: '/teacher/notices', color: '#22d3ee' },
  ]

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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-white">Welcome back 👋</h1>
          <p className="text-gray-400 text-sm mt-1">Here's what you're teaching this semester.</p>
        </motion.div>

        {/* My classes */}
        <p className="text-sm font-semibold text-white mb-3">My Classes</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {subjects.length === 0 ? (
            <p className="text-gray-500 text-sm">No subjects assigned yet.</p>
          ) : subjects.map((s, i) => (
            <motion.div
              key={`${s.subject_id}-${s.semester}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="soft-card bg-[#15151f] rounded-2xl p-5 border border-white/6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                  <BookOpen size={18} className="text-teal-400" />
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300">
                  {s.credits} credit{s.credits !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="font-semibold text-white">{s.subject_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Semester {s.semester}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <p className="text-sm font-semibold text-white mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              onClick={() => router.push(action.path)}
              className="soft-card bg-[#15151f] rounded-2xl p-5 border border-white/6 flex flex-col items-center gap-3 text-center hover:bg-white/2 transition-colors">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${action.color}1a` }}>
                <action.icon size={20} style={{ color: action.color }} />
              </div>
              <p className="text-xs font-medium text-white">{action.label}</p>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  )
}