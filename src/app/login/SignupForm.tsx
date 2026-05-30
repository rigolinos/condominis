'use client'

import { useState } from 'react'
import { signup } from './actions'
import Link from 'next/link'

export function SignupForm({ onToggleMode }: { onToggleMode: () => void }) {
    const [hasToken, setHasToken] = useState(true)

    return (
        <form className="flex flex-col gap-5" action={signup}>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300" htmlFor="name">
                    Nome Completo
                </label>
                <input
                    className="w-full rounded-xl px-4 py-3.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 focus:bg-white/10 text-white outline-none transition-all placeholder:text-gray-500 focus:ring-4 focus:ring-blue-500/10"
                    name="name"
                    placeholder="Seu Nome Completo"
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300" htmlFor="unit">
                    Unidade
                </label>
                <input
                    className="w-full rounded-xl px-4 py-3.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 focus:bg-white/10 text-white outline-none transition-all placeholder:text-gray-500 focus:ring-4 focus:ring-blue-500/10"
                    name="unit"
                    placeholder="Ex: Apt 101"
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300" htmlFor="email">
                    E-mail
                </label>
                <input
                    className="w-full rounded-xl px-4 py-3.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 focus:bg-white/10 text-white outline-none transition-all placeholder:text-gray-500 focus:ring-4 focus:ring-blue-500/10"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300" htmlFor="password">
                    Senha
                </label>
                <input
                    className="w-full rounded-xl px-4 py-3.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 focus:bg-white/10 text-white outline-none transition-all placeholder:text-gray-500 focus:ring-4 focus:ring-blue-500/10"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                />
            </div>

            <div className="mt-2 p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="hasToken"
                        checked={hasToken}
                        onChange={(e) => setHasToken(e.target.checked)}
                        className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                    <label htmlFor="hasToken" className="text-sm text-gray-300 select-none cursor-pointer font-medium">
                        Tenho um código de convite (Acesso Rápido)
                    </label>
                </div>

                {hasToken ? (
                    <div className="animate-fade-in text-sm">
                        <label className="block text-gray-400 mb-1" htmlFor="token">
                            Código de Convite
                        </label>
                        <input
                            className="w-full rounded-xl px-4 py-3 bg-black/20 border border-white/10 text-white outline-none focus:border-blue-500/50 transition-all font-mono uppercase tracking-widest"
                            type="text"
                            name="token"
                            placeholder="ABC123"
                            required={hasToken}
                        />
                    </div>
                ) : (
                    <div className="animate-fade-in text-sm space-y-2">
                        <p className="text-gray-400 text-xs">Sem convite, seu acesso precisará ser aprovado pelo síndico. Por favor, anexe um comprovante de residência (PDF ou Imagem).</p>
                        <label className="block text-gray-400 mb-1" htmlFor="comprovante">
                            Comprovante
                        </label>
                        <input
                            type="file"
                            name="comprovante"
                            accept=".pdf,image/*"
                            required={!hasToken}
                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-all cursor-pointer"
                        />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4 mt-6">
                <button
                    type="submit"
                    className="relative group w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-3.5 text-sm font-medium transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
                >
                    Finalizar Cadastro
                </button>

                <button
                    type="button"
                    onClick={onToggleMode}
                    className="text-sm text-gray-400 hover:text-white transition-colors text-center mt-2"
                >
                    Já tem uma conta? Voltar ao login
                </button>
            </div>
        </form>
    )
}
