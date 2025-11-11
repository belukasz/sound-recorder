// IndexedDB utility for persisting recordings, phases, and exercises

const DB_NAME = 'SoundRecorderDB'
const DB_VERSION = 1
const RECORDINGS_STORE = 'recordings'
const PHASES_STORE = 'phases'
const EXERCISES_STORE = 'exercises'

// Open database connection
export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Create recordings store
      if (!db.objectStoreNames.contains(RECORDINGS_STORE)) {
        db.createObjectStore(RECORDINGS_STORE, { keyPath: 'id' })
      }

      // Create phases store
      if (!db.objectStoreNames.contains(PHASES_STORE)) {
        db.createObjectStore(PHASES_STORE, { keyPath: 'id' })
      }

      // Create exercises store
      if (!db.objectStoreNames.contains(EXERCISES_STORE)) {
        db.createObjectStore(EXERCISES_STORE, { keyPath: 'id' })
      }
    }
  })
}

// Recordings operations
export const saveRecording = async (recording) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RECORDINGS_STORE], 'readwrite')
    const store = transaction.objectStore(RECORDINGS_STORE)

    // Store the recording with blob data
    const recordingData = {
      id: recording.id,
      name: recording.name,
      timestamp: recording.timestamp,
      blob: recording.blob
    }

    const request = store.put(recordingData)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const getAllRecordings = async () => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RECORDINGS_STORE], 'readonly')
    const store = transaction.objectStore(RECORDINGS_STORE)
    const request = store.getAll()

    request.onsuccess = () => {
      // Convert blobs back to URLs
      const recordings = request.result.map(rec => ({
        ...rec,
        url: URL.createObjectURL(rec.blob)
      }))
      resolve(recordings)
    }
    request.onerror = () => reject(request.error)
  })
}

export const deleteRecording = async (id) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RECORDINGS_STORE], 'readwrite')
    const store = transaction.objectStore(RECORDINGS_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Phases operations
export const savePhase = async (phase) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PHASES_STORE], 'readwrite')
    const store = transaction.objectStore(PHASES_STORE)
    const request = store.put(phase)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const getAllPhases = async () => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PHASES_STORE], 'readonly')
    const store = transaction.objectStore(PHASES_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const deletePhase = async (id) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PHASES_STORE], 'readwrite')
    const store = transaction.objectStore(PHASES_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Exercises operations
export const saveExercise = async (exercise) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EXERCISES_STORE], 'readwrite')
    const store = transaction.objectStore(EXERCISES_STORE)
    const request = store.put(exercise)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const getAllExercises = async () => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EXERCISES_STORE], 'readonly')
    const store = transaction.objectStore(EXERCISES_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const deleteExercise = async (id) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EXERCISES_STORE], 'readwrite')
    const store = transaction.objectStore(EXERCISES_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Export all data
export const exportAllData = async () => {
  const recordings = await getAllRecordings()
  const phases = await getAllPhases()
  const exercises = await getAllExercises()

  // Convert blobs to base64 for export
  const recordingsWithBase64 = await Promise.all(
    recordings.map(async (rec) => {
      const base64 = await blobToBase64(rec.blob)
      return {
        id: rec.id,
        name: rec.name,
        timestamp: rec.timestamp,
        audioData: base64
      }
    })
  )

  return {
    version: 1,
    exportDate: new Date().toISOString(),
    recordings: recordingsWithBase64,
    phases,
    exercises
  }
}

// Import all data
export const importAllData = async (data) => {
  if (!data.version || !data.recordings || !data.phases || !data.exercises) {
    throw new Error('Invalid data format')
  }

  // Clear existing data
  await clearAllData()

  // Import recordings (convert base64 back to blobs)
  for (const rec of data.recordings) {
    const blob = await base64ToBlob(rec.audioData)
    await saveRecording({
      id: rec.id,
      name: rec.name,
      timestamp: rec.timestamp,
      blob: blob
    })
  }

  // Import phases
  for (const phase of data.phases) {
    await savePhase(phase)
  }

  // Import exercises
  for (const exercise of data.exercises) {
    await saveExercise(exercise)
  }
}

// Clear all data
export const clearAllData = async () => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([RECORDINGS_STORE, PHASES_STORE, EXERCISES_STORE], 'readwrite')

    transaction.objectStore(RECORDINGS_STORE).clear()
    transaction.objectStore(PHASES_STORE).clear()
    transaction.objectStore(EXERCISES_STORE).clear()

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// Helper functions
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

const base64ToBlob = async (base64) => {
  const response = await fetch(base64)
  return response.blob()
}
