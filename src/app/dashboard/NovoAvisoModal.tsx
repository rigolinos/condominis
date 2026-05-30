"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAnnouncement } from './actions'

export default function NovoAvisoModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        try {
            await createAnnouncement(formData)
            setIsOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Erro ao criar o aviso.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-500/25 transition-all focus:ring-2 focus:ring-blue-500/50"
            >
                Novo Aviso
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
                    <div style={{ backgroundColor: '#0f172a' }} className="w-full max-w-lg p-5 sm:p-8 rounded-2xl border border-white/20 shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <h2 className="text-xl font-bold text-white">Criar Novo Aviso</h2>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form action={handleSubmit} className="flex flex-col gap-5 mt-2">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Título</label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    required
                                    placeholder="Ex: Manutenção do Elevador"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-1">Conteúdo</label>
                                <textarea
                                    id="content"
                                    name="content"
                                    required
                                    rows={5}
                                    placeholder="Detalhes do aviso..."
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all custom-scrollbar resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                <input
                                    id="is_urgent"
                                    name="is_urgent"
                                    type="checkbox"
                                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-red-500 focus:ring-red-500 focus:ring-offset-slate-900 cursor-pointer"
                                />
                                <label htmlFor="is_urgent" className="text-sm font-medium text-red-400 tracking-wide select-none cursor-pointer">
                                    Marcar como URGENTE
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-slate-700 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                                >
                                    {isSubmitting ? 'Publicando...' : 'Publicar Aviso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
