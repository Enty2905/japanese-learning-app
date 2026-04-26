import { CheckIcon } from '../hiragana/hiragana-icons'

export function KatakanaCharacterGrid({
  characters,
  selectedCharacter,
  masteredCharacters,
  onSelectCharacter,
}) {
  return (
    <section className="katakana-card">
      <h2 className="katakana-card-title">Character Chart</h2>
      <div className="katakana-chart-grid">
        {characters.map((character) => {
          const isSelected = selectedCharacter?.character === character.character
          const isMastered = masteredCharacters.has(character.character)

          return (
            <button
              key={character.character}
              type="button"
              onClick={() => onSelectCharacter(character)}
              className={`katakana-char-btn${isSelected ? ' is-selected' : ''}${
                isMastered ? ' is-mastered' : ''
              }`}
            >
              <span className="katakana-char-glyph">{character.character}</span>
              <span className="katakana-char-romaji">{character.romaji}</span>

              {isMastered ? (
                <span className="katakana-char-check" aria-label="Mastered">
                  <CheckIcon className="katakana-char-check-icon" />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}
