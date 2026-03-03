import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Play, Trash2, RotateCcw, BookOpen, Zap, Share2, Download } from 'lucide-react'
import { parseExcel } from './store'

function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = "Confirmer", danger = true }) {
    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <motion.div
                className="modal"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                onClick={e => e.stopPropagation()}
            >
                <h2>{title}</h2>
                <p>{message}</p>
                <div className="modal-actions">
                    <button className="btn" onClick={onCancel}>Annuler</button>
                    <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

function ShareModal({ code, onCancel }) {
    const copyCode = () => {
        navigator.clipboard.writeText(code)
    }

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <motion.div
                className="modal share-modal"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                onClick={e => e.stopPropagation()}
            >
                <h2>🚀 Pile prête à être partagée !</h2>
                <p>Partage ce code avec tes amis pour qu'ils puissent réviser cette pile :</p>
                <div className="share-code-display">
                    {code.split('').map((char, i) => (
                        <span key={i} className="code-char">{char}</span>
                    ))}
                </div>
                <div className="modal-actions" style={{ flexDirection: 'column' }}>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={copyCode}>
                        Copier le code
                    </button>
                    <button className="btn" style={{ width: '100%' }} onClick={onCancel}>
                        Fermer
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

function PileCard({ pile, onStudy, onReset, onDelete, onShare }) {
    const [confirm, setConfirm] = useState(null) // 'reset' | 'delete'
    const [sharing, setSharing] = useState(false)
    const knownCount = pile.known.length
    const total = pile.cards.length
    const percent = total > 0 ? Math.round((knownCount / total) * 100) : 0
    const remaining = total - knownCount

    const handleShare = async () => {
        setSharing(true)
        try {
            await onShare(pile.id)
        } finally {
            setSharing(false)
        }
    }

    return (
        <>
            <motion.div
                className="pile-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
            >
                <span className="pile-card-emoji">{pile.emoji}</span>
                <div className="pile-card-title">{pile.name}</div>
                <div className="pile-card-meta">
                    <span><BookOpen size={13} /> {total} cartes</span>
                    <span><Zap size={13} /> {remaining} restantes</span>
                </div>
                <div className="pile-card-progress">
                    <div
                        className="pile-card-progress-bar"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <div className="pile-card-progress-text">{percent}% maîtrisé</div>

                {pile.shareCode && (
                    <div className="pile-card-code" onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(pile.shareCode);
                    }} title="Cliquer pour copier le code">
                        <span className="code-label">CODE:</span>
                        <span className="code-value">{pile.shareCode}</span>
                    </div>
                )}

                <div className="pile-card-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => onStudy(pile)}
                        id={`study-${pile.id}`}
                        disabled={remaining === 0}
                    >
                        <Play size={14} /> {remaining === 0 ? 'Terminé ✓' : 'Étudier'}
                    </button>
                    <button
                        className="btn"
                        onClick={handleShare}
                        id={`share-${pile.id}`}
                        disabled={sharing}
                        title="Partager cette pile"
                    >
                        {sharing ? '...' : <Share2 size={14} />}
                    </button>
                    <button
                        className="btn"
                        onClick={() => setConfirm('reset')}
                        id={`reset-${pile.id}`}
                        title="Réinitialiser la progression"
                    >
                        <RotateCcw size={14} />
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={() => setConfirm('delete')}
                        id={`delete-${pile.id}`}
                        title="Supprimer la pile"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </motion.div>

            <AnimatePresence>
                {confirm === 'reset' && (
                    <ConfirmModal
                        title="Réinitialiser ?"
                        message={`Ta progression sur "${pile.name}" sera remise à zéro.`}
                        onConfirm={() => { onReset(pile.id); setConfirm(null) }}
                        onCancel={() => setConfirm(null)}
                    />
                )}
                {confirm === 'delete' && (
                    <ConfirmModal
                        title="Supprimer la pile ?"
                        message={`"${pile.name}" et toutes ses cartes seront supprimées définitivement.`}
                        onConfirm={() => { onDelete(pile.id); setConfirm(null) }}
                        onCancel={() => setConfirm(null)}
                    />
                )}
            </AnimatePresence>
        </>
    )
}

export function HomeView({ piles, addPile, deletePile, resetPile, sharePile, importPile, onStudy, addToast }) {
    const [dragging, setDragging] = useState(false)
    const [loading, setLoading] = useState(false)
    const [importLoading, setImportLoading] = useState(false)
    const [shareCode, setShareCode] = useState(null)
    const [importCode, setImportCode] = useState('')

    const handleFile = useCallback(async (file) => {
        if (!file) return
        if (!file.name.match(/\.xlsx?$/i)) {
            addToast('Format non supporté. Utilisez un fichier .xlsx', 'error')
            return
        }
        setLoading(true)
        try {
            const cards = await parseExcel(file)
            const name = file.name.replace(/\.xlsx?$/i, '').replace(/[-_]/g, ' ')
            addPile(name, cards)
            addToast(`✅ "${name}" ajouté — ${cards.length} cartes`, 'success')
        } catch (err) {
            addToast(err.message, 'error')
        } finally {
            setLoading(false)
        }
    }, [addPile, addToast])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        handleFile(file)
    }, [handleFile])

    const handleShare = async (id) => {
        try {
            const code = await sharePile(id)
            setShareCode(code)
        } catch (err) {
            addToast(err.message, 'error')
        }
    }

    const handleImport = async () => {
        if (importCode.length !== 6) {
            addToast('Le code doit contenir 6 chiffres', 'error')
            return
        }
        setImportLoading(true)
        try {
            await importPile(importCode)
            addToast(`✅ Pile importée avec succès !`, 'success')
            setImportCode('')
        } catch (err) {
            addToast(err.message, 'error')
        } finally {
            setImportLoading(false)
        }
    }

    return (
        <div className="view home-view">
            {/* Hero */}
            <div className="home-hero">
                <h1>Apprends <span>comme un champion</span> 🔥</h1>
                <p>Uploade tes fiches Excel et swipe pour retenir chaque notion.</p>
            </div>

            {/* Actions Grid */}
            <div className="home-actions-row">
                {/* Upload zone */}
                <div style={{ flex: 2 }}>
                    <div className="section-title">Nouvelle pile</div>
                    <div
                        className={`drop-zone ${dragging ? 'dragging' : ''} ${loading ? 'dragging' : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={e => handleFile(e.target.files[0])}
                            id="file-input"
                        />
                        <span className="drop-zone-icon">{loading ? '⏳' : '📤'}</span>
                        <h3>{loading ? 'Chargement…' : 'Glisse ton fichier Excel ici'}</h3>
                        <p>ou clique pour parcourir</p>
                    </div>
                </div>

                {/* Import zone */}
                <div style={{ flex: 1 }}>
                    <div className="section-title">Importer par code</div>
                    <div className="import-zone">
                        <div className="import-input-wrapper">
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="Code (ex: 123456)"
                                value={importCode}
                                onChange={e => setImportCode(e.target.value.replace(/\D/g, ''))}
                                onKeyDown={e => e.key === 'Enter' && handleImport()}
                            />
                            <button
                                className="btn btn-primary btn-import"
                                onClick={handleImport}
                                disabled={importLoading || importCode.length !== 6}
                            >
                                {importLoading ? '...' : <Download size={18} />}
                            </button>
                        </div>
                        <p className="import-hint">Entre le code à 6 chiffres partagé par un ami.</p>
                    </div>
                </div>
            </div>

            {/* Piles */}
            <div style={{ flex: 1 }}>
                <div className="section-title">Mes piles ({piles.length})</div>
                {piles.length === 0 ? (
                    <div className="empty-piles">
                        <span>📂</span>
                        Aucune pile pour l'instant.<br />
                        Commence par importer un fichier Excel !
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="piles-grid">
                            {piles.map(pile => (
                                <PileCard
                                    key={pile.id}
                                    pile={pile}
                                    onStudy={onStudy}
                                    onReset={resetPile}
                                    onDelete={deletePile}
                                    onShare={handleShare}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </div>

            <AnimatePresence>
                {shareCode && (
                    <ShareModal code={shareCode} onCancel={() => setShareCode(null)} />
                )}
            </AnimatePresence>
        </div>
    )
}
