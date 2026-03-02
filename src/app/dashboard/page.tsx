import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch some dummy profile data if we want
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="flex-1 w-full flex flex-col items-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl overflow-hidden">
                <div className="bg-blue-600 px-6 py-8 sm:p-10 text-white">
                    <h1 className="text-3xl font-extrabold flex items-center gap-3">
                        Dashboard Condominis
                    </h1>
                    <p className="mt-2 text-blue-100 text-lg">
                        Bem-vindo de volta, você está autenticado.
                    </p>
                </div>

                <div className="p-6 sm:p-10 border-t border-gray-100 flex flex-col gap-6">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">Seus Dados</h2>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">ID do Usuário</dt>
                                <dd className="mt-1 text-sm text-gray-900 break-all bg-white p-2 rounded border border-gray-100">{user.id}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">E-mail</dt>
                                <dd className="mt-1 text-sm text-gray-900 bg-white p-2 rounded border border-gray-100">{user.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Função (Role)</dt>
                                <dd className="mt-1 text-sm text-gray-900 bg-white p-2 rounded border border-gray-100">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                        {profile?.role || 'Morador'}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <form action="/auth/signout" method="post">
                        <button className="inline-flex justify-center items-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors">
                            Sair da conta
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
