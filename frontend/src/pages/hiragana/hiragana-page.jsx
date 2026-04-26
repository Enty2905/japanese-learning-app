import { HiraganaCharacterDetail } from '../../components/hiragana/hiragana-character-detail'
import { HiraganaCharacterGrid } from '../../components/hiragana/hiragana-character-grid'
import { HiraganaProgressCard } from '../../components/hiragana/hiragana-progress-card'
import { HiraganaStudyTips } from '../../components/hiragana/hiragana-study-tips'
import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { hiraganaCharacters } from '../../data/japanese-data'
import { useHiraganaStudy } from '../../hooks/use-hiragana-study'
import { NAV_ITEMS } from '../dashboard/dashboard-content'
import '../dashboard/dashboard-page.css'
import './hiragana-page.css'

function playCharacterSound(selectedCharacter) {
  if (!selectedCharacter || typeof window === 'undefined') {
    return
  }

  if (!('speechSynthesis' in window)) {
    return
  }

  const utterance = new window.SpeechSynthesisUtterance(selectedCharacter.character)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.85

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export function HiraganaPage() {
  const {
    selectedCharacter,
    masteredCharacters,
    masteredCount,
    progressPercent,
    handleSelectCharacter,
    handleToggleMastered,
  } = useHiraganaStudy(hiraganaCharacters)

  const handlePlaySound = () => {
    playCharacterSound(selectedCharacter)
  }

  return (
    <div className="hiragana-page">
      <DashboardNav navItems={NAV_ITEMS} />

      <main className="hiragana-main">
        <HiraganaProgressCard
          masteredCount={masteredCount}
          totalCount={hiraganaCharacters.length}
          progressPercent={progressPercent}
        />

        <div className="hiragana-content-grid">
          <HiraganaCharacterGrid
            characters={hiraganaCharacters}
            selectedCharacter={selectedCharacter}
            masteredCharacters={masteredCharacters}
            onSelectCharacter={handleSelectCharacter}
          />

          <HiraganaCharacterDetail
            selectedCharacter={selectedCharacter}
            masteredCharacters={masteredCharacters}
            onToggleMastered={handleToggleMastered}
            onPlaySound={handlePlaySound}
          />
        </div>

        <HiraganaStudyTips />
      </main>
    </div>
  )
}
