import { useState, useEffect } from 'react'
import './ExercisePlayer.css'

function ExercisePlayer({
  currentExercise,
  currentPhase,
  currentRep,
  totalReps,
  currentPhaseIndex,
  totalPhases,
  status,
  onStop,
  trainingStartTime,
  isPaused,
  onPause,
  onResume
}) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!trainingStartTime) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - trainingStartTime) / 1000)
      setElapsedTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [trainingStartTime])

  if (!currentExercise) {
    return null
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="exercise-player">
      <div className="exercise-player-header">
        <h3>Now Playing</h3>
        <div className="player-controls">
          {isPaused ? (
            <button className="btn-resume-player" onClick={onResume}>
              ▶️ Resume
            </button>
          ) : (
            <button className="btn-pause-player" onClick={onPause}>
              ⏸️ Pause
            </button>
          )}
          <button className="btn-stop-player" onClick={onStop}>
            {trainingStartTime ? 'Stop Training' : 'Stop Exercise'}
          </button>
        </div>
      </div>

      <div className="exercise-player-content">
        <div className="exercise-player-info">
          <div className="player-field">
            <span className="player-label">Exercise:</span>
            <span className="player-value">{currentExercise}</span>
          </div>

          {currentPhase && (
            <div className="player-field">
              <span className="player-label">Current Phase:</span>
              <span className="player-value">
                {currentPhase} ({currentPhaseIndex}/{totalPhases})
              </span>
            </div>
          )}

          {totalReps > 1 && (
            <div className="player-field">
              <span className="player-label">Repetition:</span>
              <span className="player-value">{currentRep}/{totalReps}</span>
            </div>
          )}

          {status && (
            <div className="player-status">
              <span className="status-indicator">🎵</span>
              <span className="status-text">{status}</span>
            </div>
          )}

          {trainingStartTime && (
            <div className="player-field training-timer">
              <span className="player-label">Training Time:</span>
              <span className="player-value player-time">{formatTime(elapsedTime)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExercisePlayer
