import RecordingItem from './RecordingItem'
import './RecordingsList.css'

function RecordingsList({ recordings, onPlay, onDelete, onRename }) {
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
      <h2>Recorded Sounds</h2>
      <div className="recordings-list">
        {recordings.map(recording => (
          <RecordingItem
            key={recording.id}
            recording={recording}
            onPlay={onPlay}
            onDelete={onDelete}
            onRename={onRename}
          />
        ))}
      </div>
    </div>
  )
}

export default RecordingsList
