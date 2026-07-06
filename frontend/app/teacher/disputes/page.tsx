'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'
import { MessageSquareWarning, CheckCircle } from 'lucide-react'
import TeacherSidebar from '@/components/TeacherSidebar'

export default function TeacherDisputesPage() {
  const router = useRouter()
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [responses, setResponses] = useState<Record<number, string>>({})
  const [corrections, setCorrections] = useState<Record<number, string>>({})
  const [resolving, setResolving] = useState<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetchDisputes()
  }, [])

  const fetchDisputes = async () => {
    try {
      const teacherId = localStorage.getItem('teacher_id') || '1'
      const res = await axios.get(`http://localhost:8000/disputes/teacher/${teacherId}?status=open`)
      setDisputes(res.data.disputes || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (disputeId: number, applyCorrection: boolean) => {
    const dispute = disputes.find(d => d.id === disputeId)
    if (!dispute || !responses[disputeId]?.trim()) return
    setResolving(disputeId)
    try {
      let correctedValue = null
      if (applyCorrection && corrections[disputeId]) {
        if (dispute.type === 'attendance') {
          correctedValue = { is_present: corrections[disputeId] === 'present' }
        } else {
          correctedValue = { marks_obtained: parseFloat(corrections[disputeId]) }
        }
      }
      await axios.post(`http://localhost:8000/disputes/${disputeId}/resolve`, {
        teacher_response: responses[disputeId],
        corrected_value: correctedValue
      })
      setDisputes(prev => prev.filter(d => d.id !== disputeId))
    } catch (err) {
      console.error(err)
    } finally {
      setResolving(null)
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
      <style>{`.soft-card { transition: box-shadow 0.25s ease; } .soft-card:hover { box-shadow: 0 0 0 1px rgba(255,255,255,0.08); }`}</style>
      <TeacherSidebar />
      <main className="flex-1 min-w-0 px-4 pb-8 sm:px-8 lg:px-14 pt-16 lg:pt-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white">Disputes</h1>
          <p className="text-gray-400 text-sm mt-1">Student queries about attendance or marks.</p>
        </motion.div>

        {disputes.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">No open disputes. 🎉</p>
        ) : (
          <div className="space-y-4">
            {disputes.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="soft-card bg-[#15151f] rounded-2xl p-6 border border-amber-500/15">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquareWarning size={16} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{d.student_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{d.type} dispute · {d.created_at}</p>
                  </div>
                </div>

                {d.related_detail && (
                  <div className="bg-white/3 rounded-xl p-3 mb-3 text-xs text-gray-400">
                    {d.type === 'attendance'
                      ? `Currently marked: ${d.related_detail.is_present ? 'Present' : 'Absent'} on ${d.related_detail.date}`
                      : `Currently entered: ${d.related_detail.marks_obtained}/${d.related_detail.total_marks} (${d.related_detail.exam_type})`}
                  </div>
                )}

                <p className="text-sm text-gray-300 mb-4">"{d.student_message}"</p>

                <div className="space-y-2">
                  <textarea
                    placeholder="Your response..."
                    value={responses[d.id] || ''}
                    onChange={(e) => setResponses(prev => ({ ...prev, [d.id]: e.target.value }))}
                    rows={2}
                    className="w-full bg-white/3 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none focus:border-purple-500/50"
                  />
                  {d.type === 'attendance' ? (
                    <select
                      value={corrections[d.id] || ''}
                      onChange={(e) => setCorrections(prev => ({ ...prev, [d.id]: e.target.value }))}
                      className="w-full bg-white/3 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none">
                      <option value="">No correction needed</option>
                      <option value="present">Correct to: Present</option>
                      <option value="absent">Correct to: Absent</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      placeholder="Corrected marks (leave blank if no change)"
                      value={corrections[d.id] || ''}
                      onChange={(e) => setCorrections(prev => ({ ...prev, [d.id]: e.target.value }))}
                      className="w-full bg-white/3 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  )}
                  <button
                    onClick={() => handleResolve(d.id, !!corrections[d.id])}
                    disabled={!responses[d.id]?.trim() || resolving === d.id}
                    className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl text-white disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #14b8a6, #8B5CF6)' }}>
                    <CheckCircle size={14} /> {resolving === d.id ? 'Resolving...' : 'Resolve'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}