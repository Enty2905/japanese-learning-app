import { CheckIcon } from './hiragana-icons'

export function HiraganaCharacterGrid({
  characters,
  selectedCharacter,
  masteredCharacters,
  onSelectCharacter,
}) {
  return (
    <section className="hiragana-card">
      <h2 className="hiragana-card-title">Bảng chữ</h2>
      <div className="hiragana-chart-grid">
        {characters.map((character) => {
          const isSelected = selectedCharacter?.character === character.character
          const isMastered = masteredCharacters.has(character.character)

          return (
            <button
              key={character.character}
              type="button"
              onClick={() => onSelectCharacter(character)}
              className={`hiragana-char-btn${isSelected ? ' is-selected' : ''}${
                isMastered ? ' is-mastered' : ''
              }`}
            >
              <span className="hiragana-char-glyph">{character.character}</span>
              <span className="hiragana-char-romaji">{character.romaji}</span>

              {isMastered ? (
                <span className="hiragana-char-check" aria-label="Đã thuộc">
                  <CheckIcon className="hiragana-char-check-icon" />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}
