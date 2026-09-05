// Five-vowel rows, including the intentional gaps in the Y and W rows.
const ROWS = [
  ['a', 'i', 'u', 'e', 'o'], ['ka', 'ki', 'ku', 'ke', 'ko'],
  ['sa', 'shi', 'su', 'se', 'so'], ['ta', 'chi', 'tsu', 'te', 'to'],
  ['na', 'ni', 'nu', 'ne', 'no'], ['ha', 'hi', 'fu', 'he', 'ho'],
  ['ma', 'mi', 'mu', 'me', 'mo'], ['ya', null, 'yu', null, 'yo'],
  ['ra', 'ri', 'ru', 're', 'ro'], ['wa', null, null, null, 'wo'],
  ['n', null, null, null, null],
]

export function KanaGrid({ characters, selectedCharacter, masteredCharacters, onSelectCharacter }) {
  const bySound = new Map(characters.map(character => [character.romaji, character]))
  return (
    <section className="kana-chart-panel">
      <div className="kana-chart-heading"><h2>Bảng chữ</h2><span>Chọn chữ để luyện tập</span></div>
      <div className="kana-vowels" aria-hidden="true">{ROWS[0].map(vowel => <span key={vowel}>{vowel}</span>)}</div>
      <div className="kana-chart-grid">
        {ROWS.flat().map((sound, index) => {
          const character = bySound.get(sound)
          if (!character) return <span key={index} className="kana-gap" aria-hidden="true" />
          const selected = selectedCharacter?.character === character.character
          const mastered = masteredCharacters.has(character.character)
          return (
            <button key={sound} type="button" onClick={() => onSelectCharacter(character)}
              className={`kana-key${selected ? ' is-selected' : ''}${mastered ? ' is-mastered' : ''}`}
              aria-pressed={selected} aria-label={`${character.character}, ${sound}${mastered ? ', đã thuộc' : ''}`}>
              <span lang="ja">{character.character}</span><small>{sound}</small>
              {mastered ? <i aria-hidden="true">✓</i> : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}
