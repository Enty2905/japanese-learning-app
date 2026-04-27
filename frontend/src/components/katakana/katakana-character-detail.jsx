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
          <p>Chọn một chữ để xem chi tiết</p>
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
            Nghe phát âm
          </button>

          <button
            type="button"
            className={`katakana-action-btn katakana-action-btn--master${
              isMastered ? ' is-active' : ''
            }`}
            onClick={() => onToggleMastered(selectedCharacter.character)}
          >
            <CheckIcon className="katakana-action-icon" />
            {isMastered ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}
          </button>
        </div>

        <section className="katakana-detail-section">
          <h3>Cách dùng phổ biến</h3>
          <p>
            Katakana chủ yếu dùng cho từ mượn nước ngoài, từ tượng thanh và
            nhấn mạnh tương tự chữ nghiêng trong tiếng Anh.
          </p>
        </section>

        <section className="katakana-detail-section">
          <h3>Từ ví dụ</h3>
          <p>
            {exampleWords.length > 0
              ? exampleWords.map((item, index) => (
                  <span key={`${selectedCharacter.character}-${item.word}`}>
                    {item.word} ({item.romaji}) - {item.meaning}
                    {index < exampleWords.length - 1 ? <br /> : null}
                  </span>
                ))
              : 'Chưa có từ ví dụ cho chữ này.'}
          </p>
        </section>
      </div>
    </aside>
  )
}
