import { CheckIcon, LanguagesIcon, VolumeIcon } from '../hiragana/hiragana-icons'
import { katakanaExampleWordsByCharacter } from '../../data/japanese-data'

export function KatakanaCharacterDetail({
  selectedCharacter,
  masteredCharacters,
  onToggleMastered,
  onPlaySound,
}) {
  if (!selectedCharacter) {
    return (
      <aside className="katakana-card katakana-detail-card">
        <div className="katakana-detail-empty">
          <LanguagesIcon className="katakana-detail-empty-icon" />
          <p>Select a character to see details</p>
        </div>
      </aside>
    )
  }

  const isMastered = masteredCharacters.has(selectedCharacter.character)
  const exampleWords =
    katakanaExampleWordsByCharacter[selectedCharacter.character] || []

  return (
    <aside className="katakana-card katakana-detail-card">
      <div className="katakana-detail-body">
        <header className="katakana-detail-header">
          <div className="katakana-detail-character">{selectedCharacter.character}</div>
          <div className="katakana-detail-romaji">{selectedCharacter.romaji}</div>
        </header>

        <div className="katakana-detail-actions">
          <button
            type="button"
            className="katakana-action-btn katakana-action-btn--play"
            onClick={onPlaySound}
          >
            <VolumeIcon className="katakana-action-icon" />
            Play Sound
          </button>

          <button
            type="button"
            className={`katakana-action-btn katakana-action-btn--master${
              isMastered ? ' is-active' : ''
            }`}
            onClick={() => onToggleMastered(selectedCharacter.character)}
          >
            <CheckIcon className="katakana-action-icon" />
            {isMastered ? 'Mastered' : 'Mark as Mastered'}
          </button>
        </div>

        <section className="katakana-detail-section">
          <h3>Common Usage</h3>
          <p>
            Katakana is primarily used for foreign loanwords, onomatopoeia, and
            emphasis similar to italics in English.
          </p>
        </section>

        <section className="katakana-detail-section">
          <h3>Example Words</h3>
          <p>
            {exampleWords.length > 0
              ? exampleWords.map((item, index) => (
                  <span key={`${selectedCharacter.character}-${item.word}`}>
                    {item.word} ({item.romaji}) - {item.meaning}
                    {index < exampleWords.length - 1 ? <br /> : null}
                  </span>
                ))
              : 'No example words available for this character yet.'}
          </p>
        </section>
      </div>
    </aside>
  )
}
