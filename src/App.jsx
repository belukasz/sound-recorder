import { useState, useRef } from 'react'
import RecordingControls from './components/RecordingControls'
import RecordingsList from './components/RecordingsList'
import StatusMessage from './components/StatusMessage'
import './App.css'

function App() {
  const [recordings, setRecordings] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState({ message: '', type: '' })
  const [selectedRecordings, setSelectedRecordings] = useState([])
  const [isPlayingExercise, setIsPlayingExercise] = useState(false)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const currentAudioRef = useRef(null)

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

  const toggleRecordingSelection = (id) => {
    setSelectedRecordings(prev =>
      prev.includes(id)
        ? prev.filter(recordingId => recordingId !== id)
        : [...prev, id]
    )
  }

  const playExercise = async () => {
    if (selectedRecordings.length === 0) {
      setStatus({ message: 'Please select at least one recording', type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      return
    }

    setIsPlayingExercise(true)
    setStatus({ message: 'Playing exercise...', type: 'recording' })

    // Get selected recordings in order
    const selectedRecordingObjects = selectedRecordings
      .map(id => recordings.find(r => r.id === id))
      .filter(Boolean)

    // Play recordings sequentially
    for (let i = 0; i < selectedRecordingObjects.length; i++) {
      const recording = selectedRecordingObjects[i]

      await new Promise((resolve) => {
        const audio = new Audio(recording.url)
        currentAudioRef.current = audio

        audio.onended = () => {
          resolve()
        }

        audio.onerror = () => {
          console.error('Error playing recording:', recording.name)
          resolve()
        }

        audio.play()
      })
    }

    setIsPlayingExercise(false)
    setStatus({ message: 'Exercise completed!', type: 'success' })
    setTimeout(() => setStatus({ message: '', type: '' }), 3000)
  }

  const stopExercise = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    setIsPlayingExercise(false)
    setStatus({ message: 'Exercise stopped', type: '' })
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
        selectedRecordings={selectedRecordings}
        isPlayingExercise={isPlayingExercise}
        onPlay={playRecording}
        onDelete={deleteRecording}
        onRename={renameRecording}
        onToggleSelection={toggleRecordingSelection}
        onPlayExercise={playExercise}
        onStopExercise={stopExercise}
      />
    </div>
  )
}

export default App
