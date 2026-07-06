'use client'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Bell, X, CheckCircle, GraduationCap, Clock, MessageCircle } from 'lucide-react'

const typeIcon: Record<string, any> = {
  attendance: CheckCircle,
  marks: GraduationCap,
  class_scheduled: Clock,
  notice: Bell,
  query_response: MessageCircle,
}

const typeColor: Record<string, string> = {
  attendance: '#22c55e',
  marks: '#a78bfa',
  class_scheduled: '#22d3ee',
  notice: '#fbbf24',
  query_response: '#14b8a6',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const studentId = localStorage.getItem('student_id')
      if (!studentId) return // teachers don't have notifications in this version
      const res = await axios.get(`http://localhost:8000/notifications/${studentId}`)
      setNotifications(res.data.notifications || [])
      setUnreadCount(res.data.unread_count || 0)
    } catch (err) {
      console.error(err)
    }
  }

  const markRead = async (id: number) => {
    try {
      await axios.post(`http://localhost:8000/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
    }
  }

  const markAllRead = async () => {
    try {
      const studentId = localStorage.getItem('student_id')
      await axios.post(`http://localhost:8000/notifications/${studentId}/read-all`)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-12 right-0 w-80 max-h-96 overflow-hidden flex flex-col bg-[#15151f] border border-white/10 rounded-2xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
            <p className="text-sm font-semibold text-white">Notifications</p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-purple-400 hover:text-purple-300">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">No notifications yet.</p>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcon[n.type] || Bell
                const color = typeColor[n.type] || '#9CA3AF'
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-white/3 cursor-pointer transition-colors hover:bg-white/2 ${
                      !n.is_read ? 'bg-white/[0.015]' : ''
                    }`}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${color}1a` }}>
                      <Icon size={13} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${!n.is_read ? 'text-gray-200' : 'text-gray-500'}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1">{n.created_at}</p>
                    </div>
                    {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0 mt-1.5" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}