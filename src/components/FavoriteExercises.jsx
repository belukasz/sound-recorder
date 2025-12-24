import './FavoriteExercises.css'

function FavoriteExercises({ exercises, phases, recordings, onStartExercise, onToggleFavorite, isPlayingExercise, currentPlayingExerciseId, onStopExercise }) {
  const favoriteExercises = exercises.filter(e => e.isFavorite)

  const getPhaseName = (phaseId) => {
    const phase = phases.find(p => p.id === phaseId)
    return phase ? phase.name : 'Unknown Phase'
  }

  if (favoriteExercises.length === 0) {
    return null // Don't show the section if there are no favorites
  }

  return (
    <div className="favorite-exercises-section">
      <h2 className="favorite-exercises-title">⭐ Favorite Exercises</h2>
      <div className="favorite-exercises-list">
        {favoriteExercises.map(exercise => (
          <div key={exercise.id} className="favorite-exercise-item">
            <div className="favorite-exercise-info">
              <h3>{exercise.name}</h3>
              <div className="favorite-exercise-details">
                {exercise.type === 'timed' ? (
                  <>
                    <span className="exercise-stat">⏱️ {exercise.duration} seconds</span>
                    {exercise.startRecordingId && (
                      <span className="exercise-stat">▶️ Start sound</span>
                    )}
                    {exercise.endRecordingId && (
                      <span className="exercise-stat">⏹️ End sound</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="exercise-stat">📋 {exercise.phaseIds?.length || 0} phases</span>
                    <span className="exercise-stat">🔄 {exercise.repetitions || 1}x repetitions</span>
                  </>
                )}
              </div>
              {exercise.type !== 'timed' && exercise.phaseIds && (
                <div className="exercise-phases-preview">
                  {exercise.phaseIds.map((phaseId, idx) => (
                    <span key={phaseId} className="phase-badge">
                      {idx + 1}. {getPhaseName(phaseId)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="favorite-exercise-actions">
              <button
                className="btn-favorite-action btn-unfavorite"
                onClick={() => onToggleFavorite(exercise.id)}
                title="Remove from favorites"
              >
                ⭐
              </button>
              {currentPlayingExerciseId === exercise.id ? (
                <button
                  className="btn-favorite-action btn-stop-exercise"
                  onClick={onStopExercise}
                >
                  Stop
                </button>
              ) : (
                <button
                  className="btn-favorite-action btn-start-exercise"
                  onClick={() => onStartExercise(exercise.id)}
                  disabled={isPlayingExercise}
                >
                  Start
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FavoriteExercises
