import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { deleteResident, addResident, generateInvite, approveResident, rejectResident } from './actions'

export default async function AdminMoradoresPage({
    searchParams,
}: {
    searchParams: Promise<{ generatedToken?: string }>
}) {
    const { generatedToken } = await searchParams
    const supabase = await createClient()

    // Authentication and RBAC Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isManager = profile?.role === 'Sindico' || profile?.role === 'admin' || profile?.role === 'Master'

    // Se não for admin, chuta de volta
    if (!isManager) {
        return redirect('/dashboard')
    }

    // Fetch Residents via Admin Client to bypass any missing RLS for emails mapping
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Pegamos todos os perfis
    const { data: profilesData } = await supabase.from('profiles').select('*').order('apartment_unit', { ascending: true })

    // Pegamos a lista de auth users (para o email)
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers()

    // Separate approved vs pending
    const approvedProfiles = profilesData?.filter(p => p.is_approved) || []
    const pendingProfiles = profilesData?.filter(p => !p.is_approved) || []

    const residents = approvedProfiles.map(prof => {
        const authInfo = authData?.users.find(u => u.id === prof.id)
        return {
            ...prof,
            email: authInfo?.email || 'N/A'
        }
    })

    const pendingRequests = pendingProfiles.map(prof => {
        const authInfo = authData?.users.find(u => u.id === prof.id)
        return {
            ...prof,
            email: authInfo?.email || 'N/A'
        }
    })

    return (
        <div className="min-h-screen w-full bg-[#030712] text-white selection:bg-blue-500/30 overflow-hidden relative pb-20">
            {/* Background Decorators */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen pointer-events-none animate-pulse-slow object-cover" />

            <nav className="fixed top-0 w-full z-50 glass border-b border-white/5 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <span className="text-white font-bold text-sm">C</span>
                            </div>
                            <span className="font-semibold text-lg tracking-tight">Condominis Admin</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-400">
                            <Link href="/dashboard" className="hover:text-white transition-colors">Voltar ao App</Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 relative z-10 space-y-8">

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in-up">
                    <div>
                        <p className="text-sm font-medium text-blue-400 mb-2">Painel do Síndico</p>
                        <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">
                            Gestão de Moradores
                        </h1>
                        <p className="text-gray-400 font-light max-w-xl">
                            Aprove solicitações, gere convites, ou remova o acesso dos condôminos na plataforma.
                        </p>
                    </div>
                </div>

                {/* --- PENDING REQUESTS --- */}
                {pendingRequests.length > 0 && (
                    <div className="glass rounded-2xl p-8 mb-8 border border-amber-500/20 animate-fade-in-up">
                        <h2 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
                            <div className="w-2 h-6 bg-amber-400 rounded-full"></div>
                            Solicitações Pendentes de Aprovação
                            <span className="ml-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-white">{req.full_name}</h3>
                                            <p className="text-xs text-gray-400">{req.email}</p>
                                        </div>
                                        <span className="bg-white/10 px-2 py-1 rounded text-xs font-mono text-gray-300">
                                            {req.apartment_unit}
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        {req.document_url ? (
                                            <a href={req.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                                Visualizar Comprovante
                                            </a>
                                        ) : (
                                            <span className="text-xs text-red-400">Nenhum comprovante anexado</span>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <form action={approveResident.bind(null, req.id)} className="flex-1">
                                            <button type="submit" className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 text-xs font-medium py-2 rounded-lg transition-colors">
                                                Aprovar
                                            </button>
                                        </form>
                                        <form action={rejectResident.bind(null, req.id)} className="flex-1">
                                            <button type="submit" className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium py-2 rounded-lg transition-colors">
                                                Recusar
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (Forms) */}
                    <div className="space-y-6 lg:col-span-1">

                        {/* Gen Token Form */}
                        <div className="glass rounded-2xl p-8 animate-fade-in-up">
                            <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                                <div className="w-2 h-6 bg-indigo-400 rounded-full"></div>
                                Gerar Convite (Fast Track)
                            </h2>
                            <p className="text-xs text-gray-400 mb-4">Gere um código seguro para um morador se cadastrar sem precisar de aprovação manual.</p>

                            {/* We could use a client component for standard form submission to show the token, but for simplicity we can use standard form actions with reload, though showing the generated token requires client-side state or flash messages. We'll use a standard action for now. */}
                            <form action={generateInvite} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Unidade</label>
                                        <input type="text" name="unidade_convite" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50" placeholder="Apt 101" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Perfil (Role)</label>
                                        <select name="role_convite" defaultValue="Morador" className="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none">
                                            <option value="Morador">Morador</option>
                                            <option value="Conselho">Conselho Fiscal</option>
                                            <option value="Sindico">Síndico</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-lg shadow-lg shadow-indigo-500/25 transition-all">
                                    Gerar Código de Convite
                                </button>

                                {generatedToken && (
                                    <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm text-center animate-fade-in">
                                        Novo Token: <strong className="font-mono text-lg">{generatedToken}</strong>
                                        <p className="text-xs text-emerald-500/70 mt-1">Copie este código e envie para o condômino.</p>
                                    </div>
                                )}
                            </form>
                        </div>


                        {/* Add Resident Form (Manual Admin Entry) */}
                        <div className="glass rounded-2xl p-8 animate-fade-in-up h-fit border border-white/5 opacity-70 hover:opacity-100 transition-opacity">
                            <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                                <div className="w-2 h-6 bg-gray-500 rounded-full"></div>
                                Cadastro Manual Admin
                            </h2>

                            <form action={addResident} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Nome Completo</label>
                                    <input type="text" name="nome" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Ex: João da Silva" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">E-mail</label>
                                    <input type="email" name="email" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="joao@email.com" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Unidade</label>
                                        <input type="text" name="unidade" required className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Ex: Apt 101" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Perfil (Role)</label>
                                        <select name="role" defaultValue="Morador" className="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none">
                                            <option value="Morador">Morador</option>
                                            <option value="Conselho">Conselho Fiscal</option>
                                            <option value="Sindico">Síndico</option>
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" className="w-full mt-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium py-2.5 rounded-lg transition-all">
                                    Inserir Diretamente
                                </button>
                                <p className="text-[10px] text-gray-500 mt-2 text-center uppercase tracking-wider">
                                    Senha = Condo@UNIDADE
                                </p>
                            </form>
                        </div>
                    </div>


                    {/* Residents List */}
                    <div className="glass rounded-2xl p-8 animate-fade-in-up lg:col-span-2" style={{ animationDelay: '0.1s' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-medium text-white flex items-center gap-2">
                                <div className="w-2 h-6 bg-emerald-400 rounded-full"></div>
                                Moradores Ativos
                            </h2>
                            <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-gray-300 border border-white/10">
                                {residents.length} Rregistros
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-white/5 text-gray-400 border-b border-white/10">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Unidade</th>
                                        <th className="px-4 py-3 font-medium">Nome</th>
                                        <th className="px-4 py-3 font-medium">E-mail</th>
                                        <th className="px-4 py-3 font-medium">Perfil</th>
                                        <th className="px-4 py-3 font-medium text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {residents.map(res => (
                                        <tr key={res.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-medium text-blue-300">{res.apartment_unit}</td>
                                            <td className="px-4 py-3 text-gray-200">{res.full_name}</td>
                                            <td className="px-4 py-3 text-gray-400">{res.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${res.role === 'Sindico' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    res.role === 'Conselho' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    }`}>
                                                    {res.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="text-xs text-gray-400 hover:text-white transition-colors bg-white/5 px-2 py-1 rounded">
                                                        Editar
                                                    </button>
                                                    <form action={deleteResident.bind(null, res.id)}>
                                                        <button
                                                            type="submit"
                                                            className="text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors bg-white/5 px-2 py-1 rounded border border-transparent hover:border-red-500/20"
                                                            disabled={res.id === user.id}
                                                            title={res.id === user.id ? "Você não pode excluir a si mesmo" : "Remover Usuário"}
                                                        >
                                                            Remover
                                                        </button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {residents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                Nenhum morador cadastrado ainda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
