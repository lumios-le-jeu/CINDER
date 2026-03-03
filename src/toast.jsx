import { useEffect, useState } from 'react'

let toastId = 0

export function useToast() {
    const [toasts, setToasts] = useState([])

    const addToast = (message, type = 'default', duration = 2500) => {
        const id = toastId++
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, duration)
    }

    return { toasts, addToast }
}

export function ToastContainer({ toasts }) {
    if (toasts.length === 0) return null
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
            ))}
        </div>
    )
}
