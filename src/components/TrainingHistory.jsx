import './TrainingHistory.css'

function TrainingHistory({ trainingHistory, trainings, onDeleteHistory }) {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  const getDateKey = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Group history entries by date and training
  const groupedHistory = trainingHistory.reduce((acc, entry) => {
    const dateKey = getDateKey(entry.completedAt)
    const trainingName = getTrainingName(entry.trainingId)
    const key = `${dateKey}_${entry.trainingId}`

    if (!acc[key]) {
      acc[key] = {
        date: dateKey,
        trainingId: entry.trainingId,
        trainingName: trainingName,
        count: 0,
        totalDuration: 0,
        exerciseCount: entry.exerciseCount || 0,
        entries: []
      }
    }

    acc[key].count += 1
    acc[key].totalDuration += entry.duration
    acc[key].entries.push(entry)

    return acc
  }, {})

  // Convert to array and sort by date (most recent first)
  const groupedArray = Object.values(groupedHistory).sort((a, b) => {
    const dateA = new Date(a.entries[0].completedAt)
    const dateB = new Date(b.entries[0].completedAt)
    return dateB - dateA
  })

  return (
    <div className="training-history">
      {trainingHistory.length === 0 ? (
        <p className="no-history">No training sessions completed yet. Start a training to build your history!</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Training</th>
              <th>Count</th>
              <th>Total Duration</th>
              <th>Exercises</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedArray.map(group => (
              <tr key={`${group.date}_${group.trainingId}`}>
                <td>{group.date}</td>
                <td>{group.trainingName}</td>
                <td>{group.count}x</td>
                <td>{formatDuration(group.totalDuration)}</td>
                <td>{group.exerciseCount}</td>
                <td>
                  <button
                    className="btn-delete-history"
                    onClick={() => {
                      // Delete all entries for this group
                      group.entries.forEach(entry => onDeleteHistory(entry.id))
                    }}
                    title="Delete all sessions from this day"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default TrainingHistory
