import RecordingItem from './RecordingItem'
import './RecordingsList.css'

function RecordingsList({
  recordings,
  selectedRecordings,
  isPlayingExercise,
  onPlay,
  onDelete,
  onRename,
  onToggleSelection,
  onPlayExercise,
  onStopExercise
}) {
  if (recordings.length === 0) {
    return (
      <div className="recordings-section">
        <h2>Recorded Sounds</h2>
        <div className="recordings-list">
          <div className="empty-state">
            No recordings yet. Start recording to create your first sound!
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="recordings-section">
      <div className="recordings-header">
        <h2>Recorded Sounds</h2>
        <div className="exercise-controls">
          {selectedRecordings.length > 0 && (
            <span className="selected-count">
              {selectedRecordings.length} selected
            </span>
          )}
          {isPlayingExercise ? (
            <button className="btn-exercise btn-stop-exercise" onClick={onStopExercise}>
              Stop Exercise
            </button>
          ) : (
            <button
              className="btn-exercise"
              onClick={onPlayExercise}
              disabled={selectedRecordings.length === 0}
            >
              Exercise
            </button>
          )}
        </div>
      </div>
      <div className="recordings-list">
        {recordings.map(recording => (
          <RecordingItem
            key={recording.id}
            recording={recording}
            isSelected={selectedRecordings.includes(recording.id)}
            onPlay={onPlay}
            onDelete={onDelete}
            onRename={onRename}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>
    </div>
  )
}

export default RecordingsList
