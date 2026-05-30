import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { addFinancialRecord, deleteFinancialRecord } from "./actions";

export default async function FinanceiroPage() {
    const supabase = await createClient();

    // 1. Verify Authentication & Authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!profile || (profile.role !== "Sindico" && profile.role !== "Conselho" && profile.role !== "Master")) {
        redirect("/dashboard"); // Redirect non-admins
    }

    // 2. Fetch recent records
    const { data: records, error: fetchError } = await supabase
        .from("financial_records")
        .select("*")
        .order("date", { ascending: false })
        .limit(10);

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen">
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-600">
                    Gestão Financeira
                </h1>
                <p className="text-gray-400 mt-2">
                    Adicione receitas e despesas. Registros privados não são listados no painel dos moradores.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Novo Lançamento</h2>

                    <form action={async (formData) => { await addFinancialRecord(formData); }} className="flex flex-col gap-5">
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
                            <input
                                id="description"
                                name="description"
                                type="text"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all"
                                placeholder="Ex: Pagamento Fornecedor X"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Valor (R$)</label>
                                <input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Data</label>
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                                <select
                                    id="type"
                                    name="type"
                                    required
                                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all appearance-none"
                                >
                                    <option value="Despesa">Despesa</option>
                                    <option value="Receita">Receita</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
                                <select
                                    id="category"
                                    name="category"
                                    required
                                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all appearance-none"
                                >
                                    <option value="Manutenção">Manutenção</option>
                                    <option value="Funcionários">Funcionários</option>
                                    <option value="Contas Fixas">Contas Fixas</option>
                                    <option value="Taxa Condominial">Taxa Condominial</option>
                                    <option value="Fundo de Reserva">Fundo de Reserva</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="unit" className="block text-sm font-medium text-gray-300 mb-1">Unidade (opcional)</label>
                                <input
                                    id="unit"
                                    name="unit"
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all"
                                    placeholder="Ex: Apt 101"
                                />
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status de Pagamento</label>
                                <select
                                    id="status"
                                    name="status"
                                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all appearance-none"
                                >
                                    <option value="Pendente">Pendente</option>
                                    <option value="Pago">Pago</option>
                                    <option value="Atrasado">Atrasado</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 mt-2">
                            <input
                                id="is_private"
                                name="is_private"
                                type="checkbox"
                                className="w-5 h-5 rounded border-white/20 bg-white/10 text-teal-500 focus:ring-teal-500 focus:ring-offset-gray-900"
                            />
                            <label htmlFor="is_private" className="text-sm text-gray-300 select-none cursor-pointer">
                                Lançamento Privado (Ocultar dos moradores - LGPD)
                            </label>
                        </div>

                        <div>
                            <label htmlFor="invoice" className="block text-sm font-medium text-gray-300 mb-1">Comprovante / Nota Fiscal</label>
                            <input
                                id="invoice"
                                name="invoice"
                                type="file"
                                accept="image/*,.pdf"
                                className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-500/20 file:text-teal-400 hover:file:bg-teal-500/30 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            className="mt-4 w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                        >
                            Adicionar Registro
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">Últimos Lançamentos</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-300">
                                <thead className="bg-white/5 text-xs uppercase text-gray-400">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Data</th>
                                        <th className="px-6 py-4 font-medium">Descrição</th>
                                        <th className="px-6 py-4 font-medium">Categoria</th>
                                        <th className="px-6 py-4 font-medium">Tipo</th>
                                        <th className="px-6 py-4 font-medium text-right">Valor</th>
                                        <th className="px-6 py-4 font-medium">Unidade / Status</th>
                                        <th className="px-6 py-4 font-medium text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {records && records.length > 0 ? (
                                        records.map((record) => (
                                            <tr key={record.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {new Date(record.date).toLocaleDateString("pt-BR", { timeZone: 'UTC' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-white">{record.description}</span>
                                                        {record.is_private && (
                                                            <span className="text-xs text-amber-400 font-semibold mt-1 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                                                Privado
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-800 text-gray-300 py-1 px-3 rounded-full text-xs border border-white/10">
                                                        {record.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`py-1 px-3 rounded-full text-xs font-bold bg-opacity-20 border ${record.type === 'Receita'
                                                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                                                        }`}>
                                                        {record.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-right text-white whitespace-nowrap">
                                                    {record.type === 'Receita' ? '+' : '-'} R$ {record.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {record.unit ? (
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-white text-xs">{record.unit}</span>
                                                            <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${record.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                record.status === 'Atrasado' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                                }`}>
                                                                {record.status || 'Pendente'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                                                    {record.invoice_url && (
                                                        <a
                                                            href={record.invoice_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-teal-400 hover:text-teal-300 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                                            title="Ver Comprovante"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                                        </a>
                                                    )}
                                                    <form action={async () => {
                                                        "use server";
                                                        await deleteFinancialRecord(record.id);
                                                    }}>
                                                        <button
                                                            type="submit"
                                                            className="text-red-400 hover:text-red-300 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                                            title="Excluir Registro"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    </form>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                                                Nenhum lançamento financeiro encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
