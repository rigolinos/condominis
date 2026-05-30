import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createBooking } from "./actions";

export default async function ReservasPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    // Fetch existing bookings to show
    const { data: bookings, error } = await supabase
        .from("amenity_bookings")
        .select(`*, profiles(full_name, apartment_unit)`)
        .order("booking_date", { ascending: true });

    const isMissingTable = error && error.message.includes('relation "amenity_bookings" does not exist');

    return (
        <div className="min-h-screen w-full bg-[#030712] text-white selection:bg-blue-500/30 overflow-hidden relative">
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen pointer-events-none animate-pulse-slow object-cover" />

            <nav className="fixed top-0 w-full z-50 glass border-b border-white/5 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <span className="text-white font-bold text-sm">C</span>
                            </div>
                            <span className="font-semibold text-lg tracking-tight">Condominis</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-gray-400">
                            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                            <Link href="/ocorrencias" className="hover:text-white transition-colors">Ocorrências</Link>
                            <Link href="/reservas" className="text-white hover:text-blue-400 transition-colors">Reservas</Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-16 relative z-10">
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
                        Reservas de Áreas Comuns
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Solicite a locação do Salão de Festas, Churrasqueira ou Piscina.
                    </p>
                </div>

                {isMissingTable && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
                        <strong>Atenção:</strong> Tabela de reservas não encontrada. O administrador precisa rodar a migração SQL no Supabase.
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 glass rounded-2xl p-6 border border-white/10 relative">
                        <h2 className="text-xl font-bold text-white mb-6">Nova Reserva</h2>
                        <form action={createBooking} className="flex flex-col gap-5">
                            <div>
                                <label htmlFor="amenity_name" className="block text-sm font-medium text-gray-300 mb-1">Selecione a Área</label>
                                <select
                                    id="amenity_name"
                                    name="amenity_name"
                                    required
                                    className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all appearance-none"
                                >
                                    <option value="Salão de Festas">Salão de Festas</option>
                                    <option value="Churrasqueira">Churrasqueira</option>
                                    <option value="Piscina">Piscina</option>
                                    <option value="Quadra Poliesportiva">Quadra Poliesportiva</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="booking_date" className="block text-sm font-medium text-gray-300 mb-1">Data da Reserva</label>
                                <input
                                    id="booking_date"
                                    name="booking_date"
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all [color-scheme:dark]"
                                />
                            </div>

                            <button
                                type="submit"
                                className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                            >
                                Solicitar Reserva
                            </button>
                            <p className="text-xs text-gray-500 mt-2 text-center">O síndico será notificado automaticamente da sua solicitação.</p>
                        </form>
                    </div>

                    <div className="lg:col-span-2 glass rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">Agenda Confirmada</h2>
                        </div>
                        <div className="p-6">
                            {bookings && bookings.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {bookings.map((b) => (
                                        <div key={b.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2">
                                            <div className="flex justify-between">
                                                <h3 className="font-semibold text-blue-400">{b.amenity_name}</h3>
                                                <span className="text-xs text-gray-400">{new Date(b.booking_date).toLocaleDateString("pt-BR", { timeZone: 'UTC' })}</span>
                                            </div>
                                            <p className="text-sm text-gray-300">
                                                {b.profiles?.full_name} <span className="text-gray-500 text-xs">({b.profiles?.apartment_unit})</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic text-center py-8">
                                    Nenhuma reserva marcada no momento.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
