import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { createTicket, updateTicketStatus, deleteTicket } from "./actions";

export default async function OcorrenciasPage() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.role === "Sindico" || profile?.role === "Conselho";

    // Fetch Tickets. RLS automatically filters:
    // - If Sindico/Conselho: Sees all
    // - If Morador: Sees only their own
    const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
      *,
      profiles:creator_id (full_name, apartment_unit)
    `)
        .order("created_at", { ascending: false });

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                    Central de Atendimento
                </h1>
                <p className="text-gray-400 mt-2">
                    {isAdmin ? "Gerencie os chamados dos moradores." : "Abra chamados para manutenções ou dúvidas."}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Form to open a ticket - Visible to anyone, but mostly used by Morador */}
                <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl h-fit">
                    <h2 className="text-xl font-bold text-white mb-6">Novo Chamado</h2>

                    <form action={async (formData) => {
                        "use server";
                        await createTicket(formData);
                    }} className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Assunto</label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                                placeholder="Ex: Lâmpada queimada 2º Andar"
                            />
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
                            <select
                                id="category"
                                name="category"
                                required
                                className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all appearance-none"
                            >
                                <option value="Elétrica">Elétrica</option>
                                <option value="Hidráulica">Hidráulica</option>
                                <option value="Elevador">Elevador</option>
                                <option value="Limpeza">Limpeza</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descrição do Problema</label>
                            <textarea
                                id="description"
                                name="description"
                                required
                                rows={4}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all resize-none"
                                placeholder="Detalhe o que está acontecendo..."
                            />
                        </div>

                        <div>
                            <label htmlFor="photo" className="block text-sm font-medium text-gray-300 mb-1">Foto (Opcional)</label>
                            <input
                                id="photo"
                                name="photo"
                                type="file"
                                accept="image/*"
                                className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-400 hover:file:bg-indigo-500/30 transition-all cursor-pointer"
                            />
                        </div>

                        <button
                            type="submit"
                            className="mt-2 w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                        >
                            Abrir Chamado
                        </button>
                    </form>
                </div>

                {/* Tickets List View */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    {tickets && tickets.length > 0 ? (
                        tickets.map((ticket) => (
                            <div key={ticket.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-lg hover:border-white/20 transition-all group">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                                            {ticket.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs bg-gray-800 text-gray-300 py-1 px-3 rounded-full border border-white/10">
                                                {ticket.category}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(ticket.created_at).toLocaleDateString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isAdmin && (
                                                <span className="text-xs ml-2 text-indigo-400 font-medium">
                                                    Por: {ticket.profiles?.full_name} (Ap {ticket.profiles?.apartment_unit || 'N/A'})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Badge & Admin Control */}
                                    <div className="flex items-center gap-3">
                                        {isAdmin ? (
                                            <form action={async (formData) => {
                                                "use server";
                                                await updateTicketStatus(ticket.id, formData);
                                            }} className="flex items-center gap-2">
                                                <select
                                                    name="status"
                                                    defaultValue={ticket.status}
                                                    className={`text-sm py-1.5 px-3 rounded-full font-bold appearance-none cursor-pointer border ${ticket.status === 'Aberto' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                                        ticket.status === 'Em Manutenção' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                            'bg-green-500/20 text-green-400 border-green-500/30'
                                                        }`}
                                                >
                                                    <option value="Aberto" className="bg-gray-800 text-amber-400">🚨 Aberto</option>
                                                    <option value="Em Manutenção" className="bg-gray-800 text-blue-400">🔧 Em Manu.</option>
                                                    <option value="Concluído" className="bg-gray-800 text-green-400">✅ Concluído</option>
                                                </select>
                                                <button type="submit" className="text-xs p-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-lg transition-colors" title="Salvar Status">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                </button>
                                            </form>
                                        ) : (
                                            <span className={`py-1.5 px-3 rounded-full text-xs font-bold border ${ticket.status === 'Aberto' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                                ticket.status === 'Em Manutenção' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                    'bg-green-500/20 text-green-400 border-green-500/30'
                                                }`}>
                                                {ticket.status}
                                            </span>
                                        )}

                                        {profile?.role === "Sindico" && (
                                            <form action={async () => {
                                                "use server";
                                                await deleteTicket(ticket.id);
                                            }}>
                                                <button type="submit" className="text-red-400 hover:text-red-300 p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors" title="Excluir Chamado">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-black/20 p-4 rounded-xl text-gray-300 text-sm whitespace-pre-wrap">
                                    {ticket.description}
                                </div>

                                {ticket.photo_url && (
                                    <div className="mt-4">
                                        <span className="text-xs text-gray-500 block mb-2">Anexo:</span>
                                        <a href={ticket.photo_url} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={ticket.photo_url}
                                                alt="Anexo do Chamado"
                                                className="max-h-48 rounded-lg border border-white/10 hover:border-indigo-500/50 transition-all cursor-zoom-in object-cover"
                                            />
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-xl">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 text-gray-500 mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <h3 className="text-xl font-medium text-white mb-2">Sem Chamados</h3>
                            <p className="text-gray-400">Nenhum chamado registrado no momento.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
