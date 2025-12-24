import RecordingItem from './RecordingItem'
import './RecordingsList.css'

function RecordingsList({ recordings, onPlay, onDelete, onRename, onUpdateLabels }) {
  if (recordings.length === 0) {
    return (
      <div className="recordings-list">
        <div className="empty-state">
          No recordings yet. Start recording to create your first sound!
        </div>
      </div>
    )
  }

  return (
    <div className="recordings-list">
      {recordings.map(recording => (
        <RecordingItem
          key={recording.id}
          recording={recording}
          onPlay={onPlay}
          onDelete={onDelete}
          onRename={onRename}
          onUpdateLabels={onUpdateLabels}
        />
      ))}
    </div>
  )
}

export default RecordingsList
