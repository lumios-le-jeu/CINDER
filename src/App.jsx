import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { useToast, ToastContainer } from './toast'
import { HomeView } from './HomeView'
import { StudyView } from './StudyView'

export default function App() {
  const { piles, addPile, deletePile, resetPile, markKnown, sharePile, importPile } = useStore()
  const { toasts, addToast } = useToast()
  const [studyPileId, setStudyPileId] = useState(null)

  const handleStudy = useCallback((pile) => {
    setStudyPileId(pile.id)
  }, [])

  const handleBack = useCallback(() => {
    setStudyPileId(null)
  }, [])

  const studyPile = studyPileId ? piles.find(p => p.id === studyPileId) : null

  return (
    <div className="app">
      {/* Animated background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      {/* Header */}
      <header className="header">
        <div
          className="header-logo"
          onClick={handleBack}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && handleBack()}
          id="logo"
        >
          <span className="header-logo-icon">🔥</span>
          <span className="header-logo-text">Cinder</span>
          <span className="version-tag">v1</span>
        </div>
        <div className="header-actions">
          {studyPile && (
            <button className="btn" onClick={handleBack} id="nav-home">
              ← Mes piles
            </button>
          )}
        </div>
      </header>

      {/* View switching */}
      <AnimatePresence mode="wait">
        {studyPile ? (
          <motion.div
            key="study"
            style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            <StudyView
              pile={studyPile}
              onBack={handleBack}
              onMarkKnown={markKnown}
              onResetPile={resetPile}
            />
          </motion.div>
        ) : (
          <motion.div
            key="home"
            style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            <HomeView
              piles={piles}
              addPile={addPile}
              deletePile={deletePile}
              resetPile={resetPile}
              sharePile={sharePile}
              importPile={importPile}
              onStudy={handleStudy}
              addToast={addToast}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} />
    </div>
  )
}
