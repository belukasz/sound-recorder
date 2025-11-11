import './DelaySettings.css'

function DelaySettings({ minDelay, maxDelay, onMinDelayChange, onMaxDelayChange }) {
  return (
    <div className="delay-settings">
      <div className="delay-input-group">
        <label htmlFor="minDelay">Initial Delay (seconds)</label>
        <input
          id="minDelay"
          type="number"
          min="0"
          step="0.5"
          value={minDelay}
          onChange={(e) => onMinDelayChange(parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="delay-input-group">
        <label htmlFor="maxDelay">Maximum Delay (seconds)</label>
        <input
          id="maxDelay"
          type="number"
          min="0"
          step="0.5"
          value={maxDelay}
          onChange={(e) => onMaxDelayChange(parseFloat(e.target.value) || 0)}
        />
      </div>
    </div>
  )
}

export default DelaySettings
