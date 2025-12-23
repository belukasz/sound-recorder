import { useState, useRef, useEffect } from 'react'
import RecordingControls from './components/RecordingControls'
import RecordingsList from './components/RecordingsList'
import StatusMessage from './components/StatusMessage'
import PhaseManager from './components/PhaseManager'
import ExerciseManager from './components/ExerciseManager'
import ExercisePlayer from './components/ExercisePlayer'
import DataManager from './components/DataManager'
import CollapsibleSection from './components/CollapsibleSection'
import * as db from './utils/indexedDB'
import './App.css'

function App() {
  const [recordings, setRecordings] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState({ message: '', type: '' })
  const [isPlayingExercise, setIsPlayingExercise] = useState(false)
  const [phases, setPhases] = useState([])
  const [exercises, setExercises] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Exercise player state
  const [currentExerciseName, setCurrentExerciseName] = useState('')
  const [currentPhaseName, setCurrentPhaseName] = useState('')
  const [currentRep, setCurrentRep] = useState(0)
  const [totalReps, setTotalReps] = useState(0)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [totalPhases, setTotalPhases] = useState(0)
  const [playerStatus, setPlayerStatus] = useState('')

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const currentAudioRef = useRef(null)
  const exerciseStoppedRef = useRef(false)

  // Load data from IndexedDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedRecordings, loadedPhases, loadedExercises] = await Promise.all([
          db.getAllRecordings(),
          db.getAllPhases(),
          db.getAllExercises()
        ])

        setRecordings(loadedRecordings)
        setPhases(loadedPhases)
        setExercises(loadedExercises)
      } catch (error) {
        console.error('Error loading data:', error)
        setStatus({ message: 'Error loading saved data', type: 'error' })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Auto-save whenever data changes
  useEffect(() => {
    if (isLoading) return // Don't save during initial load

    const saveData = async () => {
      try {
        // Save all recordings
        for (const recording of recordings) {
          await db.saveRecording(recording)
        }

        // Save all phases
        for (const phase of phases) {
          await db.savePhase(phase)
        }

        // Save all exercises
        for (const exercise of exercises) {
          await db.saveExercise(exercise)
        }
      } catch (error) {
        console.error('Error auto-saving data:', error)
      }
    }

    saveData()
  }, [recordings, phases, exercises, isLoading])

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

  const deleteRecording = async (id) => {
    const recording = recordings.find(r => r.id === id)
    if (recording) {
      URL.revokeObjectURL(recording.url)
    }
    await db.deleteRecording(id)
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
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
    setIsPlayingExercise(false)
    // Reset player state
    setCurrentExerciseName('')
    setCurrentPhaseName('')
    setCurrentRep(0)
    setTotalReps(0)
    setCurrentPhaseIndex(0)
    setTotalPhases(0)
    setPlayerStatus('')
  }

  const createPhase = (phase) => {
    setPhases(prev => [...prev, phase])
  }

  const deletePhase = async (phaseId) => {
    await db.deletePhase(phaseId)
    setPhases(prev => prev.filter(p => p.id !== phaseId))
  }

  const updatePhase = (phaseId, updates) => {
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, ...updates } : p))
  }

  const createExercise = (exercise) => {
    setExercises(prev => [...prev, exercise])
  }

  const deleteExercise = async (exerciseId) => {
    await db.deleteExercise(exerciseId)
    setExercises(prev => prev.filter(e => e.id !== exerciseId))
  }

  const startExercise = async (exerciseId) => {
    // Prevent starting multiple exercises
    if (isPlayingExercise) {
      setStatus({ message: 'An exercise is already playing. Stop it first.', type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      return
    }

    const exercise = exercises.find(e => e.id === exerciseId)
    if (!exercise) return

    setIsPlayingExercise(true)
    exerciseStoppedRef.current = false
    setStatus({ message: `Starting exercise: ${exercise.name}`, type: 'recording' })

    // Initialize player state
    setCurrentExerciseName(exercise.name)
    setTotalReps(exercise.repetitions || 1)

    // Get all phases for this exercise in order
    const exercisePhases = exercise.phaseIds
      .map(phaseId => phases.find(p => p.id === phaseId))
      .filter(Boolean)

    if (exercisePhases.length === 0) {
      setStatus({ message: 'No valid phases in this exercise', type: 'error' })
      setIsPlayingExercise(false)
      setCurrentExerciseName('')
      setTotalReps(0)
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      return
    }

    const totalRepetitions = exercise.repetitions || 1
    setTotalPhases(exercisePhases.length)

    // Repeat the entire exercise
    for (let rep = 0; rep < totalRepetitions; rep++) {
      if (exerciseStoppedRef.current) break

      setCurrentRep(rep + 1)

      // Run through each phase sequentially
      for (let phaseIndex = 0; phaseIndex < exercisePhases.length; phaseIndex++) {
        if (exerciseStoppedRef.current) break

        const phase = exercisePhases[phaseIndex]
        setCurrentPhaseName(phase.name)
        setCurrentPhaseIndex(phaseIndex + 1)

        // Get recordings for this phase
        const phaseRecordings = phase.recordingIds
          .map(id => recordings.find(r => r.id === id))
          .filter(Boolean)

        if (phaseRecordings.length === 0) {
          continue // Skip this phase if no recordings
        }

        if (phase.type === 'roundRobin') {
          // Round Robin: Play ALL recordings in sequence with repetitions for this phase
          const repsPerSound = phase.soundRepetitions || 1

          for (let i = 0; i < phaseRecordings.length; i++) {
            if (exerciseStoppedRef.current) break

            const selectedRecording = phaseRecordings[i]

            // Repeat each sound the specified number of times
            for (let soundRep = 0; soundRep < repsPerSound; soundRep++) {
              if (exerciseStoppedRef.current) break

              // Random delay before each recording
              const min = Math.min(phase.minDelay, phase.maxDelay)
              const max = Math.max(phase.minDelay, phase.maxDelay)
              const delay = (Math.random() * (max - min) + min) * 1000

              const waitMessage = `Waiting ${(delay / 1000).toFixed(1)}s...`
              setStatus({
                message: `Rep ${rep + 1}/${totalRepetitions} - Phase ${phaseIndex + 1}/${exercisePhases.length} (${phase.name}): ${waitMessage}`,
                type: 'recording'
              })
              setPlayerStatus(waitMessage)

              await new Promise(resolve => setTimeout(resolve, delay))

              if (exerciseStoppedRef.current) break

              const playMessage = repsPerSound > 1
                ? `Playing ${selectedRecording.name} (${i + 1}/${phaseRecordings.length}, rep ${soundRep + 1}/${repsPerSound})`
                : `Playing ${selectedRecording.name} (${i + 1}/${phaseRecordings.length})`
              setStatus({
                message: `Rep ${rep + 1}/${totalRepetitions} - Phase ${phaseIndex + 1}/${exercisePhases.length} (${phase.name}): ${playMessage}`,
                type: 'recording'
              })
              setPlayerStatus(playMessage)

              // Play the recording
              await new Promise((resolve) => {
                const audio = new Audio(selectedRecording.url)
                currentAudioRef.current = audio

                audio.onended = () => {
                  resolve()
                }

                audio.onerror = () => {
                  console.error('Error playing recording:', selectedRecording.name)
                  resolve()
                }

                audio.play()
              })
            }
          }
        } else {
          // Random Timing: Pick ONE random recording for this phase
          // Random delay before phase starts
          const min = Math.min(phase.minDelay, phase.maxDelay)
          const max = Math.max(phase.minDelay, phase.maxDelay)
          const delay = (Math.random() * (max - min) + min) * 1000

          const waitMessage = `Waiting ${(delay / 1000).toFixed(1)}s...`
          setStatus({
            message: `Rep ${rep + 1}/${totalRepetitions} - Phase ${phaseIndex + 1}/${exercisePhases.length} (${phase.name}): ${waitMessage}`,
            type: 'recording'
          })
          setPlayerStatus(waitMessage)

          await new Promise(resolve => setTimeout(resolve, delay))

          if (exerciseStoppedRef.current) break

          // Random: pick random recording
          const selectedRecording = phaseRecordings[
            Math.floor(Math.random() * phaseRecordings.length)
          ]

          const playMessage = `Playing ${selectedRecording.name}`
          setStatus({
            message: `Rep ${rep + 1}/${totalRepetitions} - Phase ${phaseIndex + 1}/${exercisePhases.length} (${phase.name}): ${playMessage}`,
            type: 'recording'
          })
          setPlayerStatus(playMessage)

          // Play the recording
          await new Promise((resolve) => {
            const audio = new Audio(selectedRecording.url)
            currentAudioRef.current = audio

            audio.onended = () => {
              resolve()
            }

            audio.onerror = () => {
              console.error('Error playing recording:', selectedRecording.name)
              resolve()
            }

            audio.play()
          })
        }
      }
    }

    setIsPlayingExercise(false)
    // Reset player state
    setCurrentExerciseName('')
    setCurrentPhaseName('')
    setCurrentRep(0)
    setTotalReps(0)
    setCurrentPhaseIndex(0)
    setTotalPhases(0)
    setPlayerStatus('')

    if (exerciseStoppedRef.current) {
      setStatus({ message: 'Exercise stopped', type: '' })
    } else {
      setStatus({ message: 'Exercise completed!', type: 'success' })
    }
    setTimeout(() => setStatus({ message: '', type: '' }), 3000)
  }

  const startPhase = async (phaseId) => {
    // Prevent starting multiple exercises/phases
    if (isPlayingExercise) {
      setStatus({ message: 'An exercise or phase is already playing. Stop it first.', type: 'error' })
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      return
    }

    const phase = phases.find(p => p.id === phaseId)
    if (!phase) return

    setIsPlayingExercise(true)
    exerciseStoppedRef.current = false
    setStatus({ message: `Starting phase: ${phase.name}`, type: 'recording' })

    // Set player state for standalone phase
    setCurrentExerciseName(`Phase: ${phase.name}`)
    setCurrentPhaseName(phase.name)
    setTotalReps(1)
    setCurrentRep(1)
    setTotalPhases(1)
    setCurrentPhaseIndex(1)

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

    if (phase.type === 'roundRobin') {
      // Round Robin: Play all recordings in sequence with repetitions, continuously
      const repsPerSound = phase.soundRepetitions || 1

      while (!exerciseStoppedRef.current) {
        // Play through all recordings in order
        for (let i = 0; i < phaseRecordings.length; i++) {
          if (exerciseStoppedRef.current) break

          const selectedRecording = phaseRecordings[i]

          // Repeat each sound the specified number of times
          for (let rep = 0; rep < repsPerSound; rep++) {
            if (exerciseStoppedRef.current) break

            // Random delay using phase's min/max
            const min = Math.min(phase.minDelay, phase.maxDelay)
            const max = Math.max(phase.minDelay, phase.maxDelay)
            const delay = (Math.random() * (max - min) + min) * 1000

            const waitMessage = `Waiting ${(delay / 1000).toFixed(1)}s...`
            setStatus({ message: `${phase.name}: ${waitMessage}`, type: 'recording' })
            setPlayerStatus(waitMessage)

            await new Promise(resolve => setTimeout(resolve, delay))

            if (exerciseStoppedRef.current) break

            const playMessage = repsPerSound > 1
              ? `Playing ${selectedRecording.name} (${i + 1}/${phaseRecordings.length}, rep ${rep + 1}/${repsPerSound})`
              : `Playing ${selectedRecording.name} (${i + 1}/${phaseRecordings.length})`
            setStatus({ message: `${phase.name}: ${playMessage}`, type: 'recording' })
            setPlayerStatus(playMessage)

            // Play the recording
            await new Promise((resolve) => {
              const audio = new Audio(selectedRecording.url)
              currentAudioRef.current = audio

              audio.onended = () => {
                resolve()
              }

              audio.onerror = () => {
                console.error('Error playing recording:', selectedRecording.name)
                resolve()
              }

              audio.play()
            })
          }
        }
      }
    } else {
      // Random Timing: Play random recordings continuously
      while (!exerciseStoppedRef.current) {
        // Random delay using phase's min/max
        const min = Math.min(phase.minDelay, phase.maxDelay)
        const max = Math.max(phase.minDelay, phase.maxDelay)
        const delay = (Math.random() * (max - min) + min) * 1000

        const waitMessage = `Waiting ${(delay / 1000).toFixed(1)}s...`
        setStatus({ message: `${phase.name}: ${waitMessage}`, type: 'recording' })
        setPlayerStatus(waitMessage)

        await new Promise(resolve => setTimeout(resolve, delay))

        if (exerciseStoppedRef.current) break

        // Random: pick random recording
        const selectedRecording = phaseRecordings[
          Math.floor(Math.random() * phaseRecordings.length)
        ]

        const playMessage = `Playing ${selectedRecording.name}`
        setStatus({ message: `${phase.name}: ${playMessage}`, type: 'recording' })
        setPlayerStatus(playMessage)

        // Play the recording
        await new Promise((resolve) => {
          const audio = new Audio(selectedRecording.url)
          currentAudioRef.current = audio

          audio.onended = () => {
            resolve()
          }

          audio.onerror = () => {
            console.error('Error playing recording:', selectedRecording.name)
            resolve()
          }

          audio.play()
        })

        if (exerciseStoppedRef.current) break
      }
    }

    setIsPlayingExercise(false)
    // Reset player state
    setCurrentExerciseName('')
    setCurrentPhaseName('')
    setCurrentRep(0)
    setTotalReps(0)
    setCurrentPhaseIndex(0)
    setTotalPhases(0)
    setPlayerStatus('')
    setStatus({ message: 'Phase stopped', type: '' })
    setTimeout(() => setStatus({ message: '', type: '' }), 2000)
  }

  return (
    <div className="container">
      <h1>⚡ Timing Trainer</h1>

      <RecordingControls
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />

      <StatusMessage message={status.message} type={status.type} />

      {isPlayingExercise && (
        <ExercisePlayer
          currentExercise={currentExerciseName}
          currentPhase={currentPhaseName}
          currentRep={currentRep}
          totalReps={totalReps}
          currentPhaseIndex={currentPhaseIndex}
          totalPhases={totalPhases}
          status={playerStatus}
          onStop={stopExercise}
        />
      )}

      <CollapsibleSection title="Recordings" defaultExpanded={true}>
        <RecordingsList
          recordings={recordings}
          onPlay={playRecording}
          onDelete={deleteRecording}
          onRename={renameRecording}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Phases" defaultExpanded={false}>
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
      </CollapsibleSection>

      <CollapsibleSection title="Exercises" defaultExpanded={false}>
        <ExerciseManager
          phases={phases}
          exercises={exercises}
          onCreateExercise={createExercise}
          onDeleteExercise={deleteExercise}
          onStartExercise={startExercise}
          isPlayingExercise={isPlayingExercise}
          onStopExercise={stopExercise}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Data Management" defaultExpanded={false}>
        <DataManager />
      </CollapsibleSection>
    </div>
  )
}

export default App
