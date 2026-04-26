import { CheckIcon, LanguagesIcon, VolumeIcon } from './hiragana-icons'

export function HiraganaCharacterDetail({
  selectedCharacter,
  masteredCharacters,
  onToggleMastered,
  onPlaySound,
}) {
  if (!selectedCharacter) {
    return (
      <aside className="hiragana-card hiragana-detail-card">
        <div className="hiragana-detail-empty">
          <LanguagesIcon className="hiragana-detail-empty-icon" />
          <p>Select a character to see details</p>
        </div>
      </aside>
    )
  }

  const isMastered = masteredCharacters.has(selectedCharacter.character)

  return (
    <aside className="hiragana-card hiragana-detail-card">
      <div className="hiragana-detail-body">
        <header className="hiragana-detail-header">
          <div className="hiragana-detail-character">{selectedCharacter.character}</div>
          <div className="hiragana-detail-romaji">{selectedCharacter.romaji}</div>
        </header>

        <div className="hiragana-detail-actions">
          <button
            type="button"
            className="hiragana-action-btn hiragana-action-btn--play"
            onClick={onPlaySound}
          >
            <VolumeIcon className="hiragana-action-icon" />
            Play Sound
          </button>

          <button
            type="button"
            className={`hiragana-action-btn hiragana-action-btn--master${
              isMastered ? ' is-active' : ''
            }`}
            onClick={() => onToggleMastered(selectedCharacter.character)}
          >
            <CheckIcon className="hiragana-action-icon" />
            {isMastered ? 'Mastered' : 'Mark as Mastered'}
          </button>
        </div>

        <section className="hiragana-writing-tips">
          <h3>Writing Tips</h3>
          <p>
            Practice writing this character by following the stroke order. Write
            it multiple times to build muscle memory.
          </p>
        </section>
      </div>
    </aside>
  )
}
