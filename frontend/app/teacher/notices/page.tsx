'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Send } from 'lucide-react'
import TeacherSidebar from '@/components/TeacherSidebar'

export default function TeacherNoticesPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Academic')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) router.push('/login')
  }, [])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    setResult(null)
    try {
      await axios.post('http://localhost:8000/notices/', { title, content, category })
      setResult('success')
      setTitle('')
      setContent('')
    } catch (err) {
      setResult('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex overflow-x-hidden">
      <style>{`.soft-card { transition: box-shadow 0.25s ease; } .soft-card:hover { box-shadow: 0 0 0 1px rgba(255,255,255,0.08); }`}</style>
      <TeacherSidebar />
      <main className="flex-1 min-w-0 px-4 pb-8 sm:px-8 lg:px-14 pt-16 lg:pt-8 max-w-xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white">Post a Notice</h1>
          <p className="text-gray-400 text-sm mt-1">Visible to all students immediately.</p>
        </motion.div>

        <div className="soft-card bg-[#15151f] rounded-2xl p-6 border border-white/6 space-y-5">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Internal 2 Exam Schedule"
              className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50" />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50">
              {['Academic', 'Exam', 'Holiday'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Notice details..."
              className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 resize-none" />
          </div>
          <button onClick={handleSave} disabled={!title.trim() || !content.trim() || saving}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #8B5CF6)' }}>
            <Send size={16} /> {saving ? 'Posting...' : 'Post Notice'}
          </button>
          {result === 'success' && <p className="text-xs text-green-400 text-center">Notice posted!</p>}
          {result === 'error' && <p className="text-xs text-red-400 text-center">Something went wrong.</p>}
        </div>
      </main>
    </div>
  )
}