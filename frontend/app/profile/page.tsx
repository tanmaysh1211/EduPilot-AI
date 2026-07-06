'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'
import { User, Mail, Hash, Building2, GraduationCap } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const studentId = localStorage.getItem('student_id') || '1'
      const res = await axios.get(`http://localhost:8000/profile/${studentId}`)
      setProfile(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const initials = profile?.name
    ? profile.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-purple-900 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  const fields = [
    { label: 'Email', value: profile?.email, icon: Mail },
    { label: 'Roll Number', value: profile?.roll_number, icon: Hash },
    { label: 'Department', value: profile?.department, icon: Building2 },
    { label: 'Semester', value: profile?.semester ? `Semester ${profile.semester}` : null, icon: GraduationCap },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex overflow-x-hidden">
      <style>{`
        .soft-card { transition: box-shadow 0.25s ease, border-color 0.25s ease; }
        .soft-card:hover {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 8px 28px rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.16) !important;
        }
      `}</style>
      <Sidebar />

      <main className="flex-1 min-w-0 px-4 pb-8 sm:px-8 lg:px-14 pt-16 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-gray-400 text-sm mt-1">Your account and academic information.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="soft-card bg-[#15151f] rounded-2xl p-6 border border-white/6 shadow-sm mb-6 flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #F59E0B)' }}>
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{profile?.name || 'Unknown'}</h2>
            <p className="text-sm text-gray-400 mt-1 capitalize">{profile?.role || 'Student'}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map((field, i) => (
            <motion.div
              key={field.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
              className="soft-card bg-[#15151f] rounded-2xl p-5 border border-white/6 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <field.icon size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{field.label}</p>
                <p className="text-sm font-medium text-white mt-0.5">{field.value || '—'}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}