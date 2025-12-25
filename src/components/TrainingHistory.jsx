import './TrainingHistory.css'

function TrainingHistory({ trainingHistory, trainings, onDeleteHistory }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  const getTrainingName = (trainingId) => {
    const training = trainings.find(t => t.id === trainingId)
    return training ? training.name : 'Deleted Training'
  }

  return (
    <div className="training-history">
      <div className="history-list">
        {trainingHistory.length === 0 ? (
          <p className="no-history">No training sessions completed yet. Start a training to build your history!</p>
        ) : (
          trainingHistory.map(entry => (
            <div key={entry.id} className="history-item">
              <div className="history-info">
                <h4>{getTrainingName(entry.trainingId)}</h4>
                <div className="history-details">
                  <span className="history-stat">📅 {formatDate(entry.completedAt)}</span>
                  <span className="history-stat">⏱️ {formatDuration(entry.duration)}</span>
                  {entry.exerciseCount && (
                    <span className="history-stat">🏋️ {entry.exerciseCount} exercises</span>
                  )}
                </div>
              </div>
              <div className="history-actions">
                <button
                  className="btn-history-action btn-delete-history"
                  onClick={() => onDeleteHistory(entry.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TrainingHistory
