import { useState, useRef, useEffect } from 'react'
import RecordingControls from './components/RecordingControls'
import RecordingsList from './components/RecordingsList'
import StatusMessage from './components/StatusMessage'
import PhaseManager from './components/PhaseManager'
import ExerciseManager from './components/ExerciseManager'
import ExercisePlayer from './components/ExercisePlayer'
import DataManager from './components/DataManager'
import FavoriteExercises from './components/FavoriteExercises'
import CollapsibleSection from './components/CollapsibleSection'
import * as db from './utils/indexedDB'
import './App.css'

function App() {
  const [recordings, setRecordings] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState({ message: '', type: '' })
  const [isPlayingExercise, setIsPlayingExercise] = useState(false)
  const [currentPlayingExerciseId, setCurrentPlayingExerciseId] = useState(null)
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
    // Don't set isPlayingExercise to false here - let the async function complete and set it
    // This prevents starting a new exercise while the previous one is still cleaning up
    setPlayerStatus('Stopping...')
    // Clear the current playing exercise ID when stopping
    setCurrentPlayingExerciseId(null)
  }

  // Helper function to get timing for a recording in exact timing mode
  const getExactTiming = (phase, recordingId) => {
    const timingsStr = phase.exactTimings?.[recordingId]
    if (!timingsStr) return 1 // fallback

    const timings = timingsStr.split(',').map(t => parseFloat(t.trim())).filter(t => !isNaN(t) && t >= 0)
    if (timings.length === 0) return 1 // fallback

    // Random: pick random timing from the list
    return timings[Math.floor(Math.random() * timings.length)]
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

  const toggleFavorite = (exerciseId) => {
    setExercises(prev => prev.map(e =>
      e.id === exerciseId ? { ...e, isFavorite: !e.isFavorite } : e
    ))
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
    setCurrentPlayingExerciseId(exerciseId)
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
      setCurrentPlayingExerciseId(null)
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

        if (phase.type === 'exactTiming') {
          // Exact Timing: Play ALL recordings with custom timings for this phase
          for (let i = 0; i < phaseRecordings.length; i++) {
            if (exerciseStoppedRef.current) break

            const selectedRecording = phaseRecordings[i]

            // Get exact timing for this recording (randomly selected from list)
            const delay = getExactTiming(phase, selectedRecording.id) * 1000

            const waitMessage = `Waiting ${(delay / 1000).toFixed(1)}s...`
            setStatus({
              message: `Rep ${rep + 1}/${totalRepetitions} - Phase ${phaseIndex + 1}/${exercisePhases.length} (${phase.name}): ${waitMessage}`,
              type: 'recording'
            })
            setPlayerStatus(waitMessage)

            await new Promise(resolve => setTimeout(resolve, delay))

            if (exerciseStoppedRef.current) break

            const playMessage = `Playing ${selectedRecording.name} (${i + 1}/${phaseRecordings.length})`
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
        } else if (phase.type === 'roundRobin') {
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
    setCurrentPlayingExerciseId(null)
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
      setCurrentExerciseName('')
      setCurrentPhaseName('')
      setCurrentRep(0)
      setTotalReps(0)
      setCurrentPhaseIndex(0)
      setTotalPhases(0)
      setTimeout(() => setStatus({ message: '', type: '' }), 3000)
      return
    }

    if (phase.type === 'exactTiming') {
      // Exact Timing: Play recordings with custom timings per sound
      while (!exerciseStoppedRef.current) {
        // Play through all recordings in order
        for (let i = 0; i < phaseRecordings.length; i++) {
          if (exerciseStoppedRef.current) break

          const selectedRecording = phaseRecordings[i]

          // Get exact timing for this recording (randomly selected from list)
          const delay = getExactTiming(phase, selectedRecording.id) * 1000

          const waitMessage = `Waiting ${(delay / 1000).toFixed(1)}s...`
          setStatus({ message: `${phase.name}: ${waitMessage}`, type: 'recording' })
          setPlayerStatus(waitMessage)

          await new Promise(resolve => setTimeout(resolve, delay))

          if (exerciseStoppedRef.current) break

          const playMessage = `Playing ${selectedRecording.name} (${i + 1}/${phaseRecordings.length})`
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
    } else if (phase.type === 'roundRobin') {
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

      <FavoriteExercises
        exercises={exercises}
        phases={phases}
        onStartExercise={startExercise}
        onToggleFavorite={toggleFavorite}
        isPlayingExercise={isPlayingExercise}
        currentPlayingExerciseId={currentPlayingExerciseId}
        onStopExercise={stopExercise}
      />

      <CollapsibleSection
        title="Recordings"
        defaultExpanded={true}
        summary={recordings.length > 0 ? `${recordings.length} recording${recordings.length !== 1 ? 's' : ''}` : 'No recordings yet'}
      >
        <RecordingControls
          isRecording={isRecording}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
        />
        <RecordingsList
          recordings={recordings}
          onPlay={playRecording}
          onDelete={deleteRecording}
          onRename={renameRecording}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Phases"
        defaultExpanded={false}
        summary={
          phases.length > 0
            ? `${phases.length} phase${phases.length !== 1 ? 's' : ''} • ${phases.filter(p => p.type === 'roundRobin').length} round robin • ${phases.filter(p => p.type === 'exactTiming').length} exact timing`
            : 'No phases yet'
        }
      >
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

      <CollapsibleSection
        title="Exercises"
        defaultExpanded={false}
        summary={
          exercises.length > 0
            ? `${exercises.length} exercise${exercises.length !== 1 ? 's' : ''} • ${exercises.filter(e => e.isFavorite).length} favorite${exercises.filter(e => e.isFavorite).length !== 1 ? 's' : ''} • ${exercises.reduce((sum, e) => sum + (e.phaseIds?.length || 0), 0)} total phases`
            : 'No exercises yet'
        }
      >
        <ExerciseManager
          phases={phases}
          exercises={exercises}
          onCreateExercise={createExercise}
          onDeleteExercise={deleteExercise}
          onStartExercise={startExercise}
          onToggleFavorite={toggleFavorite}
          isPlayingExercise={isPlayingExercise}
          currentPlayingExerciseId={currentPlayingExerciseId}
          onStopExercise={stopExercise}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Data Management"
        defaultExpanded={false}
        summary="Export & import your data"
      >
        <DataManager />
      </CollapsibleSection>
    </div>
  )
}

export default App
