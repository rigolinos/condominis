import { login, signup } from './actions'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const { message } = await searchParams

    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 h-screen mx-auto">
            <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
                <div className="flex flex-col mb-6 items-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Condominis</h1>
                    <p className="text-gray-500 text-sm">Acesse sua conta para continuar</p>
                </div>

                {message && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm mb-4 border border-red-200">
                        {message}
                    </div>
                )}

                <label className="text-md font-medium text-gray-700 mt-4" htmlFor="email">
                    E-mail
                </label>
                <input
                    className="rounded-md px-4 py-3 bg-gray-50 border border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-gray-900 outline-none transition-all placeholder:text-gray-400"
                    name="email"
                    placeholder="seu@email.com"
                    required
                />
                <label className="text-md font-medium text-gray-700 mt-4" htmlFor="password">
                    Senha
                </label>
                <input
                    className="rounded-md px-4 py-3 bg-gray-50 border border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-gray-900 outline-none transition-all placeholder:text-gray-400"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                />
                <div className="flex flex-col gap-3 mt-8">
                    <button
                        formAction={login}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-3 text-lg font-medium transition-colors"
                    >
                        Entrar
                    </button>
                    <button
                        formAction={signup}
                        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md px-4 py-3 text-lg font-medium transition-colors"
                    >
                        Criar conta
                    </button>
                </div>
            </form>
        </div>
    )
}
