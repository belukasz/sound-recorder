import './RecordingControls.css'

function RecordingControls({ isRecording, onStartRecording, onStopRecording }) {
  return (
    <div className="controls">
      <button
        className="btn btn-record"
        onClick={onStartRecording}
        disabled={isRecording}
      >
        Start Recording
      </button>
      <button
        className="btn btn-stop"
        onClick={onStopRecording}
        disabled={!isRecording}
      >
        Stop Recording
      </button>
    </div>
  )
}

export default RecordingControls
