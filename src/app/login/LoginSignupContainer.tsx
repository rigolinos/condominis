'use client'

import { useState } from 'react'
import { SignupForm } from './SignupForm'
import { login } from './actions'
import Link from 'next/link'

export function LoginSignupContainer({ message }: { message?: string }) {
    const [isLogin, setIsLogin] = useState(true)

    return (
        <div className="w-full max-w-md animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="lg:hidden mb-12 text-center">
                <p className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                    Condominis
                </p>
            </div>

            <div className="glass p-8 sm:p-10 rounded-2xl shadow-2xl relative overflow-hidden">
                {/* Subtle inner glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-white mb-2">
                        {isLogin ? 'Bem-vindo de volta' : 'Nova Conta'}
                    </h2>
                    <p className="text-sm text-gray-400">
                        {isLogin ? 'Acesse sua conta para continuar' : 'Preencha seus dados para solicitar acesso'}
                    </p>
                </div>

                {message && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm mb-4 backdrop-blur-sm animate-fade-in">
                        {message}
                    </div>
                )}

                {isLogin ? (
                    <form className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300" htmlFor="email">
                                E-mail
                            </label>
                            <div className="relative group">
                                <input
                                    className="w-full rounded-xl px-4 py-3.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 focus:bg-white/10 text-white outline-none transition-all placeholder:text-gray-500 focus:ring-4 focus:ring-blue-500/10"
                                    name="email"
                                    placeholder="seu@email.com"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-300" htmlFor="password">
                                    Senha
                                </label>
                                <Link href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <div className="relative group">
                                <input
                                    className="w-full rounded-xl px-4 py-3.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500/50 focus:bg-white/10 text-white outline-none transition-all placeholder:text-gray-500 focus:ring-4 focus:ring-blue-500/10"
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 mt-6">
                            <button
                                formAction={login}
                                className="relative group w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-3.5 text-sm font-medium transition-all hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Entrar na plataforma
                            </button>

                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-white/10"></div>
                                <span className="flex-shrink-0 mx-4 text-xs text-gray-500 uppercase tracking-wider">ou</span>
                                <div className="flex-grow border-t border-white/10"></div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsLogin(false)}
                                className="relative group w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 text-white px-4 py-3.5 text-sm font-medium transition-all hover:bg-white/10 hover:border-white/20"
                            >
                                Criar minha conta
                            </button>
                        </div>
                    </form>
                ) : (
                    <SignupForm onToggleMode={() => setIsLogin(true)} />
                )}
            </div>

            <p className="text-center text-xs text-gray-600 mt-8">
                Ao continuar, você concorda com nossos <Link href="#" className="text-gray-400 hover:text-white transition-colors">Termos de Serviço</Link> e <Link href="#" className="text-gray-400 hover:text-white transition-colors">Política de Privacidade</Link>.
            </p>
        </div>
    )
}
