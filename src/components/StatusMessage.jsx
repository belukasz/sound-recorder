import './StatusMessage.css'

function StatusMessage({ message, type }) {
  if (!message) return <div className="status"></div>

  return (
    <div className={`status ${type}`}>
      {message}
    </div>
  )
}

export default StatusMessage
