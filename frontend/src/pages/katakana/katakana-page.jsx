import { DashboardNav } from '../../components/dashboard/dashboard-nav'
import { KatakanaAboutCard } from '../../components/katakana/katakana-about-card'
import { KatakanaCharacterDetail } from '../../components/katakana/katakana-character-detail'
import { KatakanaCharacterGrid } from '../../components/katakana/katakana-character-grid'
import { KatakanaProgressCard } from '../../components/katakana/katakana-progress-card'
import { katakanaCharacters } from '../../data/japanese-data'
import { useKatakanaStudy } from '../../hooks/use-katakana-study'
import { NAV_ITEMS } from '../dashboard/dashboard-content'
import '../dashboard/dashboard-page.css'
import './katakana-page.css'

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

export function KatakanaPage() {
  const {
    selectedCharacter,
    masteredCharacters,
    masteredCount,
    progressPercent,
    handleSelectCharacter,
    handleToggleMastered,
  } = useKatakanaStudy(katakanaCharacters)

  const handlePlaySound = () => {
    playCharacterSound(selectedCharacter)
  }

  return (
    <div className="katakana-page">
      <DashboardNav navItems={NAV_ITEMS} />

      <main className="katakana-main">
        <KatakanaProgressCard
          masteredCount={masteredCount}
          totalCount={katakanaCharacters.length}
          progressPercent={progressPercent}
        />

        <div className="katakana-content-grid">
          <KatakanaCharacterGrid
            characters={katakanaCharacters}
            selectedCharacter={selectedCharacter}
            masteredCharacters={masteredCharacters}
            onSelectCharacter={handleSelectCharacter}
          />

          <KatakanaCharacterDetail
            selectedCharacter={selectedCharacter}
            masteredCharacters={masteredCharacters}
            onToggleMastered={handleToggleMastered}
            onPlaySound={handlePlaySound}
          />
        </div>

        <KatakanaAboutCard />
      </main>
    </div>
  )
}
