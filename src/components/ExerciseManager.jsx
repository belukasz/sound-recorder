import { useState } from 'react'
import './ExerciseManager.css'

function ExerciseManager({ phases, exercises, recordings, onCreateExercise, onUpdateExercise, onDeleteExercise, onStartExercise, onToggleFavorite, isPlayingExercise, currentPlayingExerciseId, onStopExercise }) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingExerciseId, setEditingExerciseId] = useState(null)
  const [exerciseType, setExerciseType] = useState('phased')
  const [newExerciseName, setNewExerciseName] = useState('')
  const [selectedPhases, setSelectedPhases] = useState([])
  const [repetitions, setRepetitions] = useState(1)
  // Timed exercise fields
  const [duration, setDuration] = useState(60)
  const [startRecordingId, setStartRecordingId] = useState(null)
  const [endRecordingId, setEndRecordingId] = useState(null)
  const [recordingLabelFilter, setRecordingLabelFilter] = useState('')

  const handleStartEdit = (exercise) => {
    setEditingExerciseId(exercise.id)
    setExerciseType(exercise.type)
    setNewExerciseName(exercise.name)

    if (exercise.type === 'phased') {
      setSelectedPhases(exercise.phaseIds || [])
      setRepetitions(exercise.repetitions || 1)
      setStartRecordingId(exercise.startRecordingId || null)
      setEndRecordingId(exercise.endRecordingId || null)
    } else {
      setDuration(exercise.duration || 60)
      setStartRecordingId(exercise.startRecordingId || null)
      setEndRecordingId(exercise.endRecordingId || null)
    }

    setIsCreating(false)
  }

  const handleCancelEdit = () => {
    setEditingExerciseId(null)
    setExerciseType('phased')
    setNewExerciseName('')
    setSelectedPhases([])
    setRepetitions(1)
    setDuration(60)
    setStartRecordingId(null)
    setEndRecordingId(null)
    setRecordingLabelFilter('')
  }

  const handleSaveExercise = () => {
    if (!newExerciseName.trim()) {
      alert('Please enter an exercise name')
      return
    }

    let exerciseData

    if (exerciseType === 'phased') {
      if (selectedPhases.length === 0) {
        alert('Please select at least one phase')
        return
      }

      if (repetitions < 1) {
        alert('Repetitions must be at least 1')
        return
      }

      exerciseData = {
        type: 'phased',
        name: newExerciseName.trim(),
        phaseIds: selectedPhases,
        repetitions: repetitions,
        startRecordingId: startRecordingId,
        endRecordingId: endRecordingId
      }
    } else {
      // Timed exercise
      if (duration < 1) {
        alert('Duration must be at least 1 second')
        return
      }

      exerciseData = {
        type: 'timed',
        name: newExerciseName.trim(),
        duration: duration,
        startRecordingId: startRecordingId,
        endRecordingId: endRecordingId
      }
    }

    if (editingExerciseId) {
      onUpdateExercise(editingExerciseId, exerciseData)
      setEditingExerciseId(null)
    } else {
      onCreateExercise({
        id: Date.now(),
        ...exerciseData
      })
      setIsCreating(false)
    }

    // Reset form
    setExerciseType('phased')
    setNewExerciseName('')
    setSelectedPhases([])
    setRepetitions(1)
    setDuration(60)
    setStartRecordingId(null)
    setEndRecordingId(null)
    setRecordingLabelFilter('')
  }

  const togglePhaseSelection = (phaseId) => {
    setSelectedPhases(prev =>
      prev.includes(phaseId)
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    )
  }

  const movePhaseUp = (index) => {
    if (index > 0) {
      const newSelectedPhases = [...selectedPhases]
      const temp = newSelectedPhases[index]
      newSelectedPhases[index] = newSelectedPhases[index - 1]
      newSelectedPhases[index - 1] = temp
      setSelectedPhases(newSelectedPhases)
    }
  }

  const movePhaseDown = (index) => {
    if (index < selectedPhases.length - 1) {
      const newSelectedPhases = [...selectedPhases]
      const temp = newSelectedPhases[index]
      newSelectedPhases[index] = newSelectedPhases[index + 1]
      newSelectedPhases[index + 1] = temp
      setSelectedPhases(newSelectedPhases)
    }
  }

  const getPhaseName = (phaseId) => {
    const phase = phases.find(p => p.id === phaseId)
    return phase ? phase.name : 'Unknown Phase'
  }

  // Get all unique labels from recordings
  const allLabels = [...new Set(recordings.flatMap(r => r.labels || []))].sort()

  // Filter recordings by selected label for timed exercise
  const filteredTimedRecordings = recordingLabelFilter
    ? recordings.filter(r => (r.labels || []).includes(recordingLabelFilter))
    : recordings

  // Filter recordings by selected label for phased exercise
  const filteredPhasedRecordings = recordingLabelFilter
    ? recordings.filter(r => (r.labels || []).includes(recordingLabelFilter))
    : recordings

  const ExerciseItem = ({ exercise, getPhaseName, onStartExercise, onToggleFavorite, onDeleteExercise, onStartEdit, isPlayingExercise, currentPlayingExerciseId, onStopExercise }) => (
    <div key={exercise.id} className="exercise-item">
      <div className="exercise-info">
        <h4>{exercise.name}</h4>
        <div className="exercise-details">
          {exercise.type === 'timed' ? (
            <>
              <span className="exercise-stat">⏱️ {exercise.duration} seconds</span>
              {exercise.startRecordingId && (
                <span className="exercise-stat">▶️ Start sound</span>
              )}
              {exercise.endRecordingId && (
                <span className="exercise-stat">⏹️ End sound</span>
              )}
            </>
          ) : (
            <>
              <span className="exercise-stat">📋 {exercise.phaseIds?.length || 0} phases</span>
              <span className="exercise-stat">🔄 {exercise.repetitions || 1}x repetitions</span>
              {exercise.startRecordingId && (
                <span className="exercise-stat">▶️ Start sound</span>
              )}
              {exercise.endRecordingId && (
                <span className="exercise-stat">⏹️ End sound</span>
              )}
              {exercise.phaseIds && (
                <div className="exercise-phases-preview">
                  {exercise.phaseIds.map((phaseId, idx) => (
                    <span key={phaseId} className="phase-badge">
                      {idx + 1}. {getPhaseName(phaseId)}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="exercise-actions">
        <button
          className={`btn-exercise-action btn-favorite ${exercise.isFavorite ? 'is-favorite' : ''}`}
          onClick={() => onToggleFavorite(exercise.id)}
          title={exercise.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {exercise.isFavorite ? '⭐' : '☆'}
        </button>
        {currentPlayingExerciseId === exercise.id ? (
          <button
            className="btn-exercise-action btn-stop-exercise"
            onClick={onStopExercise}
          >
            Stop
          </button>
        ) : (
          <button
            className="btn-exercise-action btn-start-exercise"
            onClick={() => onStartExercise(exercise.id)}
            disabled={isPlayingExercise}
          >
            Start
          </button>
        )}
        <button
          className="btn-exercise-action btn-edit"
          onClick={() => onStartEdit(exercise)}
          disabled={isPlayingExercise}
        >
          Edit
        </button>
        <button
          className="btn-exercise-action btn-delete-exercise"
          onClick={() => onDeleteExercise(exercise.id)}
          disabled={isPlayingExercise}
        >
          Delete
        </button>
      </div>
    </div>
  )

  return (
    <div className="exercise-manager">
      <div className="exercise-header">
        <button
          className="btn-create-exercise"
          onClick={() => {
            if (isCreating) {
              setIsCreating(false)
              setExerciseType('phased')
              setNewExerciseName('')
              setSelectedPhases([])
              setRepetitions(1)
              setDuration(60)
              setStartRecordingId(null)
              setEndRecordingId(null)
              setRecordingLabelFilter('')
            } else {
              setIsCreating(true)
              setEditingExerciseId(null)
            }
          }}
        >
          {isCreating ? 'Cancel' : '+ Create Exercise'}
        </button>
      </div>

      {(isCreating || editingExerciseId) && (
        <div className="exercise-creator">
          <h3>{editingExerciseId ? 'Edit Exercise' : 'Create New Exercise'}</h3>

          <div className="exercise-form">
            <div className="form-group">
              <label>Exercise Name</label>
              <input
                type="text"
                placeholder="e.g., Full Workout, Morning Routine"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Exercise Type</label>
              <select
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value)}
              >
                <option value="phased">Phased (Multiple phases in sequence)</option>
                <option value="timed">Timed (Fixed duration with countdown)</option>
              </select>
            </div>

            {exerciseType === 'phased' ? (
              <>
                <div className="form-group">
                  <label>Repetitions</label>
                  <input
                    type="number"
                    min="1"
                    value={repetitions}
                    onChange={(e) => setRepetitions(parseInt(e.target.value) || 1)}
                    placeholder="How many times to repeat the exercise"
                  />
                </div>

                <div className="form-group">
                  <label>Select Phases ({selectedPhases.length} selected)</label>
              <div className="phases-selector">
                {phases.length === 0 ? (
                  <p className="no-phases-text">No phases available. Create some phases first.</p>
                ) : (
                  phases.map(phase => (
                    <label key={phase.id} className="phase-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedPhases.includes(phase.id)}
                        onChange={() => togglePhaseSelection(phase.id)}
                      />
                      <span>{phase.name}</span>
                      <span className="phase-info-small">({phase.recordingIds.length} recordings, {phase.minDelay}s-{phase.maxDelay}s)</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {selectedPhases.length > 0 && (
              <div className="form-group">
                <label>Phase Order (will play in this order)</label>
                <div className="phase-order-list">
                  {selectedPhases.map((phaseId, index) => (
                    <div key={phaseId} className="phase-order-item">
                      <span className="phase-order-number">{index + 1}.</span>
                      <span className="phase-order-name">{getPhaseName(phaseId)}</span>
                      <div className="phase-order-controls">
                        <button
                          className="btn-order"
                          onClick={() => movePhaseUp(index)}
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button
                          className="btn-order"
                          onClick={() => movePhaseDown(index)}
                          disabled={index === selectedPhases.length - 1}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allLabels.length > 0 && (
              <div className="form-group">
                <label>Filter recordings by label (optional)</label>
                <select
                  value={recordingLabelFilter}
                  onChange={(e) => setRecordingLabelFilter(e.target.value)}
                  className="label-filter-select"
                >
                  <option value="">All recordings</option>
                  {allLabels.map(label => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Start Recording (optional - plays before exercise starts)</label>
              <select
                value={startRecordingId || ''}
                onChange={(e) => setStartRecordingId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">No start recording</option>
                {filteredPhasedRecordings.map(recording => (
                  <option key={recording.id} value={recording.id}>
                    {recording.name}
                    {recording.labels && recording.labels.length > 0 ? ` [${recording.labels.join(', ')}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>End Recording (optional - plays after exercise completes)</label>
              <select
                value={endRecordingId || ''}
                onChange={(e) => setEndRecordingId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">No end recording</option>
                {filteredPhasedRecordings.map(recording => (
                  <option key={recording.id} value={recording.id}>
                    {recording.name}
                    {recording.labels && recording.labels.length > 0 ? ` [${recording.labels.join(', ')}]` : ''}
                  </option>
                ))}
              </select>
            </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Duration (seconds)</label>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                    placeholder="Duration in seconds"
                  />
                </div>

                {allRecordingLabels.length > 0 && (
                  <div className="form-group">
                    <label>Filter Recordings by Label</label>
                    <div className="label-filter">
                      <select
                        value={recordingLabelFilter}
                        onChange={(e) => setRecordingLabelFilter(e.target.value)}
                        className="label-filter-select"
                      >
                        <option value="">All recordings</option>
                        {allRecordingLabels.map(label => (
                          <option key={label} value={label}>{label}</option>
                        ))}
                      </select>
                      {recordingLabelFilter && (
                        <button
                          className="btn-clear-filter"
                          onClick={() => setRecordingLabelFilter('')}
                          title="Clear filter"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Start Recording (optional)</label>
                  <select
                    value={startRecordingId || ''}
                    onChange={(e) => setStartRecordingId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">No recording</option>
                    {filteredTimedRecordings.map(recording => (
                      <option key={recording.id} value={recording.id}>
                        {recording.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>End Recording (optional)</label>
                  <select
                    value={endRecordingId || ''}
                    onChange={(e) => setEndRecordingId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">No recording</option>
                    {filteredTimedRecordings.map(recording => (
                      <option key={recording.id} value={recording.id}>
                        {recording.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="form-actions">
              <button className="btn-save-exercise" onClick={handleSaveExercise}>
                {editingExerciseId ? 'Save Changes' : 'Create Exercise'}
              </button>
              {editingExerciseId && (
                <button className="btn-cancel-edit" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="exercises-list">
        {exercises.length === 0 ? (
          <p className="no-exercises">No exercises created yet. Click "Create Exercise" to get started.</p>
        ) : (
          exercises.map(exercise => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              phases={phases}
              getPhaseName={getPhaseName}
              onStartExercise={onStartExercise}
              onToggleFavorite={onToggleFavorite}
              onDeleteExercise={onDeleteExercise}
              onStartEdit={handleStartEdit}
              isPlayingExercise={isPlayingExercise}
              currentPlayingExerciseId={currentPlayingExerciseId}
              onStopExercise={onStopExercise}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default ExerciseManager
