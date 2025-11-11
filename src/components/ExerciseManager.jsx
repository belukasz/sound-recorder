import { useState } from 'react'
import './ExerciseManager.css'

function ExerciseManager({ phases, exercises, onCreateExercise, onDeleteExercise, onStartExercise, isPlayingExercise, onStopExercise }) {
  const [isCreating, setIsCreating] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')
  const [selectedPhases, setSelectedPhases] = useState([])
  const [repetitions, setRepetitions] = useState(1)

  const handleCreateExercise = () => {
    if (!newExerciseName.trim()) {
      alert('Please enter an exercise name')
      return
    }

    if (selectedPhases.length === 0) {
      alert('Please select at least one phase')
      return
    }

    if (repetitions < 1) {
      alert('Repetitions must be at least 1')
      return
    }

    onCreateExercise({
      id: Date.now(),
      name: newExerciseName.trim(),
      phaseIds: selectedPhases,
      repetitions: repetitions
    })

    // Reset form
    setNewExerciseName('')
    setSelectedPhases([])
    setRepetitions(1)
    setIsCreating(false)
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

  return (
    <div className="exercise-manager">
      <div className="exercise-header">
        <h2>Exercises</h2>
        <button
          className="btn-create-exercise"
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Cancel' : '+ Create Exercise'}
        </button>
      </div>

      {isCreating && (
        <div className="exercise-creator">
          <h3>Create New Exercise</h3>

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

            <button className="btn-save-exercise" onClick={handleCreateExercise}>
              Create Exercise
            </button>
          </div>
        </div>
      )}

      <div className="exercises-list">
        {exercises.length === 0 ? (
          <p className="no-exercises">No exercises created yet. Click "Create Exercise" to get started.</p>
        ) : (
          exercises.map(exercise => (
            <div key={exercise.id} className="exercise-item">
              <div className="exercise-info">
                <h4>{exercise.name}</h4>
                <div className="exercise-details">
                  <span className="exercise-stat">📋 {exercise.phaseIds.length} phases</span>
                  <span className="exercise-stat">🔄 {exercise.repetitions || 1}x repetitions</span>
                  <div className="exercise-phases-preview">
                    {exercise.phaseIds.map((phaseId, idx) => (
                      <span key={phaseId} className="phase-badge">
                        {idx + 1}. {getPhaseName(phaseId)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="exercise-actions">
                {isPlayingExercise ? (
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
                  >
                    Start
                  </button>
                )}
                <button
                  className="btn-exercise-action btn-delete-exercise"
                  onClick={() => onDeleteExercise(exercise.id)}
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

export default ExerciseManager
