import { useState } from 'react'
import * as db from '../utils/indexedDB'
import './DataManager.css'

function DataManager({ onDataImported }) {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const data = await db.exportAllData()

      // Create a blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sound-recorder-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert('Data exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting data: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      await db.importAllData(data)

      alert('Data imported successfully! Reloading...')
      window.location.reload() // Reload to refresh state
    } catch (error) {
      console.error('Import error:', error)
      alert('Error importing data: ' + error.message)
    } finally {
      setIsImporting(false)
      event.target.value = '' // Reset file input
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL recordings, phases, and exercises? This cannot be undone!')) {
      return
    }

    try {
      await db.clearAllData()
      alert('All data cleared! Reloading...')
      window.location.reload()
    } catch (error) {
      console.error('Clear error:', error)
      alert('Error clearing data: ' + error.message)
    }
  }

  return (
    <div className="data-manager">
      <div className="data-actions">
        <button
          className="btn-data btn-export"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : '📥 Export All Data'}
        </button>

        <label className="btn-data btn-import">
          {isImporting ? 'Importing...' : '📤 Import Data'}
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={isImporting}
            style={{ display: 'none' }}
          />
        </label>

        <button
          className="btn-data btn-clear"
          onClick={handleClearAll}
        >
          🗑️ Clear All Data
        </button>
      </div>

      <div className="data-info">
        <p>💡 Export your data to back up recordings, phases, and exercises</p>
        <p>📱 Import data to restore from a backup or transfer to another device</p>
      </div>
    </div>
  )
}

export default DataManager
