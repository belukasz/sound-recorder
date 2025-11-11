import { useState, useRef } from 'react'
import RecordingControls from './components/RecordingControls'
import RecordingsList from './components/RecordingsList'
import StatusMessage from './components/StatusMessage'
import PhaseManager from './components/PhaseManager'
import ExerciseManager from './components/ExerciseManager'
import './App.css'

function App() {
  const [recordings, setRecordings] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState({ message: '', type: '' })
  const [isPlayingExercise, setIsPlayingExercise] = useState(false)
  const [phases, setPhases] = useState([])
  const [exercises, setExercises] = useState([])

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const currentAudioRef = useRef(null)
  const exerciseStoppedRef = useRef(false)

  const getSupportedMimeType = () => {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      return 'audio/webm;codecs=opus'
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      return 'audio/mp4' // iOS Safari
    } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
      return 'audio/ogg;codecs=opus'
    }
    return 'audio/webm'
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = getSupportedMimeType()
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []

      mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
        audioChunksRef.current.push(event.data)
      })

      mediaRecorderRef.current.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        saveRecording(audioBlob)

        // Stop all tracks to turn off the microphone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      })

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setStatus({ message: 'Recording...', type: 'recording' })

    } catch (error) {
      console.error('Error accessing microphone:', error)
      setStatus({ message: 'Error: Could not access microphone', type: 'error' })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setStatus({ message: 'Recording saved!', type: 'success' })

      setTimeout(() => {
        setStatus({ message: '', type: '' })
      }, 3000)
    }
  }

  const saveRecording = (audioBlob) => {
    const recording = {
      id: Date.now(),
      blob: audioBlob,
      url: URL.createObjectURL(audioBlob),
      timestamp: new Date().toLocaleString(),
      name: `Recording ${recordings.length + 1}`
    }

    setRecordings(prev => [recording, ...prev])
  }

  const playRecording = (id) => {
    const recording = recordings.find(r => r.id === id)
    if (recording) {
      const audio = new Audio(recording.url)
      audio.play()
    }
  }

  const deleteRecording = (id) => {
    const recording = recordings.find(r => r.id === id)
    if (recording) {
      URL.revokeObjectURL(recording.url)
    }
    setRecordings(prev => prev.filter(r => r.id !== id))
  }

  const renameRecording = (id, newName) => {
    setRecordings(prev => prev.map(recording =>
      recording.id === id
        ? { ...recording, name: newName }
        : recording
    ))
  }

  const stopExercise = () => {
    exerciseStoppedRef.current = true
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    setIsPlayingExercise(false)
  }

  const createPhase = (phase) => {
    setPhases(prev => [...prev, phase])
  }

  const deletePhase = (phaseId) => {
    setPhases(prev => prev.filter(p => p.id !== phaseId))
  }

  const updatePhase = (phaseId, updates) => {
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, ...updates } : p))
  }

  const createExercise = (exercise) => {
    setExercises(prev => [...prev, exercise])
  }

  const deleteExercise = (exerciseId) => {
    setExercises(prev => prev.filter(e => e.id !== exerciseId))
  }

  const startExercise = async (exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId)
    if (!exercise) return

    setIsPlayingExercise(true)
    exerciseStoppedRef.current = false
    setStatus({ message: `Starting exercise: ${exercise.name}`, type: 'recording' })

    // Get all phases for this exercise in order
    const exercisePhases = exercise.phaseIds
      .map(phaseId => phases.find(p => p.id === phaseId))
      .filter(Boolean)

    if (exercisePhases.length === 0) {
      setStatus({ message: 'No valid phases in this exercise', type: 'error' })
      setIsPlayingExercise(false)
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      return
    }

    const totalRepetitions = exercise.repetitions || 1

    // Repeat the entire exercise
    for (let rep = 0; rep < totalRepetitions; rep++) {
      if (exerciseStoppedRef.current) break

      // Run through each phase sequentially
      for (let phaseIndex = 0; phaseIndex < exercisePhases.length; phaseIndex++) {
        if (exerciseStoppedRef.current) break

        const phase = exercisePhases[phaseIndex]

        // Get recordings for this phase
        const phaseRecordings = phase.recordingIds
          .map(id => recordings.find(r => r.id === id))
          .filter(Boolean)

        if (phaseRecordings.length === 0) {
          continue // Skip this phase if no recordings
        }

        // Random delay before phase starts
        const min = Math.min(phase.minDelay, phase.maxDelay)
        const max = Math.max(phase.minDelay, phase.maxDelay)
        const delay = (Math.random() * (max - min) + min) * 1000

        setStatus({
          message: `Rep ${rep + 1}/${totalRepetitions} - Phase ${phaseIndex + 1}/${exercisePhases.length} (${phase.name}): Waiting ${(delay / 1000).toFixed(1)}s...`,
          type: 'recording'
        })

        await new Promise(resolve => setTimeout(resolve, delay))

        if (exerciseStoppedRef.current) break

        // Pick ONE random recording from this phase
        const randomRecording = phaseRecordings[
          Math.floor(Math.random() * phaseRecordings.length)
        ]

        setStatus({
          message: `Rep ${rep + 1}/${totalRepetitions} - Phase ${phaseIndex + 1}/${exercisePhases.length} (${phase.name}): Playing ${randomRecording.name}`,
          type: 'recording'
        })

        // Play the recording
        await new Promise((resolve) => {
          const audio = new Audio(randomRecording.url)
          currentAudioRef.current = audio

          audio.onended = () => {
            resolve()
          }

          audio.onerror = () => {
            console.error('Error playing recording:', randomRecording.name)
            resolve()
          }

          audio.play()
        })
      }
    }

    setIsPlayingExercise(false)
    if (exerciseStoppedRef.current) {
      setStatus({ message: 'Exercise stopped', type: '' })
    } else {
      setStatus({ message: 'Exercise completed!', type: 'success' })
    }
    setTimeout(() => setStatus({ message: '', type: '' }), 3000)
  }

  const startPhase = async (phaseId) => {
    const phase = phases.find(p => p.id === phaseId)
    if (!phase) return

    setIsPlayingExercise(true)
    exerciseStoppedRef.current = false
    setStatus({ message: `Starting phase: ${phase.name}`, type: 'recording' })

    // Get recordings for this phase
    const phaseRecordings = phase.recordingIds
      .map(id => recordings.find(r => r.id === id))
      .filter(Boolean)

    if (phaseRecordings.length === 0) {
      setStatus({ message: 'No valid recordings in this phase', type: 'error' })
      setIsPlayingExercise(false)
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      return
    }

    // Play recordings with phase-specific delays
    while (!exerciseStoppedRef.current) {
      // Random delay using phase's min/max
      const min = Math.min(phase.minDelay, phase.maxDelay)
      const max = Math.max(phase.minDelay, phase.maxDelay)
      const delay = (Math.random() * (max - min) + min) * 1000

      setStatus({ message: `${phase.name}: Waiting ${(delay / 1000).toFixed(1)}s...`, type: 'recording' })

      await new Promise(resolve => setTimeout(resolve, delay))

      if (exerciseStoppedRef.current) break

      // Pick random recording from phase
      const randomRecording = phaseRecordings[
        Math.floor(Math.random() * phaseRecordings.length)
      ]

      setStatus({ message: `${phase.name}: Playing ${randomRecording.name}`, type: 'recording' })

      // Play the recording
      await new Promise((resolve) => {
        const audio = new Audio(randomRecording.url)
        currentAudioRef.current = audio

        audio.onended = () => {
          resolve()
        }

        audio.onerror = () => {
          console.error('Error playing recording:', randomRecording.name)
          resolve()
        }

        audio.play()
      })

      if (exerciseStoppedRef.current) break
    }

    setIsPlayingExercise(false)
    setStatus({ message: 'Phase stopped', type: '' })
    setTimeout(() => setStatus({ message: '', type: '' }), 2000)
  }

  return (
    <div className="container">
      <h1>Sound Recorder</h1>

      <RecordingControls
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />

      <StatusMessage message={status.message} type={status.type} />

      <RecordingsList
        recordings={recordings}
        onPlay={playRecording}
        onDelete={deleteRecording}
        onRename={renameRecording}
      />

      <PhaseManager
        recordings={recordings}
        phases={phases}
        onCreatePhase={createPhase}
        onDeletePhase={deletePhase}
        onUpdatePhase={updatePhase}
        onStartPhase={startPhase}
        isPlayingExercise={isPlayingExercise}
        onStopExercise={stopExercise}
      />

      <ExerciseManager
        phases={phases}
        exercises={exercises}
        onCreateExercise={createExercise}
        onDeleteExercise={deleteExercise}
        onStartExercise={startExercise}
        isPlayingExercise={isPlayingExercise}
        onStopExercise={stopExercise}
      />
    </div>
  )
}

export default App
