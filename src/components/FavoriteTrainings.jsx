import './FavoriteTrainings.css'

function FavoriteTrainings({ exercises, trainings, onStartTraining, onToggleFavorite, isPlayingExercise, currentPlayingTrainingId, onStopTraining }) {
  const favoriteTrainings = trainings.filter(t => t.isFavorite)

  if (favoriteTrainings.length === 0) {
    return null
  }

  const getExerciseName = (exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId)
    return exercise ? exercise.name : 'Unknown Exercise'
  }

  const calculateTotalTime = (training) => {
    let totalSeconds = 0

    training.exerciseIds.forEach(exerciseId => {
      const exercise = exercises.find(e => e.id === exerciseId)
      if (!exercise) return

      if (exercise.type === 'timed') {
        totalSeconds += exercise.duration
      }
    })

    return totalSeconds
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="favorite-trainings-section">
      <h2 className="favorite-trainings-title">⭐ Favorite Trainings</h2>
      <div className="favorite-trainings-list">
        {favoriteTrainings.map(training => {
          const totalTime = calculateTotalTime(training)
          const hasTimedExercises = training.exerciseIds.some(id => {
            const ex = exercises.find(e => e.id === id)
            return ex && ex.type === 'timed'
          })

          return (
            <div key={training.id} className="favorite-training-item">
              <div className="favorite-training-info">
                <h4>{training.name}</h4>
                <div className="favorite-training-details">
                  <span className="favorite-training-stat">🏋️ {training.exerciseIds.length} exercise{training.exerciseIds.length !== 1 ? 's' : ''}</span>
                  {hasTimedExercises && totalTime > 0 && (
                    <span className="favorite-training-stat">⏱️ {formatTime(totalTime)} (timed only)</span>
                  )}
                </div>
                <div className="favorite-training-exercises-preview">
                  {training.exerciseIds.map((exerciseId, idx) => (
                    <span key={exerciseId} className="favorite-exercise-badge">
                      {idx + 1}. {getExerciseName(exerciseId)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="favorite-training-actions">
                <button
                  className={`btn-favorite-training-action btn-favorite-star ${training.isFavorite ? 'is-favorite' : ''}`}
                  onClick={() => onToggleFavorite(training.id)}
                  title="Remove from favorites"
                >
                  ⭐
                </button>
                {currentPlayingTrainingId === training.id ? (
                  <button
                    className="btn-favorite-training-action btn-stop-training"
                    onClick={onStopTraining}
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    className="btn-favorite-training-action btn-start-training"
                    onClick={() => onStartTraining(training.id)}
                    disabled={isPlayingExercise}
                  >
                    Start
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FavoriteTrainings
