import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { FlashCardDirect, ActionButtons } from './FlashCard'

function shuffleArray(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

function CompletedView({ pile, onBack, onReset, totalCards }) {
    return (
        <div className="completed-view">
            <motion.div
                className="completed-trophy"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
            >
                🏆
            </motion.div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
            >
                <div className="completed-title">Pile terminée !</div>
                <div className="completed-subtitle">
                    Tu maîtrises toutes les cartes de <strong>"{pile.name}"</strong> 🎉
                </div>
                <div className="completed-stats">
                    <div className="stat-box">
                        <div className="stat-value">{totalCards}</div>
                        <div className="stat-label">Cartes</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-value">100%</div>
                        <div className="stat-label">Maîtrisé</div>
                    </div>
                </div>
                <div className="completed-actions">
                    <button className="btn btn-primary" onClick={onBack} id="back-home">
                        <ArrowLeft size={16} /> Retour aux piles
                    </button>
                    <button className="btn" onClick={onReset} id="restart-pile">
                        <RotateCcw size={16} /> Recommencer depuis zéro
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

export function StudyView({ pile, onBack, onMarkKnown, onResetPile }) {
    const [queue, setQueue] = useState(() =>
        shuffleArray(
            pile.cards.map((_, i) => i).filter(i => !pile.known.includes(i))
        )
    )
    const [completed, setCompleted] = useState(false)
    const [cardKey, setCardKey] = useState(0)
    const [flipped, setFlipped] = useState(false)

    const currentIdx = queue[0]
    const currentCard = currentIdx !== undefined ? pile.cards[currentIdx] : null
    const remaining = queue.length
    const totalCards = pile.cards.length

    const handleRetry = useCallback(() => {
        setQueue(prev => {
            const [first, ...rest] = prev
            return [...rest, first]
        })
        setCardKey(k => k + 1)
        setFlipped(false)
    }, [])

    const handleCorrect = useCallback(() => {
        if (queue.length === 1) {
            onMarkKnown(pile.id, currentIdx)
            setCompleted(true)
            setQueue([])
        } else {
            onMarkKnown(pile.id, currentIdx)
            setQueue(prev => prev.slice(1))
            setCardKey(k => k + 1)
            setFlipped(false)
        }
    }, [currentIdx, queue.length, onMarkKnown, pile.id])

    const handleReset = useCallback(() => {
        onResetPile(pile.id)
        setQueue(shuffleArray(pile.cards.map((_, i) => i)))
        setCompleted(false)
        setCardKey(k => k + 1)
        setFlipped(false)
    }, [pile, onResetPile])

    if (completed) {
        return (
            <div className="view">
                <CompletedView
                    pile={pile}
                    onBack={onBack}
                    onReset={handleReset}
                    totalCards={totalCards}
                />
            </div>
        )
    }

    return (
        <div className="view study-view">
            {/* Top Bar */}
            <div className="study-header">
                <button className="btn btn-icon" onClick={onBack} id="back-btn" title="Retour">
                    <ArrowLeft size={18} />
                </button>
                <div className="study-title">{pile.emoji} {pile.name}</div>
                <div className="study-counter">{remaining} / {totalCards}</div>
            </div>

            {/* Swipe hints */}
            <div className="swipe-hints">
                <div className="swipe-hint swipe-hint-left">
                    <div className="swipe-hint-dot" />
                    Swipe ← Pas encore
                </div>
                <div className="swipe-hint swipe-hint-right">
                    Swipe → Maîtrisé
                    <div className="swipe-hint-dot" />
                </div>
            </div>

            {/* Card stack */}
            <div className="card-stack-area">
                <AnimatePresence>
                    {currentCard && (
                        <FlashCardDirect
                            key={cardKey}
                            card={currentCard}
                            flipped={flipped}
                            onFlipChange={setFlipped}
                            onSwipeLeft={handleRetry}
                            onSwipeRight={handleCorrect}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Action buttons */}
            <ActionButtons
                onRetry={handleRetry}
                onFlip={() => setFlipped(f => !f)}
                onCorrect={handleCorrect}
            />

            <div style={{ height: 8 }} />
        </div>
    )
}
