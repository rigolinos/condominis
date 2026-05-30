import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function RelatorioPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!profile || !['Sindico', 'Conselho', 'Master', 'admin'].includes(profile.role)) {
        return redirect("/dashboard");
    }

    // Get all profiles to extract units
    const { data: allProfiles } = await supabase.from("profiles").select("id, full_name, apartment_unit");

    const unitsData: { unit: string, resident: string }[] = [];
    allProfiles?.forEach(p => {
        if (p.apartment_unit) {
            p.apartment_unit.split(',').forEach((u: string) => {
                const cleanUnit = u.trim();
                if (cleanUnit) {
                    unitsData.push({ unit: cleanUnit, resident: p.full_name });
                }
            });
        }
    });

    // Sort visually
    unitsData.sort((a, b) => a.unit.localeCompare(b.unit));

    // Get current month records
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: records, error } = await supabase
        .from("financial_records")
        .select("*")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth);

    const isMissingColumns = error && error.message.includes('column "unit" does not exist');

    return (
        <div className="p-8 max-w-6xl mx-auto min-h-screen">
            <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-600">
                        Relatório de Inadimplência
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Visão consolidada de todas as unidades para o mês de {now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}.
                    </p>
                </div>
                <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium transition-colors text-white">
                    Voltar ao Dashboard
                </Link>
            </div>

            {isMissingColumns && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
                    <strong>Atenção:</strong> Você precisa rodar o script SQL de migração disponibilizado no painel do Supabase para que este relatório funcione corretamente.
                </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Situação por Unidade</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-white/5 text-xs uppercase text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Unidade</th>
                                <th className="px-6 py-4 font-medium">Morador Principal</th>
                                <th className="px-6 py-4 font-medium">Lançamentos no Mês</th>
                                <th className="px-6 py-4 font-medium text-right">Status Geral</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {unitsData.length > 0 ? (
                                unitsData.map((data, idx) => {
                                    const unitRecords = records ? records.filter(r => r.unit === data.unit) : [];
                                    const totalDue = unitRecords.filter(r => r.type === 'Receita').reduce((sum, r) => sum + r.amount, 0);

                                    // If any 'Late' or 'Pendente', mark as negative
                                    const hasPending = unitRecords.some(r => r.status === 'Pendente' || r.status === 'Atrasado');
                                    const allPaid = unitRecords.length > 0 && unitRecords.every(r => r.status === 'Pago');

                                    return (
                                        <tr key={`${data.unit}-${idx}`} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{data.unit}</td>
                                            <td className="px-6 py-4">{data.resident}</td>
                                            <td className="px-6 py-4">
                                                {unitRecords.length > 0 ? (
                                                    <span className="text-gray-400">{unitRecords.length} registro(s)</span>
                                                ) : (
                                                    <span className="text-gray-500 italic">Nenhuma cobrança registrada</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {unitRecords.length === 0 ? (
                                                    <span className="text-gray-500">-</span>
                                                ) : hasPending ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                        Pendente / Atrasado
                                                    </span>
                                                ) : allPaid ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        Em Dia
                                                    </span>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                        Nenhuma unidade encontrada. Adicione unidades no cadastro de moradores.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
