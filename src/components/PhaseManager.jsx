import { useState } from 'react'
import './PhaseManager.css'

function PhaseManager({ recordings, phases, onCreatePhase, onDeletePhase, onUpdatePhase, onStartPhase, isPlayingExercise, onStopExercise }) {
  const [isCreating, setIsCreating] = useState(false)
  const [newPhaseName, setNewPhaseName] = useState('')
  const [newPhaseMinDelay, setNewPhaseMinDelay] = useState(1)
  const [newPhaseMaxDelay, setNewPhaseMaxDelay] = useState(3)
  const [selectedRecordings, setSelectedRecordings] = useState([])

  const handleCreatePhase = () => {
    if (!newPhaseName.trim()) {
      alert('Please enter a phase name')
      return
    }

    if (selectedRecordings.length === 0) {
      alert('Please select at least one recording')
      return
    }

    onCreatePhase({
      id: Date.now(),
      name: newPhaseName.trim(),
      minDelay: newPhaseMinDelay,
      maxDelay: newPhaseMaxDelay,
      recordingIds: selectedRecordings
    })

    // Reset form
    setNewPhaseName('')
    setNewPhaseMinDelay(1)
    setNewPhaseMaxDelay(3)
    setSelectedRecordings([])
    setIsCreating(false)
  }

  const toggleRecordingSelection = (recordingId) => {
    setSelectedRecordings(prev =>
      prev.includes(recordingId)
        ? prev.filter(id => id !== recordingId)
        : [...prev, recordingId]
    )
  }

  return (
    <div className="phase-manager">
      <div className="phase-header">
        <h2>Exercise Phases</h2>
        <button
          className="btn-create-phase"
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Cancel' : '+ Create Phase'}
        </button>
      </div>

      {isCreating && (
        <div className="phase-creator">
          <h3>Create New Phase</h3>

          <div className="phase-form">
            <div className="form-group">
              <label>Phase Name</label>
              <input
                type="text"
                placeholder="e.g., Warm Up, Main Exercise"
                value={newPhaseName}
                onChange={(e) => setNewPhaseName(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Initial Delay (seconds)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newPhaseMinDelay}
                  onChange={(e) => setNewPhaseMinDelay(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label>Maximum Delay (seconds)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newPhaseMaxDelay}
                  onChange={(e) => setNewPhaseMaxDelay(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Select Recordings ({selectedRecordings.length} selected)</label>
              <div className="recordings-selector">
                {recordings.length === 0 ? (
                  <p className="no-recordings">No recordings available. Create some recordings first.</p>
                ) : (
                  recordings.map(recording => (
                    <label key={recording.id} className="recording-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedRecordings.includes(recording.id)}
                        onChange={() => toggleRecordingSelection(recording.id)}
                      />
                      <span>{recording.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <button className="btn-save-phase" onClick={handleCreatePhase}>
              Create Phase
            </button>
          </div>
        </div>
      )}

      <div className="phases-list">
        {phases.length === 0 ? (
          <p className="no-phases">No phases created yet. Click "Create Phase" to get started.</p>
        ) : (
          phases.map(phase => (
            <div key={phase.id} className="phase-item">
              <div className="phase-info">
                <h4>{phase.name}</h4>
                <div className="phase-details">
                  <span className="phase-stat">🎵 {phase.recordingIds.length} recordings</span>
                  <span className="phase-stat">⏱️ {phase.minDelay}s - {phase.maxDelay}s</span>
                </div>
              </div>
              <div className="phase-actions">
                {isPlayingExercise ? (
                  <button
                    className="btn-phase-action btn-stop-phase"
                    onClick={onStopExercise}
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    className="btn-phase-action btn-start"
                    onClick={() => onStartPhase(phase.id)}
                  >
                    Start
                  </button>
                )}
                <button
                  className="btn-phase-action btn-delete-phase"
                  onClick={() => onDeletePhase(phase.id)}
                  disabled={isPlayingExercise}
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

export default PhaseManager
