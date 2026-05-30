import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import MuralClient from './MuralClient'
import NovoAvisoModal from './NovoAvisoModal'
import { mockOverview, mockFinancials } from '@/utils/mockData'

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

    // Determine role (default to 'Morador' se não tiver perfil)
    const role = profile?.role || 'Morador'
    const isManager = role === 'Sindico' || role === 'Conselho' || role === 'admin' || role === 'Master'

    // Fetch announcements
    const { data: noticesData } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
    const notices = noticesData || []

    const userUnits = profile?.apartment_unit ? profile.apartment_unit.split(',').map((u: string) => u.trim()) : []

    let visibleCharges: any[] = []
    if (isManager) {
        const { data: allCharges } = await supabase
            .from('financial_records')
            .select('*')
            .order('date', { ascending: false })
            .limit(10)
        visibleCharges = allCharges || []
    } else {
        if (userUnits.length > 0) {
            const { data: myCharges, error } = await supabase
                .from('financial_records')
                .select('*')
                .in('unit', userUnits)
                .order('date', { ascending: false })

            if (error) {
                console.warn("Could not fetch user invoices. Run SQL migration first.", error)
            } else {
                visibleCharges = myCharges || []
            }
        }
    }

    return (
        <div className="min-h-screen w-full bg-[#030712] text-white selection:bg-blue-500/30 overflow-hidden relative">
            {/* Background Decorators */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen pointer-events-none animate-pulse-slow object-cover" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen pointer-events-none animate-pulse-slow object-cover" style={{ animationDelay: '2s' }} />

            {/* Navbar Minimalist */}
            <nav className="fixed top-0 w-full z-50 glass border-b border-white/5 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-white font-bold text-sm">C</span>
                        </div>
                        <span className="font-semibold text-lg tracking-tight">Condominis</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-400">
                            <Link href="/dashboard" className="text-white hover:text-blue-400 transition-colors">Dashboard</Link>
                            <Link href="/ocorrencias" className="hover:text-white transition-colors">Ocorrências</Link>
                            {isManager && (
                                <>
                                    <Link href="/admin/financeiro" className="hover:text-amber-400 text-amber-500/70 transition-colors flex items-center gap-1">
                                        Financeiro
                                    </Link>
                                    <Link href="/admin/moradores" className="hover:text-amber-400 text-amber-500/70 transition-colors flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        Moradores
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                            <form action="/auth/signout" method="post">
                                <button className="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-md hover:bg-white/5">
                                    Sair
                                </button>
                            </form>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/10 flex items-center justify-center">
                                <span className="text-xs font-medium text-white">{user.email?.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-16 relative z-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div>
                        <p className="text-sm font-medium text-blue-400 mb-2">Visão Geral</p>
                        <h1 className="text-4xl font-semibold tracking-tight text-white mb-2">
                            Olá, bem-vindo de volta
                        </h1>
                        <p className="text-gray-400 font-light max-w-xl">
                            Aqui está o resumo das atividades do seu condomínio hoje.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isManager && (
                            <Link href="/admin/relatorio" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition-colors">
                                Relatório
                            </Link>
                        )}
                    </div>
                </div>

                {/* --- TRANSPARÊNCIA FINANCEIRA (NEW) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Saldo e Visão Geral Financeira */}
                    <div className="glass rounded-2xl p-8 relative overflow-hidden group animate-fade-in-up lg:col-span-1" style={{ animationDelay: '0.2s' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-opacity opacity-50" />
                        <h2 className="text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">Saldo em Caixa Atual</h2>
                        <p className={`text-4xl font-bold tracking-tight mb-6 ${mockFinancials.balance.status === 'positive' ? 'text-emerald-400' : 'text-red-400'}`}>
                            R$ {mockFinancials.balance.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Arrecadação Mensal</span>
                                <span className="text-white font-medium">{mockOverview.monthlyRevenue}</span>
                            </div>
                            <div className="w-full h-[1px] bg-white/10"></div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Taxa de Adimplência</span>
                                <span className="text-emerald-400 font-medium">95.5%</span> {/* Inverse of defaultRate */}
                            </div>
                        </div>
                    </div>

                    {/* Distribuição da Taxa Condominial */}
                    <div className="glass rounded-2xl p-8 animate-fade-in-up lg:col-span-2" style={{ animationDelay: '0.3s' }}>
                        <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                            Para onde vai a Taxa de Condomínio? (Base: R$ 850,00)
                        </h2>

                        <div className="space-y-5">
                            {mockFinancials.feeBreakdown.map((item) => (
                                <div key={item.id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-300">{item.category}</span>
                                        <span className="text-white font-medium">R$ {item.amount.toFixed(2)} ({item.percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${item.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Fundos de Reserva e Obras */}
                <div className="glass rounded-2xl p-8 mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                        Acompanhamento de Fundos e Metas
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {mockFinancials.funds.map((fund) => {
                            const percent = Math.min(100, Math.round((fund.amount / fund.target) * 100));
                            return (
                                <div key={fund.id} className="p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-sm font-medium text-gray-300">{fund.name}</h3>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded bg-${fund.color}-500/10 text-${fund.color}-400`}>
                                            {percent}% atingido
                                        </span>
                                    </div>
                                    <p className="text-2xl font-semibold text-white mb-1">
                                        R$ {fund.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-4">
                                        Meta: R$ {fund.target.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>

                                    <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`bg-${fund.color}-500 h-1.5 rounded-full`}
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Notices Section */}
                    <div className="glass rounded-2xl p-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-medium text-white flex items-center gap-2">
                                <div className="w-2 h-6 bg-red-400 rounded-full"></div>
                                Mural de Avisos
                            </h2>
                            {isManager && <NovoAvisoModal />}
                        </div>

                        <MuralClient notices={notices} isManager={isManager} />
                    </div>

                    {/* Fincances Section (ROLE BASED) */}
                    <div className="glass rounded-2xl p-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-medium text-white flex items-center gap-2">
                                <div className="w-2 h-6 bg-red-400 rounded-full"></div>
                                {isManager ? 'Controle de Inadimplência Geral' : 'Minhas Faturas'}
                                {isManager && (
                                    <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                                        Acesso Admin
                                    </span>
                                )}
                            </h2>
                            <button className="text-xs text-blue-400 hover:text-blue-300">Ver todas</button>
                        </div>

                        {isManager ? (
                            <p className="text-sm text-gray-400 mb-4 bg-white/5 p-3 rounded-lg border border-white/10">
                                ⚠️ Atenção: Estas informações são confidenciais e restritas à administração do condomínio (LGPD).
                            </p>
                        ) : (
                            <p className="text-sm text-gray-400 mb-4">
                                Mostrando apenas as faturas vinculadas à sua unidade.
                            </p>
                        )}

                        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-gray-400 border-b border-white/10">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Unidade</th>
                                        {isManager && <th className="px-4 py-3 font-medium">Morador</th>}
                                        <th className="px-4 py-3 font-medium">Valor</th>
                                        <th className="px-4 py-3 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {visibleCharges && visibleCharges.length > 0 ? (
                                        visibleCharges.map(charge => (
                                            <tr key={charge.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-300">{charge.unit || '-'}</td>
                                                {isManager && <td className="px-4 py-3 text-gray-400">{charge.description}</td>}
                                                <td className="px-4 py-3 text-gray-300 font-mono">R$ {charge.amount.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${charge.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                        charge.status === 'late' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                        }`}>
                                                        {charge.status === 'paid' ? 'Pago' : charge.status === 'late' ? 'Atrasado' : 'Pendente'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={isManager ? 4 : 3} className="px-4 py-8 text-center text-gray-500 italic">
                                                Nenhuma fatura encontrada. {userUnits.length === 0 && !isManager ? 'Cadastre sua unidade no perfil.' : ''}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* User Data / Details Section (Moved to Bottom) */}
                <div className="glass rounded-2xl p-8 mt-8 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                    <h2 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                        Dados da sua Conta
                    </h2>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-1">
                            <dt className="text-sm font-medium text-gray-500 uppercase tracking-wider">ID do Usuário</dt>
                            <dd className="text-sm text-gray-200 font-mono bg-white/5 py-1.5 px-3 rounded-md border border-white/10 truncate">
                                {user.id}
                            </dd>
                        </div>
                        <div className="space-y-1">
                            <dt className="text-sm font-medium text-gray-500 uppercase tracking-wider">E-mail Registrado</dt>
                            <dd className="text-sm text-gray-200 bg-white/5 py-1.5 px-3 rounded-md border border-white/10">
                                {user.email}
                            </dd>
                        </div>
                        <div className="space-y-1">
                            <dt className="text-sm font-medium text-gray-500 uppercase tracking-wider">Perfil</dt>
                            <dd className="text-sm text-gray-200">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize border ${isManager ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    }`}>
                                    {role}
                                </span>
                            </dd>
                        </div>
                    </dl>
                </div>

            </main>
        </div>
    )
}
