import { useState } from 'react'
import './RecordingItem.css'

function RecordingItem({ recording, onPlay, onDelete, onRename, onUpdateLabels }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(recording.name)
  const [isAddingLabel, setIsAddingLabel] = useState(false)
  const [newLabel, setNewLabel] = useState('')

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

  const handleAddLabel = () => {
    if (newLabel.trim()) {
      const currentLabels = recording.labels || []
      if (!currentLabels.includes(newLabel.trim())) {
        onUpdateLabels(recording.id, [...currentLabels, newLabel.trim()])
      }
      setNewLabel('')
      setIsAddingLabel(false)
    }
  }

  const handleRemoveLabel = (labelToRemove) => {
    const currentLabels = recording.labels || []
    onUpdateLabels(recording.id, currentLabels.filter(label => label !== labelToRemove))
  }

  const handleLabelKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddLabel()
    } else if (e.key === 'Escape') {
      setNewLabel('')
      setIsAddingLabel(false)
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

        <div className="recording-labels">
          {(recording.labels || []).map(label => (
            <span key={label} className="label-tag">
              {label}
              <button
                className="label-remove"
                onClick={() => handleRemoveLabel(label)}
                title="Remove label"
              >
                ×
              </button>
            </span>
          ))}
          {isAddingLabel ? (
            <input
              type="text"
              className="label-input"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={handleLabelKeyDown}
              onBlur={handleAddLabel}
              placeholder="Enter label..."
              autoFocus
            />
          ) : (
            <button
              className="btn-add-label"
              onClick={() => setIsAddingLabel(true)}
              title="Add label"
            >
              + Label
            </button>
          )}
        </div>
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
