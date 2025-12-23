import { useState } from 'react'
import './CollapsibleSection.css'

function CollapsibleSection({ title, children, defaultExpanded = true, summary }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="collapsible-section">
      <div
        className="collapsible-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="collapsible-header-content">
          <h2>{title}</h2>
          {!isExpanded && summary && (
            <div className="collapsible-summary">{summary}</div>
          )}
        </div>
        <span className="collapse-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  )
}

export default CollapsibleSection
