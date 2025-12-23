import './ExercisePlayer.css'

function ExercisePlayer({
  currentExercise,
  currentPhase,
  currentRep,
  totalReps,
  currentPhaseIndex,
  totalPhases,
  status,
  onStop
}) {
  if (!currentExercise) {
    return null
  }

  return (
    <div className="exercise-player">
      <div className="exercise-player-header">
        <h3>Now Playing</h3>
        <button className="btn-stop-player" onClick={onStop}>
          Stop Exercise
        </button>
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
        </div>
      </div>
    </div>
  )
}

export default ExercisePlayer
