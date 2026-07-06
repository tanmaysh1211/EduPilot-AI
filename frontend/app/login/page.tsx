'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoMessage, setDemoMessage] = useState('')

  const [loginMode, setLoginMode] = useState<'student' | 'teacher'>('student')

  // const doLogin = async (loginEmail: string, loginPassword: string) => {
  //   setError('')
  //   try {
  //     const res = await axios.post('http://localhost:8000/auth/login', {
  //       email: loginEmail.trim().toLowerCase(),
  //       password: loginPassword.trim()
  //     })
  //     localStorage.setItem('token', res.data.access_token)
  //     localStorage.setItem('student_id', '1')
  //     router.push('/dashboard')
  //   } catch {
  //     setError('Invalid email or password. Please try again.')
  //   }
  // }




  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setError('')
    // try {
    //   const res = await axios.post('http://localhost:8000/auth/login', {
    //     email: loginEmail.trim().toLowerCase(),
    //     password: loginPassword.trim()
    //   })
    //   localStorage.setItem('token', res.data.access_token)
 
    //   const role = res.data.role  // requires backend to include this — see note below
 
    //   if (role === 'teacher') {
    //     localStorage.setItem('teacher_id', res.data.user_id)  // requires backend to include this too
    //     router.push('/teacher/dashboard')
    //   } else {
    //     localStorage.setItem('student_id', res.data.student_id || '1')  // ideally backend resolves this
    //     router.push('/dashboard')
    //   }
    // } catch {
    //   setError('Invalid email or password. Please try again.')
    // }

    try {
  console.log("Sending request...")

  const res = await axios.post(
    "http://127.0.0.1:8000/auth/login",
    {
      email: loginEmail.trim().toLowerCase(),
      password: loginPassword.trim(),
    }
  )

  console.log("SUCCESS")
  console.log(res)
  console.log(res.data)

  localStorage.setItem("token", res.data.access_token)

  const role = res.data.role

  console.log("ROLE =", role)

  if (role === "teacher") {
    localStorage.setItem("teacher_id", String(res.data.user_id))
    router.push("/teacher/dashboard")
  } else {
    localStorage.setItem(
      "student_id",
      String(res.data.student_id || "1")
    )
    router.push("/dashboard")
  }

} catch (err: any) {
  console.log("LOGIN FAILED")
  console.log(err)
  console.log(err.response)
  console.log(err.response?.data)

  setError("Invalid email or password.")
}
  }


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await doLogin(email, password)
    setLoading(false)
  }

  const handleTryDemo = async () => {
    setDemoLoading(true)
    setDemoMessage('Waking up server...')
    const wakeupTimer = setTimeout(() => {
      setDemoMessage('Almost there, free server is waking up...')
    }, 3000)
    // await doLogin('rohit.student@EduPilot.com', 'rohit123')
    if (loginMode === 'teacher') {
      await doLogin('anita.rao@EduPilot.com', 'teacher123')
    } else {
      await doLogin('rohit.student@EduPilot.com', 'rohit123')
    }
    clearTimeout(wakeupTimer)
    setDemoLoading(false)
    setDemoMessage('')
  }

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatAndGlow {
          0%, 100% { transform: translateY(0px); box-shadow: 0 15px 35px rgba(139,92,246,0.3), 0 0 20px rgba(245,158,11,0.3); }
          50% { transform: translateY(-12px); box-shadow: 0 25px 45px rgba(139,92,246,0.5), 0 0 40px rgba(245,158,11,0.6); }
        }
        .login-card { animation: slideIn 0.5s ease-out; }
        .logo-float { animation: floatAndGlow 3s ease-in-out infinite; }
        .login-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(139,92,246,0.4); }
        .login-btn:active { transform: translateY(0); }
        .demo-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(20,184,166,0.35); }
        .demo-btn:active { transform: translateY(0); }
        .linput:hover { background: rgba(55,65,81,0.8) !important; border-color: rgba(139,92,246,0.5) !important; }
        .linput:focus { outline: none; background: rgba(55,65,81,0.9) !important; border-color: #8B5CF6 !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }
      `}</style>

      <div style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: 'linear-gradient(135deg, #0F1419 0%, #1a1f2e 100%)',
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}>
        <div className="login-card" style={{
          width: '100%', maxWidth: '450px',
          background: 'rgba(20,25,35,0.9)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '16px', backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          padding: '50px 40px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <div className="logo-float" style={{
              width: '70px', height: '70px', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%)',
              borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px'
            }}>💡</div>
            <h1 style={{
              fontSize: '28px', fontWeight: 700, marginBottom: '8px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>EduPilot AI</h1>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>GenAI-powered ERP Copilot</p>
          </div>

          <button
            type="button"
            className="demo-btn"
            onClick={handleTryDemo}
            disabled={demoLoading || loading}
            style={{
              width: '100%', padding: '12px 16px', marginBottom: '20px',
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 700, cursor: demoLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: demoLoading ? 0.7 : 1
            }}>
            {demoLoading ? demoMessage : '✨ Try Demo'}
          </button>

           <div className="flex items-center bg-white/5 rounded-xl p-1 mb-5">
    <button
      type="button"
      onClick={() => setLoginMode('student')}
      className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
        loginMode === 'student' ? 'bg-purple-500 text-white' : 'text-gray-400'
      }`}>
      Student
    </button>
    <button
      type="button"
      onClick={() => setLoginMode('teacher')}
      className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all ${
        loginMode === 'teacher' ? 'bg-teal-500 text-white' : 'text-gray-400'
      }`}>
      Teacher
    </button>
  </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0 24px' }}>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(139,92,246,0.2)' }} />
            <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Or sign in</span>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(139,92,246,0.2)' }} />
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#E5E7EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
              <input
                type="email"
                className="linput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="email"
                spellCheck={false}
                inputMode="email"
                style={{ width: '100%', padding: '12px 14px', background: 'rgba(55,65,81,0.6)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#E5E7EB', fontSize: '14px', transition: 'all 0.3s ease', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#E5E7EB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
              <input
                type="password"
                className="linput"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="current-password"
                spellCheck={false}
                style={{ width: '100%', padding: '12px 14px', background: 'rgba(55,65,81,0.6)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', color: '#E5E7EB', fontSize: '14px', transition: 'all 0.3s ease', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0 24px', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9CA3AF', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: '14px', height: '14px', accentColor: '#8B5CF6' }} />
                Remember me
              </label>
            </div>

            {error && (
              <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px' }}>{error}</p>
            )}

            <button type="submit" className="login-btn" disabled={loading} style={{
              width: '100%', padding: '12px 16px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease', textTransform: 'uppercase', letterSpacing: '0.5px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}