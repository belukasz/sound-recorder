import { useState } from 'react'
import './TrainingManager.css'

function TrainingManager({ exercises, trainings, onCreateTraining, onUpdateTraining, onDeleteTraining, onStartTraining, isPlayingExercise, currentPlayingTrainingId, onStopTraining }) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingTrainingId, setEditingTrainingId] = useState(null)
  const [newTrainingName, setNewTrainingName] = useState('')
  const [selectedExercises, setSelectedExercises] = useState([])

  const handleStartEdit = (training) => {
    setEditingTrainingId(training.id)
    setNewTrainingName(training.name)
    setSelectedExercises(training.exerciseIds || [])
    setIsCreating(false)
  }

  const handleCancelEdit = () => {
    setEditingTrainingId(null)
    setNewTrainingName('')
    setSelectedExercises([])
  }

  const handleSaveTraining = () => {
    if (!newTrainingName.trim()) {
      alert('Please enter a training name')
      return
    }

    if (selectedExercises.length === 0) {
      alert('Please select at least one exercise')
      return
    }

    const trainingData = {
      name: newTrainingName.trim(),
      exerciseIds: selectedExercises
    }

    if (editingTrainingId) {
      onUpdateTraining(editingTrainingId, trainingData)
      setEditingTrainingId(null)
    } else {
      onCreateTraining({
        id: Date.now(),
        ...trainingData
      })
      setIsCreating(false)
    }

    // Reset form
    setNewTrainingName('')
    setSelectedExercises([])
  }

  const toggleExerciseSelection = (exerciseId) => {
    setSelectedExercises(prev =>
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    )
  }

  const moveExerciseUp = (index) => {
    if (index > 0) {
      const newSelected = [...selectedExercises]
      const temp = newSelected[index]
      newSelected[index] = newSelected[index - 1]
      newSelected[index - 1] = temp
      setSelectedExercises(newSelected)
    }
  }

  const moveExerciseDown = (index) => {
    if (index < selectedExercises.length - 1) {
      const newSelected = [...selectedExercises]
      const temp = newSelected[index]
      newSelected[index] = newSelected[index + 1]
      newSelected[index + 1] = temp
      setSelectedExercises(newSelected)
    }
  }

  const getExerciseName = (exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId)
    return exercise ? exercise.name : 'Unknown Exercise'
  }

  const calculateTotalTime = (training) => {
    let totalSeconds = 0

    training.exerciseIds.forEach(exerciseId => {
      const exercise = exercises.find(e => e.id === exerciseId)
      if (!exercise) return

      if (exercise.type === 'timed') {
        totalSeconds += exercise.duration
      }
      // For phased exercises, we can't calculate exact time as it depends on recordings
      // We could estimate based on phases if needed
    })

    return totalSeconds
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const TrainingItem = ({ training }) => {
    const totalTime = calculateTotalTime(training)
    const hasTimedExercises = training.exerciseIds.some(id => {
      const ex = exercises.find(e => e.id === id)
      return ex && ex.type === 'timed'
    })

    return (
      <div className="training-item">
        <div className="training-info">
          <h4>{training.name}</h4>
          <div className="training-details">
            <span className="training-stat">🏋️ {training.exerciseIds.length} exercise{training.exerciseIds.length !== 1 ? 's' : ''}</span>
            {hasTimedExercises && totalTime > 0 && (
              <span className="training-stat">⏱️ {formatTime(totalTime)} (timed only)</span>
            )}
          </div>
          <div className="training-exercises-preview">
            {training.exerciseIds.map((exerciseId, idx) => (
              <span key={exerciseId} className="exercise-badge">
                {idx + 1}. {getExerciseName(exerciseId)}
              </span>
            ))}
          </div>
        </div>
        <div className="training-actions">
          {currentPlayingTrainingId === training.id ? (
            <button
              className="btn-training-action btn-stop-training"
              onClick={onStopTraining}
            >
              Stop
            </button>
          ) : (
            <button
              className="btn-training-action btn-start-training"
              onClick={() => onStartTraining(training.id)}
              disabled={isPlayingExercise}
            >
              Start
            </button>
          )}
          <button
            className="btn-training-action btn-edit"
            onClick={() => handleStartEdit(training)}
            disabled={isPlayingExercise}
          >
            Edit
          </button>
          <button
            className="btn-training-action btn-delete-training"
            onClick={() => onDeleteTraining(training.id)}
            disabled={isPlayingExercise}
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="training-manager">
      <div className="training-header">
        <button
          className="btn-create-training"
          onClick={() => {
            if (isCreating) {
              setIsCreating(false)
              setNewTrainingName('')
              setSelectedExercises([])
            } else {
              setIsCreating(true)
              setEditingTrainingId(null)
            }
          }}
        >
          {isCreating ? 'Cancel' : '+ Create Training'}
        </button>
      </div>

      {(isCreating || editingTrainingId) && (
        <div className="training-creator">
          <h3>{editingTrainingId ? 'Edit Training' : 'Create New Training'}</h3>

          <div className="training-form">
            <div className="form-group">
              <label>Training Name</label>
              <input
                type="text"
                placeholder="e.g., Full Body Workout, Morning Session"
                value={newTrainingName}
                onChange={(e) => setNewTrainingName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Select Exercises ({selectedExercises.length} selected)</label>
              <div className="exercises-selector">
                {exercises.length === 0 ? (
                  <p className="no-exercises-text">No exercises available. Create some exercises first.</p>
                ) : (
                  exercises.map(exercise => (
                    <label key={exercise.id} className="exercise-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedExercises.includes(exercise.id)}
                        onChange={() => toggleExerciseSelection(exercise.id)}
                      />
                      <span>{exercise.name}</span>
                      <span className="exercise-info-small">
                        ({exercise.type === 'timed'
                          ? `${exercise.duration}s`
                          : `${exercise.phaseIds?.length || 0} phases`})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {selectedExercises.length > 0 && (
              <div className="form-group">
                <label>Exercise Order (will execute in this order)</label>
                <div className="exercise-order-list">
                  {selectedExercises.map((exerciseId, index) => (
                    <div key={exerciseId} className="exercise-order-item">
                      <span className="exercise-order-number">{index + 1}.</span>
                      <span className="exercise-order-name">{getExerciseName(exerciseId)}</span>
                      <div className="exercise-order-controls">
                        <button
                          className="btn-order"
                          onClick={() => moveExerciseUp(index)}
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button
                          className="btn-order"
                          onClick={() => moveExerciseDown(index)}
                          disabled={index === selectedExercises.length - 1}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button className="btn-save-training" onClick={handleSaveTraining}>
                {editingTrainingId ? 'Save Changes' : 'Create Training'}
              </button>
              {editingTrainingId && (
                <button className="btn-cancel-edit" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="trainings-list">
        {trainings.length === 0 ? (
          <p className="no-trainings">No trainings created yet. Click "Create Training" to get started.</p>
        ) : (
          trainings.map(training => (
            <TrainingItem
              key={training.id}
              training={training}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default TrainingManager
