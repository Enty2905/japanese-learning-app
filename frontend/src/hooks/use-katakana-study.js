import { useState } from 'react'

const MASTERED_STORAGE_KEY = 'masteredKatakana'

function readMasteredCharacters() {
  if (typeof window === 'undefined') {
    return new Set()
  }

  const storedValue = window.localStorage.getItem(MASTERED_STORAGE_KEY)
  if (!storedValue) {
    return new Set()
  }

  try {
    const parsedValue = JSON.parse(storedValue)

    return Array.isArray(parsedValue) ? new Set(parsedValue) : new Set()
  } catch {
    return new Set()
  }
}

function persistMasteredCharacters(masteredCharacters) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    MASTERED_STORAGE_KEY,
    JSON.stringify(Array.from(masteredCharacters)),
  )
}

export function useKatakanaStudy(characters) {
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [masteredCharacters, setMasteredCharacters] = useState(
    readMasteredCharacters,
  )

  const handleSelectCharacter = (character) => {
    setSelectedCharacter(character)
  }

  const handleToggleMastered = (character) => {
    setMasteredCharacters((previousState) => {
      const nextState = new Set(previousState)

      if (nextState.has(character)) {
        nextState.delete(character)
      } else {
        nextState.add(character)
      }

      persistMasteredCharacters(nextState)
      return nextState
    })
  }

  const masteredCount = masteredCharacters.size
  const progressPercent =
    characters.length > 0 ? (masteredCount / characters.length) * 100 : 0

  return {
    selectedCharacter,
    masteredCharacters,
    masteredCount,
    progressPercent,
    handleSelectCharacter,
    handleToggleMastered,
  }
}
