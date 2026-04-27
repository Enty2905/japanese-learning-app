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
          <p>Chọn một chữ để xem chi tiết</p>
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
            Nghe phát âm
          </button>

          <button
            type="button"
            className={`hiragana-action-btn hiragana-action-btn--master${
              isMastered ? ' is-active' : ''
            }`}
            onClick={() => onToggleMastered(selectedCharacter.character)}
          >
            <CheckIcon className="hiragana-action-icon" />
            {isMastered ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}
          </button>
        </div>

        <section className="hiragana-writing-tips">
          <h3>Mẹo luyện viết</h3>
          <p>
            Luyện viết chữ này theo đúng thứ tự nét. Viết nhiều lần để tạo phản xạ tay.
          </p>
        </section>
      </div>
    </aside>
  )
}
