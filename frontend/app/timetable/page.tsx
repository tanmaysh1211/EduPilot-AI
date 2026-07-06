'use client'
import { useState, useEffect, MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { Clock, MapPin, ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const subjectColors: Record<string, string> = {
  'Data Structures': '#a78bfa',
  'DBMS': '#22d3ee',
  'Operating Systems': '#c084fc',
  'Computer Networks': '#4ade80',
  'Web Technologies': '#fbbf24',
}

// Color spec: holiday = brown, event = dark blue, exam = green, has-classes dot = purple
const TYPE_COLORS = {
  holiday: { bg: 'rgba(120,72,32,0.35)', dot: '#a0633a', text: '#d9a878' },
  event: { bg: 'rgba(30,58,138,0.35)', dot: '#3b5bdb', text: '#8aa3e8' },
  exam: { bg: 'rgba(34,139,74,0.3)', dot: '#22c55e', text: '#6ee7a0' },
}

export default function TimetablePage() {
  const router = useRouter()
  const [timetable, setTimetable] = useState<any[]>([])
  const [holidays, setHolidays] = useState<any[]>([])
  const [semBounds, setSemBounds] = useState<{ start: string | null, end: string | null }>({ start: null, end: null })
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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
      const [ttRes, holRes, boundsRes] = await Promise.all([
        axios.get(`http://localhost:8000/timetable/3`),
        axios.get(`http://localhost:8000/calendar/holidays`),
        axios.get(`http://localhost:8000/calendar/semester-bounds/3`)
      ])
      setTimetable(ttRes.data.timetable || [])
      setHolidays(holRes.data.holidays || [])
      setSemBounds({ start: boundsRes.data.start, end: boundsRes.data.end })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toDateKey = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // Multiple entries can exist on the same date (e.g. 5 exam-day entries, one per subject — but
  // each is its own date in our seed, so this groups same-day entries defensively either way)
  const holidaysByDate: Record<string, any[]> = {}
  holidays.forEach((h) => {
    if (!holidaysByDate[h.date]) holidaysByDate[h.date] = []
    holidaysByDate[h.date].push(h)
  })

  const isWithinSemester = (d: Date) => {
    if (!semBounds.start || !semBounds.end) return true
    const key = toDateKey(d)
    return key >= semBounds.start && key <= semBounds.end
  }

  const classesForDate = (d: Date) => {
    const key = toDateKey(d)
    return timetable
      .filter((c: any) => c.date === key)
      .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startWeekday = firstOfMonth.getDay()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d))

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  const goNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const isToday = (d: Date) => toDateKey(d) === toDateKey(today)

  const selectedClasses = selectedDate ? classesForDate(selectedDate) : []
  const selectedEntries = selectedDate ? (holidaysByDate[toDateKey(selectedDate)] || []) : []

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-purple-900 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading timetable...</p>
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
        .cal-cell { transition: all 0.15s ease; cursor: pointer; }
        .cal-cell:hover:not(.cal-disabled) { background: rgba(255,255,255,0.06) !important; }
      `}</style>
      <Sidebar />

      <main className="flex-1 min-w-0 px-4 pb-8 sm:px-8 lg:px-14 pt-16 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6">
          <h1 className="text-2xl font-bold text-white">Timetable</h1>
          <p className="text-gray-400 text-sm mt-1">Your academic calendar — Semester 3.</p>
        </motion.div>

        <div className="flex items-center justify-between mb-5">
          <button onClick={goPrevMonth} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-white">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
          <button onClick={goNextMonth} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="soft-card bg-[#15151f] rounded-2xl p-4 sm:p-6 border border-white/6 shadow-sm mb-6">
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {DAY_NAMES_SHORT.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-gray-500 uppercase py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((d, idx) => {
              if (!d) return <div key={idx} />
              const key = toDateKey(d)
              const entries = holidaysByDate[key] || []
              const primaryEntry = entries[0]
              const inSem = isWithinSemester(d)
              const dayClasses = classesForDate(d)
              const hasClasses = inSem && entries.length === 0 && dayClasses.length > 0

              let cellBg = 'transparent'
              let cellBorder = 'transparent'
              if (primaryEntry) {
                cellBg = TYPE_COLORS[primaryEntry.type as keyof typeof TYPE_COLORS]?.bg || 'transparent'
              } else if (isToday(d)) {
                cellBg = 'rgba(255,255,255,0.05)'
                cellBorder = 'rgba(167,139,250,0.5)'
              }

              return (
                <div
                  key={idx}
                  onClick={() => inSem && setSelectedDate(d)}
                  className={`cal-cell rounded-xl p-2 min-h-[68px] flex flex-col items-center justify-start gap-1 ${!inSem ? 'cal-disabled opacity-30 cursor-not-allowed' : ''}`}
                  style={{ background: cellBg, border: `1px solid ${cellBorder}` }}>
                  <span className={`text-sm font-medium ${primaryEntry ? 'text-white' : isToday(d) ? 'text-purple-300' : 'text-gray-300'}`}>
                    {d.getDate()}
                  </span>
                  {primaryEntry && (
                    <span className="text-[8.5px] text-center leading-tight px-0.5 text-white/85">
                      {primaryEntry.label}{entries.length > 1 ? ` +${entries.length - 1}` : ''}
                    </span>
                  )}
                  {hasClasses && (
                    <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: '#a78bfa' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-5 flex-wrap text-xs text-gray-400 mb-2">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: TYPE_COLORS.holiday.dot }} /> Holiday</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: TYPE_COLORS.exam.dot }} /> Exam</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: TYPE_COLORS.event.dot }} /> Event</div>
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa' }} /> Has classes</div>
        </div>
      </main>

      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDate(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              // onClick={(e) => e.stopPropagation()}
              onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
              className="bg-[#13131a] border border-white/10 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">

              <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
                <div className="flex items-center gap-2.5">
                  <CalendarDays size={18} className="text-purple-400" />
                  <h2 className="text-base font-bold text-white">
                    {DAY_NAMES_FULL[selectedDate.getDay()]}, {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getDate()}
                  </h2>
                </div>
                <button onClick={() => setSelectedDate(null)} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5">
                {selectedEntries.map((entry: any, i: number) => {
                  const colors = TYPE_COLORS[entry.type as keyof typeof TYPE_COLORS]
                  return (
                    <div key={i} className="mb-3 px-4 py-3 rounded-xl" style={{ background: colors?.bg, border: `1px solid ${colors?.dot}40` }}>
                      <p className="text-sm font-semibold" style={{ color: colors?.text }}>{entry.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{entry.type}</p>
                    </div>
                  )
                })}

                {selectedClasses.length === 0 ? (
                  selectedEntries.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No classes scheduled.</p>
                ) : (
                  <div className="space-y-3 mt-1">
                    {selectedClasses.map((cls: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 bg-white/3 rounded-xl p-4 border border-white/6">
                        <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ background: subjectColors[cls.subject?.name || cls.subject] || '#a78bfa' }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white">{cls.subject?.name || cls.subject}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                            <span className="flex items-center gap-1"><Clock size={13} /> {cls.start_time} - {cls.end_time}</span>
                            <span className="flex items-center gap-1"><MapPin size={13} /> {cls.room}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}