import { useCallback, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { RotateCcw, Check, X, Eye } from 'lucide-react'

// =============================================
// FlashCardDirect – externally controlled flip
// =============================================
export function FlashCardDirect({ card, flipped, onFlipChange, onSwipeLeft, onSwipeRight }) {
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25])
    const isDragging = useRef(false)

    const retryOpacity = useTransform(x, [0, -80], [0, 1])
    const correctOpacity = useTransform(x, [0, 80], [0, 1])

    const handleDragStart = useCallback(() => {
        isDragging.current = false
    }, [])

    const handleDrag = useCallback(() => {
        isDragging.current = true
    }, [])

    const handleDragEnd = useCallback(async (_, info) => {
        const { offset, velocity } = info
        const swipeThreshold = 90
        const velocityThreshold = 500

        if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
            await animate(x, -600, { duration: 0.28, ease: 'easeIn' })
            onSwipeLeft()
        } else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
            await animate(x, 600, { duration: 0.28, ease: 'easeIn' })
            onSwipeRight()
        } else {
            isDragging.current = false
            animate(x, 0, { type: 'spring', stiffness: 300, damping: 25 })
            animate(y, 0, { type: 'spring', stiffness: 300, damping: 25 })
        }
    }, [x, y, onSwipeLeft, onSwipeRight])

    const handleClick = useCallback(() => {
        // Don't flip if user was dragging
        if (isDragging.current) return
        onFlipChange(f => !f)
    }, [onFlipChange])

    return (
        <div className="card-stack">
            {/* Shadow cards for depth */}
            <div className="card-shadow card-shadow-2" />
            <div className="card-shadow card-shadow-1" />

            <motion.div
                className="flashcard"
                style={{ x, y, rotate, zIndex: 10 }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.85}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                initial={{ scale: 0.88, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.88, opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                onClick={handleClick}
                whileTap={{ cursor: 'grabbing' }}
                style={{ x, y, rotate, zIndex: 10, touchAction: 'none' }}
            >
                {/* Retry overlay */}
                <motion.div className="swipe-overlay swipe-overlay-left" style={{ opacity: retryOpacity }}>
                    💔 Pas encore
                </motion.div>

                {/* Correct overlay */}
                <motion.div className="swipe-overlay swipe-overlay-right" style={{ opacity: correctOpacity }}>
                    ✅ Maîtrisé !
                </motion.div>

                {/* flipped class is on flashcard-inner to match CSS selector */}
                <div className={`flashcard-inner${flipped ? ' flipped' : ''}`}>
                    {/* Front */}
                    <div className="flashcard-face flashcard-front">
                        <div className="flashcard-label">❓ Question</div>
                        <div className="flashcard-text">{card.question}</div>
                        <div className="flashcard-hint">
                            <Eye size={13} /> Cliquez pour voir la réponse
                        </div>
                    </div>

                    {/* Back */}
                    <div className="flashcard-face flashcard-back">
                        <div className="flashcard-label">💡 Réponse</div>
                        <div className="flashcard-text">{card.answer}</div>
                        <div className="flashcard-hint">
                            ← Pas encore &nbsp;|&nbsp; Maîtrisé →
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

// =============================================
// Action Buttons
// =============================================
export function ActionButtons({ onRetry, onFlip, onCorrect }) {
    return (
        <div className="action-buttons">
            <button
                className="action-btn action-btn-retry"
                onClick={onRetry}
                title="Pas encore – revient dans la pile"
                id="btn-retry"
            >
                <X size={26} />
            </button>
            <button
                className="action-btn action-btn-flip"
                onClick={onFlip}
                title="Retourner la carte"
                id="btn-flip"
            >
                <RotateCcw size={18} />
            </button>
            <button
                className="action-btn action-btn-correct"
                onClick={onCorrect}
                title="Je savais ! – retire la carte"
                id="btn-correct"
            >
                <Check size={26} />
            </button>
        </div>
    )
}
