import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'

const STORAGE_KEY = 'cinder_piles'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function getEmoji(name) {
  const emojis = ['📚', '🧠', '🔬', '📐', '🗺️', '⚗️', '💡', '🎯', '🏛️', '🌍', '🧮', '📊']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % emojis.length
  return emojis[hash]
}

function loadPiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function savePiles(piles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(piles))
}

export function useStore() {
  const [piles, setPiles] = useState(loadPiles)

  // Persist whenever piles change
  useEffect(() => {
    savePiles(piles)
  }, [piles])

  const addPile = useCallback((name, cards) => {
    const pile = {
      id: generateId(),
      name,
      emoji: getEmoji(name),
      cards, // [{question, answer}]
      known: [], // indices of known cards
      createdAt: Date.now()
    }
    setPiles(prev => [...prev, pile])
    return pile.id
  }, [])

  const deletePile = useCallback((id) => {
    setPiles(prev => prev.filter(p => p.id !== id))
  }, [])

  const resetPile = useCallback((id) => {
    setPiles(prev => prev.map(p => p.id === id ? { ...p, known: [] } : p))
  }, [])

  const markKnown = useCallback((pileId, cardIndex) => {
    setPiles(prev => prev.map(p =>
      p.id === pileId
        ? { ...p, known: [...new Set([...p.known, cardIndex])] }
        : p
    ))
  }, [])

  // Cloud Sharing Logic (KeyValue.xyz - CORS friendly)
  const sharePile = useCallback(async (pileId) => {
    const pile = piles.find(p => p.id === pileId)
    if (!pile) throw new Error('Pile introuvable')

    const dataToShare = {
      name: pile.name,
      cards: pile.cards,
      sharedAt: Date.now()
    }

    // Creating a session first to get a key
    // KeyValue.xyz is very open and works well for small JSON
    const response = await fetch('https://api.keyvalue.xyz/new/cinder', {
      method: 'POST'
    })

    if (!response.ok) throw new Error('Erreur lors de la création du canal de partage')

    // The key is returned as a plain string in the format: https://api.keyvalue.xyz/KEY/SESSION
    const fullUrl = await response.text()
    const urlParts = fullUrl.trim().split('/')
    const shareKey = urlParts[urlParts.length - 2]
    const code = urlParts[urlParts.length - 1] // Using the session as the 6+ char code

    // Now push the data
    const updateRes = await fetch(`https://api.keyvalue.xyz/${shareKey}/${code}`, {
      method: 'POST',
      body: JSON.stringify(dataToShare)
    })

    if (!updateRes.ok) throw new Error('Erreur lors de l\'envoi des données')

    // Save the combined key to the pile
    const finalCode = `${shareKey}:${code}`
    setPiles(prev => prev.map(p => p.id === pileId ? { ...p, shareCode: finalCode } : p))

    return finalCode
  }, [piles])

  const importPile = useCallback(async (fullCode) => {
    if (!fullCode || !fullCode.includes(':')) throw new Error('Code invalide')

    const [shareKey, code] = fullCode.split(':')
    const response = await fetch(`https://api.keyvalue.xyz/${shareKey}/${code}`)

    if (!response.ok) {
      if (response.status === 404) throw new Error('Code introuvable ou expiré')
      throw new Error('Erreur lors de la récupération de la pile')
    }

    const data = await response.json()
    if (!data.name || !data.cards) throw new Error('Format de données invalide')

    const pile = {
      id: generateId(),
      name: data.name,
      emoji: getEmoji(data.name),
      cards: data.cards,
      known: [],
      shareCode: fullCode,
      createdAt: Date.now()
    }

    setPiles(prev => [...prev, pile])
    return pile.id
  }, [])

  return { piles, addPile, deletePile, resetPile, markKnown, sharePile, importPile }
}

export function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

        // Skip first row if it looks like a header
        const start = (rows[0] &&
          typeof rows[0][0] === 'string' &&
          rows[0][0].toLowerCase().includes('question')) ? 1 : 0

        const cards = rows
          .slice(start)
          .filter(r => r[0] && r[1])
          .map(r => ({
            question: String(r[0]).trim(),
            answer: String(r[1]).trim()
          }))

        if (cards.length === 0) {
          reject(new Error('Aucune carte trouvée. Vérifiez que votre fichier a deux colonnes : Question et Réponse.'))
        } else {
          resolve(cards)
        }
      } catch (err) {
        reject(new Error('Impossible de lire le fichier Excel.'))
      }
    }
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier.'))
    reader.readAsArrayBuffer(file)
  })
}
