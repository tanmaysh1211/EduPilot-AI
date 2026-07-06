// 'use client'
// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { motion } from 'framer-motion'
// import axios from 'axios'
// import { Calendar, Save } from 'lucide-react'
// import TeacherSidebar from '@/components/TeacherSidebar'

// export default function TeacherTimetablePage() {
//   const router = useRouter()
//   // const [subjects, setSubjects] = useState<any[]>([])
//   // const [selectedSubject, setSelectedSubject] = useState<any>(null)
//   // const [date, setDate] = useState('')
//   // const [startTime, setStartTime] = useState('09:00')
//   // const [endTime, setEndTime] = useState('10:00')
//   // const [room, setRoom] = useState('Room 101')
//   // const [loading, setLoading] = useState(true)
//   // const [saving, setSaving] = useState(false)
//   // const [result, setResult] = useState<any>(null)


//   const [timetable, setTimetable] = useState<any[]>([])
//   const [selectedDate, setSelectedDate] = useState<Date | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [updatingId, setUpdatingId] = useState<number | null>(null)

//   useEffect(() => {
//     const token = localStorage.getItem('token')
//     if (!token) { router.push('/login'); return }
//     // fetchSubjects()
//     fetchTimetable()
//   }, [])

//   // const fetchSubjects = async () => {
//   //   try {
//   //     const teacherId = localStorage.getItem('teacher_id') || '1'
//   //     const res = await axios.get(`http://localhost:8000/teacher/${teacherId}/subjects`)
//   //     setSubjects(res.data.subjects || [])
//   //     if (res.data.subjects?.length > 0) setSelectedSubject(res.data.subjects[0])
//   //   } catch (err) {
//   //     console.error(err)
//   //   } finally {
//   //     setLoading(false)
//   //   }
//   // }


//   const fetchTimetable = async () => {
//     try {
//         const teacherId = localStorage.getItem("teacher_id") || "1"
//         const semester = 3
//         const res = await axios.get(`http://localhost:8000/teacher/timetable/${teacherId}/${semester}`)
//         setTimetable(res.data.timetable)
//     }
//     finally {
//         setLoading(false)
//     }
//   } 

//   const handleSave = async () => {
//     if (!selectedSubject || !date) return
//     setSaving(true)
//     setResult(null)
//     try {
//       const teacherId = localStorage.getItem('teacher_id') || '1'
//       const res = await axios.post('http://localhost:8000/teacher/timetable/schedule', {
//         teacher_id: parseInt(teacherId),
//         subject_id: selectedSubject.subject_id,
//         semester: selectedSubject.semester,
//         date,
//         start_time: startTime,
//         end_time: endTime,
//         room
//       })
//       setResult({ type: 'success', data: res.data })
//     } catch (err: any) {
//       setResult({ type: 'error', message: err?.response?.data?.detail || 'Something went wrong.' })
//     } finally {
//       setSaving(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
//         <div className="w-10 h-10 border-3 border-teal-900 border-t-teal-500 rounded-full animate-spin"></div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-[#0a0a0f] flex overflow-x-hidden">
//       <style>{`
//         .soft-card { transition: box-shadow 0.25s ease, border-color 0.25s ease; }
//         .soft-card:hover { box-shadow: 0 0 0 1px rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.16) !important; }
//       `}</style>
//       <TeacherSidebar />

//       <main className="flex-1 min-w-0 px-4 pb-8 sm:px-8 lg:px-14 pt-16 lg:pt-8 max-w-2xl">
//         <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
//           <h1 className="text-2xl font-bold text-white">Schedule a Class</h1>
//           <p className="text-gray-400 text-sm mt-1">Add a new class session. Students will be notified automatically.</p>
//         </motion.div>

//         {/* <div className="flex flex-wrap items-center gap-3 mb-6">
//           {subjects.map((s) => (
//             <button
//               key={`${s.subject_id}-${s.semester}`}
//               onClick={() => { setSelectedSubject(s); setResult(null) }}
//               className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
//                 selectedSubject?.subject_id === s.subject_id && selectedSubject?.semester === s.semester
//                   ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
//                   : 'bg-white/3 text-gray-400 border border-white/6 hover:bg-white/5'
//               }`}>
//               {s.subject_name} — Sem {s.semester}
//             </button>
//           ))}
//         </div> */}

//         <div className="soft-card bg-[#15151f] rounded-2xl p-6 border border-white/6 space-y-5">
//           {/* <div>
//             <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Date</label>
//             <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
//               className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50" />
//             <p className="text-[11px] text-gray-600 mt-1.5">Pick a date marked as a teaching day on the calendar (not a holiday/exam day).</p>
//           </div> */}

//           <div className="grid grid-cols-2 gap-4">
//             {/* <div>
//               <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Start Time</label>
//               <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
//                 className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50" />
//             </div> */}
//             {/* <div>
//               <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">End Time</label>
//               <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
//                 className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50" />
//             </div> */}
//           </div>

//           {/* <div>
//             <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Room</label>
//             <select value={room} onChange={(e) => setRoom(e.target.value)}
//               className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50">
//               {['Room 101', 'Room 102', 'Lab 1', 'Room 201', 'Room 202'].map(r => <option key={r} value={r}>{r}</option>)}
//             </select>
//           </div> */}

//           {/* <button
//             onClick={handleSave}
//             disabled={!date || saving}
//             className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl text-white transition-opacity disabled:opacity-40"
//             style={{ background: 'linear-gradient(135deg, #14b8a6, #8B5CF6)' }}>
//             <Calendar size={16} />
//             {saving ? 'Scheduling...' : 'Schedule Class'}
//           </button> */}

//           {/* {result?.type === 'success' && (
//             <p className="text-xs text-green-400 text-center">
//               Scheduled! Progress: {result.data.total_scheduled}/{result.data.target} classes for this subject.
//             </p>
//           )}
//           {result?.type === 'error' && (
//             <p className="text-xs text-red-400 text-center">{result.message}</p>
//           )} */}
//         </div>
//       </main>
//     </div>
//   )
// }





























'use client'
import { useState, useEffect, MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { Clock, MapPin, ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react'
import TeacherSidebar from '@/components/TeacherSidebar'

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
  const [updatingId, setUpdatingId] = useState<number | null>(null)

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
        const teacherId = localStorage.getItem("teacher_id") || "1"
        const [ttRes, holRes, boundsRes] = await Promise.all([
            axios.get(`http://localhost:8000/teacher/timetable/${teacherId}/3`),
            axios.get("http://localhost:8000/calendar/holidays"),
            axios.get("http://localhost:8000/calendar/semester-bounds/3")
        ])
        setTimetable(ttRes.data.timetable || [])
        setHolidays(holRes.data.holidays || [])
        setSemBounds({
            start: boundsRes.data.start,
            end: boundsRes.data.end
        })
    } catch (err) {
        console.error(err)
    } finally {
        setLoading(false)
    }
}

  const updateStatus = async (
    timetableId: number,
    status: string
    ) => {
    try {
        setUpdatingId(timetableId)
        const teacherId = localStorage.getItem("teacher_id") || "1"
        await axios.patch( "http://localhost:8000/teacher/timetable/status",
            { teacher_id: Number(teacherId), timetable_id: timetableId, status })
        fetchData()
    }
    catch (err:any){ alert( err?.response?.data?.detail || "Unable to update" ) }
    finally{ setUpdatingId(null) }
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
      <TeacherSidebar />

      <main className="flex-1 min-w-0 px-4 pb-8 sm:px-8 lg:px-14 pt-16 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6">
          {/* <h1 className="text-2xl font-bold text-white">Timetable</h1> */}
          <h1 className="text-2xl font-bold text-white">
          Teaching Timetable
          </h1>
          <p className="text-gray-400 text-sm mt-1">Confirm whether your scheduled classes will be conducted.</p>
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
                        <div className="mt-2 mb-2">
                        { cls.status==="CLASS" && <span className="text-green-400 text-xs"> ✔ Class Confirmed </span> }
                        { cls.status==="NO_CLASS" && <span className="text-red-400 text-xs"> ✖ No Class </span> }
                        { cls.status==="PENDING" && <span className="text-yellow-400 text-xs"> ⏳ Awaiting Confirmation </span> }
                        </div>
                        { cls.editable && (
                        <div className="flex flex-col gap-2">
                        <button disabled={updatingId===cls.id}
                        onClick={()=> updateStatus(cls.id,"CLASS")}className={`px-3 py-2 rounded-lg text-xs font-medium
                        ${cls.status==="CLASS" ? "bg-green-600 text-white" : "bg-white/10 text-gray-300" }`}>
                        CLASS
                        </button>
                        <button disabled={updatingId===cls.id}
                        onClick={()=> updateStatus(cls.id,"NO_CLASS")} className={`px-3 py-2 rounded-lg text-xs font-medium
                        ${ cls.status==="NO_CLASS" ? "bg-red-600 text-white" : "bg-white/10 text-gray-300" }`}>
                        NO CLASS
                        </button>
                        </div>
                        )}
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



