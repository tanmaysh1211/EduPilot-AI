'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Bell, Calendar, GraduationCap, PartyPopper } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

const categoryStyle: Record<string, { icon: any; color: string; bg: string }> = {
  Exam: { icon: GraduationCap, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  Holiday: { icon: PartyPopper, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  Academic: { icon: Calendar, color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
}

export default function NoticesPage() {
  const router = useRouter()
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

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
      const res = await axios.get('http://localhost:8000/notices/')
      setNotices(res.data.notices || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const categories = Array.from(new Set(notices.map((n: any) => n.category)))
  const filteredNotices = filter ? notices.filter((n: any) => n.category === filter) : notices

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-purple-900 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading notices...</p>
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
      `}</style>
      <Sidebar />

      <main className="flex-1 min-w-0 px-4 pb-8 sm:px-8 lg:px-14 pt-16 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6">
          <h1 className="text-2xl font-bold text-white">Notices</h1>
          <p className="text-gray-400 text-sm mt-1">Announcements and updates from the college.</p>
        </motion.div>

        {/* Category filter pills */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter(null)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filter === null ? 'bg-white/10 text-white' : 'bg-white/3 text-gray-400 hover:bg-white/5'
            }`}>
            All
          </button>
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                filter === cat ? 'bg-white/10 text-white' : 'bg-white/3 text-gray-400 hover:bg-white/5'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredNotices.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-12">No notices to show.</p>
          ) : filteredNotices.map((notice: any, i: number) => {
            const style = categoryStyle[notice.category] || { icon: Bell, color: '#9CA3AF', bg: 'rgba(255,255,255,0.05)' }
            const Icon = style.icon
            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="soft-card bg-[#15151f] rounded-2xl p-6 border border-white/6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: style.bg }}>
                    <Icon size={18} style={{ color: style.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <h3 className="font-semibold text-white">{notice.title}</h3>
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: style.bg, color: style.color }}>
                        {notice.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{notice.content}</p>
                    {notice.created_at && (
                      <p className="text-xs text-gray-600 mt-2">{notice.created_at}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </main>
    </div>
  )
}