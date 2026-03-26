import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square, Play, Pause, Trash2, FileText, Loader2, CheckCircle } from 'lucide-react'

/**
 * VoiceRecorder - Record voice notes with live speech-to-text transcription
 * 
 * @param {Object} props
 * @param {Function} props.onTranscript - Callback with final transcript text
 * @param {Function} props.onRecordingComplete - Callback with {transcript, duration, audioBlob}
 * @param {string} props.accentColor - Brand accent color
 * @param {string} props.accentHover - Brand accent hover color
 * @param {boolean} props.isDark - Dark mode
 * @param {string} props.placeholder - Placeholder text
 */
export default function VoiceRecorder({
  onTranscript,
  onRecordingComplete,
  accentColor = '#10b981',
  accentHover = '#059669',
  isDark = false,
  placeholder = 'Tap the microphone to start recording...',
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [duration, setDuration] = useState(0)
  const [hasSupport, setHasSupport] = useState(true)
  const [audioBlob, setAudioBlob] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const audioRef = useRef(null)

  const dk = {
    cardBg: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e5e7eb',
    text: isDark ? '#e2e8f0' : '#1f2937',
    textMuted: isDark ? '#94a3b8' : '#6b7280',
    textFaint: isDark ? '#64748b' : '#9ca3af',
    inputBg: isDark ? '#0f172a' : '#f9fafb',
  }

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setHasSupport(false)
    }
    return () => {
      stopEverything()
    }
  }, [])

  const stopEverything = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch {}
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startRecording = async () => {
    setTranscript('')
    setInterimTranscript('')
    setDuration(0)
    setAudioBlob(null)
    audioChunksRef.current = []

    // Start speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-AU'

      recognition.onresult = (event) => {
        let final = ''
        let interim = ''
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' '
          } else {
            interim += event.results[i][0].transcript
          }
        }
        if (final) setTranscript(prev => prev + final)
        setInterimTranscript(interim)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please allow microphone access.')
        }
      }

      recognition.onend = () => {
        // Auto-restart if still recording (recognition can timeout)
        if (isRecording && recognitionRef.current) {
          try { recognition.start() } catch {}
        }
      }

      try {
        recognition.start()
        recognitionRef.current = recognition
      } catch (err) {
        console.error('Failed to start recognition:', err)
      }
    }

    // Start audio recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType })
        setAudioBlob(blob)
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000) // Collect data every second
      mediaRecorderRef.current = mediaRecorder
    } catch (err) {
      console.error('Failed to start audio recording:', err)
    }

    // Start timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)

    setIsRecording(true)
    setIsPaused(false)
  }

  const stopRecording = () => {
    stopEverything()
    setIsRecording(false)
    setIsPaused(false)
    setInterimTranscript('')
  }

  const handleDone = () => {
    const finalText = transcript.trim()
    if (onTranscript && finalText) {
      onTranscript(finalText)
    }
    if (onRecordingComplete) {
      onRecordingComplete({
        transcript: finalText,
        duration,
        audioBlob,
      })
    }
  }

  const handleClear = () => {
    stopEverything()
    setIsRecording(false)
    setIsPaused(false)
    setTranscript('')
    setInterimTranscript('')
    setDuration(0)
    setAudioBlob(null)
  }

  const playAudio = () => {
    if (!audioBlob) return
    if (audioRef.current) {
      audioRef.current.pause()
      URL.revokeObjectURL(audioRef.current.src)
    }
    const audio = new Audio(URL.createObjectURL(audioBlob))
    audio.onended = () => setIsPlaying(false)
    audio.play()
    audioRef.current = audio
    setIsPlaying(true)
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  // No speech recognition support — show text-only fallback
  if (!hasSupport) {
    return (
      <div className="p-3 rounded-xl text-xs" style={{ background: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', border: `1px solid ${isDark ? '#92400e' : '#fde68a'}`, color: isDark ? '#fbbf24' : '#92400e' }}>
        Voice recording is not supported in this browser. Please use Chrome or Edge for voice notes, or type your note below.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Recording controls */}
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg transition-all hover:opacity-90"
            style={{ background: `linear-gradient(to right, ${accentColor}, ${accentHover})` }}>
            <Mic size={18} /> Record Voice Note
          </button>
        ) : (
          <>
            <button onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg"
              style={{ background: 'linear-gradient(to right, #ef4444, #dc2626)' }}>
              <Square size={14} /> Stop
            </button>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: dk.text }}>{formatDuration(duration)}</span>
            </div>
          </>
        )}

        {/* Playback controls */}
        {audioBlob && !isRecording && (
          <div className="flex items-center gap-2">
            {isPlaying ? (
              <button onClick={stopAudio} className="p-2 rounded-lg" style={{ background: isDark ? '#334155' : '#f3f4f6' }}>
                <Pause size={16} style={{ color: dk.text }} />
              </button>
            ) : (
              <button onClick={playAudio} className="p-2 rounded-lg" style={{ background: isDark ? '#334155' : '#f3f4f6' }}>
                <Play size={16} style={{ color: dk.text }} />
              </button>
            )}
            <span className="text-xs" style={{ color: dk.textFaint }}>{formatDuration(duration)}</span>
          </div>
        )}

        {/* Clear button */}
        {(transcript || isRecording) && (
          <button onClick={handleClear} className="p-2 rounded-lg ml-auto" style={{ color: dk.textFaint }}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Live waveform indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-1 py-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-1 rounded-full animate-pulse"
              style={{
                height: `${8 + Math.random() * 20}px`,
                background: accentColor,
                opacity: 0.4 + Math.random() * 0.6,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${0.4 + Math.random() * 0.6}s`,
              }} />
          ))}
        </div>
      )}

      {/* Transcript display */}
      {(transcript || interimTranscript) ? (
        <div className="p-3 rounded-xl min-h-[80px]" style={{ background: dk.inputBg, border: `1px solid ${dk.border}` }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText size={12} style={{ color: accentColor }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: dk.textFaint }}>Transcript</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: dk.text }}>
            {transcript}
            {interimTranscript && <span style={{ color: dk.textFaint }}>{interimTranscript}</span>}
          </p>
        </div>
      ) : !isRecording ? (
        <div className="p-3 rounded-xl text-center" style={{ background: dk.inputBg, border: `1px solid ${dk.border}` }}>
          <Mic size={20} className="mx-auto mb-1.5" style={{ color: dk.textFaint }} />
          <p className="text-xs" style={{ color: dk.textFaint }}>{placeholder}</p>
        </div>
      ) : null}

      {/* Use transcript button */}
      {transcript.trim() && !isRecording && (
        <button onClick={handleDone}
          className="w-full py-2.5 rounded-xl text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(to right, ${accentColor}, ${accentHover})` }}>
          <CheckCircle size={16} /> Use Transcript
        </button>
      )}
    </div>
  )
}