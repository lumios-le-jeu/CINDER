import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Play, Trash2, RotateCcw, BookOpen, Zap, Share2, Download, Plus, X } from 'lucide-react'
import { parseExcel } from './store'

function ConfirmModal({ title, message, onConfirm, onCancel, confirmText, danger = true, t }) {
    const defaultConfirmText = t ? t("Confirmer", "Confirm") : "Confirmer"
    const cancelText = t ? t("Annuler", "Cancel") : "Annuler"
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
                    <button className="btn" onClick={onCancel}>{cancelText}</button>
                    <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
                        {confirmText || defaultConfirmText}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

function ShareModal({ code, onCancel, t }) {
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
                <h2>🚀 {t ? t("Pile prête à être partagée !", "Deck ready to share!") : "Pile prête à être partagée !"}</h2>
                <p>{t ? t("Partage ce code avec tes amis pour qu'ils puissent réviser cette pile :", "Share this code with your friends so they can study this deck:") : "Partage ce code avec tes amis..."}</p>
                <div className="share-code-display">
                    {code.split('').map((char, i) => (
                        <span key={i} className="code-char">{char}</span>
                    ))}
                </div>
                <div className="modal-actions" style={{ flexDirection: 'column' }}>
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={copyCode}>
                        {t ? t("Copier le code", "Copy code") : "Copier le code"}
                    </button>
                    <button className="btn" style={{ width: '100%' }} onClick={onCancel}>
                        {t ? t("Fermer", "Close") : "Fermer"}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

function PileCard({ pile, onStudy, onReset, onDelete, onShare, t }) {
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
                    <span><BookOpen size={13} /> {total} {t ? t("cartes", "cards") : "cartes"}</span>
                    <span><Zap size={13} /> {remaining} {t ? t("restantes", "remaining") : "restantes"}</span>
                </div>
                <div className="pile-card-progress">
                    <div
                        className="pile-card-progress-bar"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <div className="pile-card-progress-text">{percent}% {t ? t("maîtrisé", "mastered") : "maîtrisé"}</div>

                {pile.shareCode && (
                    <div className="pile-card-code" onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(pile.shareCode);
                    }} title={t ? t("Cliquer pour copier le code", "Click to copy code") : "Cliquer pour copier le code"}>
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
                        <Play size={14} /> {remaining === 0 ? (t ? t('Terminé ✓', 'Done ✓') : 'Terminé ✓') : (t ? t('Étudier', 'Study') : 'Étudier')}
                    </button>
                    <button
                        className="btn"
                        onClick={handleShare}
                        id={`share-${pile.id}`}
                        disabled={sharing}
                        title={t ? t("Partager cette pile", "Share this deck") : "Partager cette pile"}
                    >
                        {sharing ? '...' : <Share2 size={14} />}
                    </button>
                    <button
                        className="btn"
                        onClick={() => setConfirm('reset')}
                        id={`reset-${pile.id}`}
                        title={t ? t("Réinitialiser la progression", "Reset progress") : "Réinitialiser la progression"}
                    >
                        <RotateCcw size={14} />
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={() => setConfirm('delete')}
                        id={`delete-${pile.id}`}
                        title={t ? t("Supprimer la pile", "Delete deck") : "Supprimer la pile"}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </motion.div>

            <AnimatePresence>
                {confirm === 'reset' && (
                    <ConfirmModal
                        t={t}
                        title={t ? t("Réinitialiser ?", "Reset?") : "Réinitialiser ?"}
                        message={t ? t(`Ta progression sur "${pile.name}" sera remise à zéro.`, `Your progress on "${pile.name}" will be reset.`) : `Ta progression sur "${pile.name}" sera remise à zéro.`}
                        onConfirm={() => { onReset(pile.id); setConfirm(null) }}
                        onCancel={() => setConfirm(null)}
                    />
                )}
                {confirm === 'delete' && (
                    <ConfirmModal
                        t={t}
                        title={t ? t("Supprimer la pile ?", "Delete deck?") : "Supprimer la pile ?"}
                        message={t ? t(`"${pile.name}" et toutes ses cartes seront supprimées définitivement.`, `"${pile.name}" and all its cards will be permanently deleted.`) : `"${pile.name}" et toutes ses cartes seront supprimées définitivement.`}
                        onConfirm={() => { onDelete(pile.id); setConfirm(null) }}
                        onCancel={() => setConfirm(null)}
                    />
                )}
            </AnimatePresence>
        </>
    )
}

export function HomeView({ piles, addPile, deletePile, resetPile, sharePile, importPile, onStudy, addToast, t }) {
    const [dragging, setDragging] = useState(false)
    const [loading, setLoading] = useState(false)
    const [importLoading, setImportLoading] = useState(false)
    const [shareCode, setShareCode] = useState(null)
    const [importCode, setImportCode] = useState('')
    const [showAddZone, setShowAddZone] = useState(false)

    const handleFile = useCallback(async (file) => {
        if (!file) return
        if (!file.name.match(/\.xlsx?$/i)) {
            addToast(t ? t('Format non supporté. Utilisez un fichier .xlsx', 'Unsupported format. Use a .xlsx file') : 'Format non supporté', 'error')
            return
        }
        setLoading(true)
        try {
            const cards = await parseExcel(file)
            const name = file.name.replace(/\.xlsx?$/i, '').replace(/[-_]/g, ' ')
            addPile(name, cards)
            addToast(t ? `✅ "${name}" ${t('ajouté —', 'added —')} ${cards.length} ${t('cartes', 'cards')}` : `✅ "${name}" ajouté`, 'success')
        } catch (err) {
            addToast(err.message, 'error')
        } finally {
            setLoading(false)
        }
    }, [addPile, addToast, t])

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
        if (!importCode.trim()) {
            addToast(t ? t('Veuillez entrer un code', 'Please enter a code') : 'Veuillez entrer un code', 'error')
            return
        }
        setImportLoading(true)
        try {
            await importPile(importCode)
            addToast(t ? t(`✅ Pile importée avec succès !`, `✅ Deck imported successfully!`) : `✅ Pile importée avec succès !`, 'success')
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
                <h1>{t ? t("Apprends", "Learn") : "Apprends"} <span>{t ? t("comme un champion", "like a champion") : "comme un champion"}</span> 🔥</h1>
                <p>{t ? t("Uploade tes fiches et swipe pour retenir chaque notion.", "Upload your flashcards and swipe to memorize everything.") : "Uploade tes fiches et swipe pour retenir chaque notion."}</p>
                
                <button 
                    className={`btn btn-primary add-toggle-btn ${showAddZone ? 'active' : ''}`}
                    onClick={() => setShowAddZone(!showAddZone)}
                    title={t ? t("Ajouter une pile", "Add a deck") : "Ajouter une pile"}
                    style={{ 
                        marginTop: '25px', 
                        borderRadius: '50%', 
                        width: '56px', 
                        height: '56px', 
                        padding: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(255, 75, 43, 0.3)',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {showAddZone ? <X size={28} /> : <Plus size={28} />}
                </button>
            </div>

            {/* Actions Grid */}
            <AnimatePresence>
                {showAddZone && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="home-actions-row" style={{ marginBottom: '30px' }}>
                            {/* Upload zone */}
                            <div style={{ flex: 2 }}>
                                <div className="section-title">{t ? t("Nouvelle pile", "New deck") : "Nouvelle pile"}</div>
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
                                    <h3>{loading ? (t ? t('Chargement…', 'Loading...') : 'Chargement…') : (t ? t('Glisse ton fichier Excel ici', 'Drop your Excel file here') : 'Glisse ton fichier Excel ici')}</h3>
                                    <p>{t ? t('ou clique pour parcourir', 'or click to browse') : 'ou clique pour parcourir'}</p>
                                    <a 
                                        href="/template.xlsx" 
                                        download 
                                        className="btn btn-secondary mt-2" 
                                        style={{ display: 'inline-block', position: 'relative', zIndex: 10, marginTop: '15px' }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {t ? t("📥 Télécharger le template", "📥 Download template") : "📥 Télécharger le template"}
                                    </a>
                                </div>
                            </div>

                            {/* Import zone */}
                            <div style={{ flex: 1 }}>
                                <div className="section-title">{t ? t("Importer par code", "Import by code") : "Importer par code"}</div>
                                <div className="import-zone">
                                    <div className="import-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder={t ? t("Colle le code ici", "Paste code here") : "Colle le code ici"}
                                            value={importCode}
                                            onChange={e => setImportCode(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleImport()}
                                        />
                                        <button
                                            className="btn btn-primary btn-import"
                                            onClick={handleImport}
                                            disabled={importLoading || !importCode.trim()}
                                        >
                                            {importLoading ? '...' : <Download size={18} />}
                                        </button>
                                    </div>
                                    <p className="import-hint">{t ? t("Entre le code partagé par un ami.", "Enter code shared by a friend.") : "Entre le code partagé par un ami."}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Piles */}
            <div style={{ flex: 1 }}>
                <div className="section-title">{t ? t("Mes piles", "My decks") : "Mes piles"} ({piles.length})</div>
                {piles.length === 0 ? (
                    <div className="empty-piles">
                        <span>📂</span>
                        {t ? t("Aucune pile pour l'instant.", "No decks yet.") : "Aucune pile pour l'instant."}<br />
                        {t ? t("Commence par importer un fichier Excel !", "Start by importing an Excel file!") : "Commence par importer un fichier Excel !"}
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
                                    t={t}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </div>

            <AnimatePresence>
                {shareCode && (
                    <ShareModal code={shareCode} onCancel={() => setShareCode(null)} t={t} />
                )}
            </AnimatePresence>
        </div>
    )
}
