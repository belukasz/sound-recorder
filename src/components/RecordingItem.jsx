import { useState } from 'react'
import './RecordingItem.css'

function RecordingItem({ recording, onPlay, onDelete, onRename }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(recording.name)

  const handleSave = () => {
    if (editName.trim()) {
      onRename(recording.id, editName.trim())
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditName(recording.name)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="recording-item">
      <div className="recording-info">
        {isEditing ? (
          <input
            type="text"
            className="recording-name-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            autoFocus
          />
        ) : (
          <div
            className="recording-name"
            onClick={() => setIsEditing(true)}
            title="Click to rename"
          >
            {recording.name}
          </div>
        )}
        <div className="recording-time">{recording.timestamp}</div>
      </div>
      <div className="recording-controls">
        <button
          className="btn-small btn-play"
          onClick={() => onPlay(recording.id)}
        >
          Play
        </button>
        <button
          className="btn-small btn-delete"
          onClick={() => onDelete(recording.id)}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default RecordingItem
