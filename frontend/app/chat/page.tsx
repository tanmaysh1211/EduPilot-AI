'use client'
import ReactMarkdown from 'react-markdown'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Send, Lightbulb, User, Mic, MicOff } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

interface Message {
  role: 'user' | 'ai'
  text: string
}

const greetings = [
  'Hello, Rohit',
  'Welcome back, Rohit',
  'Rohit returns!',
  'Hey there, Rohit',
  'Good to see you, Rohit',
]

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [micSupported, setMicSupported] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) router.push('/login')
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)])

    const timer = setTimeout(() => {
      if (window.innerWidth < 1024) {
        mobileInputRef.current?.focus()
      } else {
        inputRef.current?.focus()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Setup speech recognition once
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setMicSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'hi-IN' // Hindi-India locale also understands English well on most devices

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('')
      setInput(transcript)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const toggleMic = () => {
    if (!micSupported || !recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setInput('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const suggestions = [
    'Mera attendance dikhao',
    'DBMS marks kya hain?',
    'Aaj ki class kab hai?',
    '75% se kam attendance?',
  ]

  // const sendMessage = async (text: string) => {
  //   if (!text.trim()) return
  //   setMessages(prev => [...prev, { role: 'user', text }])
  //   setInput('')
  //   setLoading(true)

  //   try {
  //     // const studentId = localStorage.getItem('student_id') || '1'
  //     // const res = await axios.post('http://localhost:8000/chat/', {
  //     //   question: text,
  //     //   student_id: parseInt(studentId)
  //     // })
  //     const studentId = localStorage.getItem('student_id') || '1'
  //     const recentHistory = messages.slice(-6).map(m => ({
  //       role: m.role === 'ai' ? 'assistant' : 'user',
  //       content: m.text
  //     }))
  //     const res = await axios.post('http://localhost:8000/chat/', {
  //       question: text,
  //       student_id: parseInt(studentId),
  //       history: recentHistory
  //     })
  //     setMessages(prev => [...prev, { role: 'ai', text: res.data.answer }])
  //   } catch (err) {
  //     setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, kuch problem aa gayi. Phir try karo! 😅' }])
  //   } finally {
  //     setLoading(false)
  //   }
  // }


  // Replace your existing sendMessage function in chat/page.tsx with this version.
// Key difference: uses fetch + ReadableStream instead of axios, so we can render
// tokens as they arrive instead of waiting for the full response.

const sendMessage = async (text: string) => {
  if (!text.trim()) return
  setMessages(prev => [...prev, { role: 'user', text }])
  setInput('')
  setLoading(true)

  const studentId = localStorage.getItem('student_id') || '1'
  const recentHistory = messages.slice(-6).map(m => ({
    role: m.role === 'ai' ? 'assistant' : 'user',
    content: m.text
  }))

  // Add a placeholder AI message we'll fill in as tokens arrive
  setMessages(prev => [...prev, { role: 'ai', text: '' }])

  try {
    const response = await fetch('http://localhost:8000/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: text,
        student_id: parseInt(studentId),
        history: recentHistory
      })
    })

    if (!response.body) throw new Error('No response body')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let accumulatedText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || '' // keep any incomplete chunk for next iteration

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const jsonStr = line.slice(6)
        try {
          const event = JSON.parse(jsonStr)
          if (event.type === 'token') {
            accumulatedText += event.content
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'ai', text: accumulatedText }
              return updated
            })
          }
          // event.type === 'meta' and 'done' are available here too if you want
          // to show intent/sql debug info — currently unused in the UI.
        } catch (e) {
          console.error('Failed to parse SSE chunk:', jsonStr)
        }
      }
    }

    if (!accumulatedText) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'ai', text: 'Sorry, kuch problem aa gayi. Phir try karo! 😅' }
        return updated
      })
    }
  } catch (err) {
    setMessages(prev => {
      const updated = [...prev]
      updated[updated.length - 1] = { role: 'ai', text: 'Sorry, kuch problem aa gayi. Phir try karo! 😅' }
      return updated
    })
  } finally {
    setLoading(false)
  }
}


  const isEmpty = messages.length === 0

  // Generate stars with fixed positions (stable across re-renders)
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: (i * 37 + 13) % 100,
    top: (i * 53 + 7) % 100,
    size: (i % 3) + 1,
    delay: (i % 5) * 0.6,
  }))

  const planets = [
    { left: 8, top: 15, size: 22, color: '#a78bfa' },
    { left: 88, top: 22, size: 14, color: '#f59e0b' },
    { left: 15, top: 78, size: 18, color: '#60a5fa' },
    { left: 92, top: 70, size: 10, color: '#f472b6' },
  ]

  const MicButton = ({ size = 18 }: { size?: number }) => (
    <button
      type="button"
      onClick={toggleMic}
      disabled={!micSupported}
      title={!micSupported ? 'Voice input not supported on this browser' : isListening ? 'Stop listening' : 'Speak your question'}
      className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
        isListening
          ? 'text-red-400 bg-red-500/10 animate-pulse'
          : micSupported
          ? 'text-gray-400 hover:text-white hover:bg-white/5'
          : 'text-gray-600 cursor-not-allowed'
      }`}>
      {isListening ? <MicOff size={size} /> : <Mic size={size} />}
    </button>
  )

  return (
    <>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 1; }
        }
        @keyframes comet {
          0% { transform: translate(-10vw, -10vh); opacity: 0; }
          5% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translate(110vw, 110vh); opacity: 0; }
        }
        .star-twinkle { animation: twinkle 2.5s ease-in-out infinite; }
        .comet-trail { animation: comet 8s linear infinite; }
      `}</style>

      <div className="min-h-screen flex overflow-x-hidden relative" style={{ backgroundColor: '#0a0a12' }}>
        {/* Space background layer */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          {/* Crescent moon */}
          <svg
            viewBox="0 0 100 100"
            style={{ position: 'absolute', top: '8%', left: '78%', width: '70px', height: '70px', opacity: 0.85 }}>
            <defs>
              <mask id="moonMask">
                <circle cx="50" cy="50" r="38" fill="white" />
                <circle cx="64" cy="42" r="34" fill="black" />
              </mask>
            </defs>
            <circle cx="50" cy="50" r="38" fill="#e9e4f7" mask="url(#moonMask)" />
          </svg>

          {/* Planets */}
          {planets.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 30%, ${p.color}, ${p.color}99 60%, transparent)`,
                opacity: 0.55,
              }}
            />
          ))}

          {/* Stars */}
          {stars.map((s) => (
            <div
              key={s.id}
              className="star-twinkle"
              style={{
                position: 'absolute',
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                borderRadius: '50%',
                background: '#ffffff',
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}

          {/* Comet trail - top-left to bottom-right */}
          <div className="comet-trail" style={{ position: 'absolute', top: 0, left: 0 }}>
            <div
              style={{
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 0 6px 2px rgba(255,255,255,0.8), -60px -28px 18px -10px rgba(167,139,250,0.5), -120px -56px 28px -14px rgba(167,139,250,0.25)',
              }}
            />
          </div>
        </div>

        <Sidebar />
        <main className="flex-1 min-w-0 flex flex-col h-screen pt-16 lg:pt-0 relative" style={{ zIndex: 1 }}>
          <div style={{ height: '56px', flexShrink: 0 }} className="hidden lg:block" />

          {isEmpty ? (
            <>
              <div className="hidden lg:flex flex-1 flex-col items-center justify-center px-10 -mt-10">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #a78bfa, #f59e0b)', marginBottom: '24px' }}>
                  <Lightbulb size={22} className="text-white" />
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl font-semibold text-white text-center"
                  style={{ marginBottom: '40px' }}>
                  {greeting}
                </motion.h1>

                <div className="w-full max-w-2xl">
                  <div className="flex flex-wrap gap-2 justify-center" style={{ marginBottom: '20px' }}>
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => sendMessage(s)}
                        className="text-sm px-4 py-2 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all backdrop-blur-sm">
                        {s}
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#15151f]/85 backdrop-blur-md px-4 py-3">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                      placeholder={isListening ? 'Sun raha hoon... bolo' : 'Chat with EduPilot...'}
                      className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
                    />
                    <MicButton />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => sendMessage(input)}
                      disabled={loading}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #a78bfa, #f59e0b)' }}>
                      <Send size={16} />
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="lg:hidden flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
                <div className="flex flex-col items-center justify-center flex-1 px-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #a78bfa, #f59e0b)', marginBottom: '16px' }}>
                    <Lightbulb size={20} className="text-white" />
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-xl font-semibold text-white text-center">
                    {greeting}
                  </motion.h1>
                </div>

                <div className="px-4 pb-6" style={{ flexShrink: 0 }}>
                  <div className="flex flex-wrap gap-2 justify-center" style={{ marginBottom: '14px' }}>
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => sendMessage(s)}
                        className="text-sm px-4 py-2 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all backdrop-blur-sm">
                        {s}
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#15151f]/85 backdrop-blur-md px-4 py-3">
                    <input
                      ref={mobileInputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                      placeholder={isListening ? 'Sun raha hoon... bolo' : 'Apna sawaal type karo...'}
                      className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
                    />
                    <MicButton />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => sendMessage(input)}
                      disabled={loading}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #a78bfa, #f59e0b)' }}>
                      <Send size={16} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-4 sm:px-10 pt-6 pb-6 space-y-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 w-full sm:max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>

                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'ai' ? '' : 'bg-white/10'
                    }`}
                      style={msg.role === 'ai' ? { background: 'linear-gradient(135deg, #a78bfa, #f59e0b)' } : {}}>
                      {msg.role === 'ai'
                        ? <Lightbulb size={14} className="text-white" />
                        : <User size={14} className="text-gray-300" />}
                    </div>

                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed min-w-0 ${
                      msg.role === 'ai'
                        ? 'bg-[#15151f]/90 backdrop-blur-sm border border-white/6 text-gray-200 shadow-sm prose prose-invert prose-sm max-w-none'
                        : 'text-white whitespace-pre-line'
                    }`}
                      style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #a78bfa, #c4b5fd)' } : {}}>
                      {msg.role === 'ai' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3 w-full sm:max-w-[85%]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #a78bfa, #f59e0b)' }}>
                      <Lightbulb size={14} className="text-white" />
                    </div>
                    <div className="bg-[#15151f]/90 backdrop-blur-sm border border-white/6 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      ))}
                    </div>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>

              <div className="px-4 sm:px-10 py-5 border-t border-white/6 bg-[#0a0a12]/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#15151f]/90 backdrop-blur-sm px-4 py-3 max-w-2xl mx-auto w-full">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                    placeholder={isListening ? 'Sun raha hoon... bolo' : 'Apna sawaal type karo...'}
                    className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
                  />
                  <MicButton />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => sendMessage(input)}
                    disabled={loading}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #a78bfa, #f59e0b)' }}>
                    <Send size={16} />
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}