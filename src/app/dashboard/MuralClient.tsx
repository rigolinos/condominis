"use client"

import { useState } from 'react'
import { deleteAnnouncement } from './actions'

type Notice = {
    id: string
    title: string
    content: string
    is_urgent: boolean
    created_at: string
}

export default function MuralClient({ notices, isManager }: { notices: Notice[], isManager: boolean }) {
    const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

    return (
        <div className="flex flex-col gap-4">
            {notices && notices.length === 0 && (
                <div className="text-gray-500 text-sm italic text-center py-4 bg-white/5 rounded-xl border border-white/10">
                    Nenhum aviso no momento.
                </div>
            )}
            {notices && notices.map(notice => (
                <div key={notice.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer relative group"
                    onClick={() => setSelectedNotice(notice)}
                >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-white text-sm pr-12">{notice.title}</h3>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${notice.is_urgent ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                            {notice.is_urgent ? 'URGENTE' : 'INFO'}
                        </span>
                    </div>
                    {/* Exibe uma prévia apenas se não estiver detalhado */}
                    <p className="text-sm text-gray-400 mb-3 leading-relaxed line-clamp-2">{notice.content}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {new Date(notice.created_at).toLocaleDateString('pt-BR')}
                        </div>
                    </div>

                    {isManager && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Tem certeza que deseja excluir este aviso?')) {
                                    deleteAnnouncement(notice.id);
                                }
                            }}
                            className="absolute top-4 right-16 text-red-400/50 hover:text-red-400 transition-colors bg-black/20 p-1.5 rounded-md opacity-0 group-hover:opacity-100"
                            title="Excluir Aviso"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    )}
                </div>
            ))}

            {selectedNotice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedNotice(null)}>
                    <div className="glass w-full max-w-lg p-6 rounded-2xl border border-white/10 animate-fade-in-up shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-white pr-8">{selectedNotice.title}</h2>
                            <button onClick={() => setSelectedNotice(null)} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg border border-white/10 hover:bg-white/10">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="mb-4">
                            <span className={`inline-block mb-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${selectedNotice.is_urgent ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                {selectedNotice.is_urgent ? 'URGENTE' : 'INFO'}
                            </span>
                        </div>
                        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {selectedNotice.content}
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/10 text-xs text-gray-500 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Publicado em {new Date(selectedNotice.created_at).toLocaleString('pt-BR')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
