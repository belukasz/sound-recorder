import { useState } from 'react'
import './PhaseManager.css'

function PhaseManager({ recordings, phases, onCreatePhase, onDeletePhase, onUpdatePhase, onStartPhase, isPlayingExercise, onStopExercise }) {
  const [isCreating, setIsCreating] = useState(false)
  const [newPhaseName, setNewPhaseName] = useState('')
  const [newPhaseType, setNewPhaseType] = useState('random')
  const [newPhaseMinDelay, setNewPhaseMinDelay] = useState(1)
  const [newPhaseMaxDelay, setNewPhaseMaxDelay] = useState(3)
  const [soundRepetitions, setSoundRepetitions] = useState(1)
  const [selectedRecordings, setSelectedRecordings] = useState([])
  const [exactTimings, setExactTimings] = useState({}) // { recordingId: "1,2,3" }

  const handleCreatePhase = () => {
    if (!newPhaseName.trim()) {
      alert('Please enter a phase name')
      return
    }

    if (selectedRecordings.length === 0) {
      alert('Please select at least one recording')
      return
    }

    // Validate exact timings if exact timing type is selected
    if (newPhaseType === 'exactTiming') {
      for (const recordingId of selectedRecordings) {
        const timings = exactTimings[recordingId]
        if (!timings || !timings.trim()) {
          alert('Please specify timings for all selected recordings')
          return
        }
        // Validate that timings are valid numbers
        const timingArray = timings.split(',').map(t => parseFloat(t.trim())).filter(t => !isNaN(t) && t >= 0)
        if (timingArray.length === 0) {
          alert('Please enter valid timing values (comma-separated numbers)')
          return
        }
      }
    }

    onCreatePhase({
      id: Date.now(),
      name: newPhaseName.trim(),
      type: newPhaseType,
      minDelay: newPhaseMinDelay,
      maxDelay: newPhaseMaxDelay,
      soundRepetitions: soundRepetitions,
      recordingIds: selectedRecordings,
      exactTimings: newPhaseType === 'exactTiming' ? exactTimings : undefined
    })

    // Reset form
    setNewPhaseName('')
    setNewPhaseType('random')
    setNewPhaseMinDelay(1)
    setNewPhaseMaxDelay(3)
    setSoundRepetitions(1)
    setSelectedRecordings([])
    setExactTimings({})
    setIsCreating(false)
  }

  const toggleRecordingSelection = (recordingId) => {
    setSelectedRecordings(prev => {
      const newSelected = prev.includes(recordingId)
        ? prev.filter(id => id !== recordingId)
        : [...prev, recordingId]

      // Clean up exact timings if deselecting
      if (!newSelected.includes(recordingId)) {
        setExactTimings(prevTimings => {
          const newTimings = { ...prevTimings }
          delete newTimings[recordingId]
          return newTimings
        })
      }

      return newSelected
    })
  }

  const handleTimingChange = (recordingId, value) => {
    setExactTimings(prev => ({
      ...prev,
      [recordingId]: value
    }))
  }

  return (
    <div className="phase-manager">
      <div className="phase-header">
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

            <div className="form-group">
              <label>Phase Type</label>
              <select
                value={newPhaseType}
                onChange={(e) => setNewPhaseType(e.target.value)}
              >
                <option value="random">Random Timing</option>
                <option value="roundRobin">Round Robin</option>
                <option value="exactTiming">Exact Timing</option>
              </select>
            </div>

            {newPhaseType === 'roundRobin' && (
              <div className="form-group">
                <label>Sound Repetitions (how many times each sound plays before moving to next)</label>
                <input
                  type="number"
                  min="1"
                  value={soundRepetitions}
                  onChange={(e) => setSoundRepetitions(parseInt(e.target.value) || 1)}
                  placeholder="e.g., 2 for A-A-B-B-C-C"
                />
              </div>
            )}

            {newPhaseType !== 'exactTiming' && (
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
            )}

            <div className="form-group">
              <label>
                {newPhaseType === 'exactTiming'
                  ? 'Select Recordings and Set Timings'
                  : `Select Recordings (${selectedRecordings.length} selected)`}
              </label>
              <div className="recordings-selector">
                {recordings.length === 0 ? (
                  <p className="no-recordings">No recordings available. Create some recordings first.</p>
                ) : newPhaseType === 'exactTiming' ? (
                  recordings.map(recording => (
                    <div key={recording.id} className="exact-timing-item">
                      <label className="recording-checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedRecordings.includes(recording.id)}
                          onChange={() => toggleRecordingSelection(recording.id)}
                        />
                        <span>{recording.name}</span>
                      </label>
                      {selectedRecordings.includes(recording.id) && (
                        <input
                          type="text"
                          className="timing-input"
                          placeholder="e.g., 1, 2, 3"
                          value={exactTimings[recording.id] || ''}
                          onChange={(e) => handleTimingChange(recording.id, e.target.value)}
                        />
                      )}
                    </div>
                  ))
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
                  {phase.type === 'exactTiming' ? (
                    <span className="phase-stat">⏱️ Exact Timing (Random)</span>
                  ) : (
                    <>
                      <span className="phase-stat">⏱️ {phase.minDelay}s - {phase.maxDelay}s</span>
                      <span className="phase-stat">🔀 {phase.type === 'roundRobin' ? 'Round Robin' : 'Random Timing'}</span>
                      {phase.type === 'roundRobin' && phase.soundRepetitions > 1 && (
                        <span className="phase-stat">🔁 {phase.soundRepetitions}x per sound</span>
                      )}
                    </>
                  )}
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
