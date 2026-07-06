'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarCheck, GraduationCap, Clock,
  Bell, MessageSquareWarning, LogOut, PanelLeft, X
} from 'lucide-react'

export default function TeacherSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    localStorage.clear()
    router.push('/login')
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher/dashboard' },
    { icon: CalendarCheck, label: 'Mark Attendance', path: '/teacher/attendance' },
    { icon: GraduationCap, label: 'Enter Marks', path: '/teacher/marks' },
    { icon: Clock, label: 'Schedule Class', path: '/teacher/timetable' },
    { icon: Bell, label: 'Post Notice', path: '/teacher/notices' },
    { icon: MessageSquareWarning, label: 'Disputes', path: '/teacher/disputes' },
  ]

  const handleNav = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  return (
    <>
      <style>{`
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(20,184,166,0.5), 0 0 40px rgba(139,92,246,0.2); }
          50% { box-shadow: 0 0 30px rgba(20,184,166,0.8), 0 0 60px rgba(139,92,246,0.4); }
        }
        .bulb-glow-teacher { animation: glowPulse 2s ease-in-out infinite; }
      `}</style>

      <div style={{ width: '64px', flexShrink: 0 }} className="hidden lg:block" />

      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-5 z-40"
        style={{ background: '#0f1117', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => setOpen(true)}
          className="p-2.5 rounded-xl text-gray-400 hover:text-white transition-colors -ml-1"
          aria-label="Open menu">
          <PanelLeft size={22} />
        </button>
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-white text-[15px] whitespace-nowrap">EduPilot AI</span>
          <div className="bulb-glow-teacher" style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #14b8a6 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
          }}>👩‍🏫</div>
        </div>
      </div>

      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-16 bg-[#0f1117] flex-col items-center py-6 z-40">
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/6 transition-colors mb-6"
          aria-label="Expand menu">
          <PanelLeft size={20} />
        </button>

        <div className="bulb-glow-teacher mb-6" style={{
          width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
          background: 'linear-gradient(135deg, #14b8a6 0%, #8B5CF6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
        }}>👩‍🏫</div>

        <nav className="flex-1 flex flex-col items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.path)}
                title={item.label}
                className={`
                  w-11 h-11 rounded-xl flex items-center justify-center
                  transition-all duration-200
                  ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/6 hover:text-white'}
                `}>
                <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              </button>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          title="Logout"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200">
          <LogOut size={20} strokeWidth={1.8} />
        </button>
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full bg-[#0f1117]
          flex flex-col z-50
          w-[85%] max-w-[300px]
          lg:w-[280px]
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}>

        <div className="flex items-center justify-between px-5 pt-7 pb-7">
          <div className="flex items-center gap-3">
            <div className="bulb-glow-teacher" style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #14b8a6 0%, #8B5CF6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', flexShrink: 0
            }}>👩‍🏫</div>
            <span className="text-[16px] font-extrabold text-white tracking-tight leading-none whitespace-nowrap">
              EduPilot AI
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="px-5 text-[11px] text-gray-500 uppercase tracking-wide mb-3">Teacher Portal</p>

        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.path)}
                className={`
                  w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl
                  text-[15px] font-medium
                  transition-all duration-200 min-h-[48px]
                  ${isActive ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:bg-white/6 hover:text-white'}
                `}>
                <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} className="flex-shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-5 border-t border-white/6 mx-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-medium min-h-[48px] text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 -mx-4">
            <LogOut size={20} strokeWidth={1.8} className="flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}