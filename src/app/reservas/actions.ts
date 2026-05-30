"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createBooking(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Não autorizado" };
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    const amenity_name = formData.get("amenity_name") as string;
    const booking_date = formData.get("booking_date") as string;

    if (!amenity_name || !booking_date) {
        return { error: "Campos obrigatórios" };
    }

    // Insert booking
    const { error: bookingError } = await supabase.from("amenity_bookings").insert({
        user_id: user.id,
        amenity_name,
        booking_date,
        status: 'Confirmado'
    });

    if (bookingError) {
        if (bookingError.code === '23505') { // Unique violation
            console.error("Data Indisponível (Já existe uma reserva)");
            // ideally we would return an error object and display it on the frontend.
        }
        console.error("Erro na reserva:", bookingError);
    } else {
        // Automatic announcement for Síndico viewing
        // To be viewed by Síndico, it sits in the announcements table
        const unitDisplay = profile.apartment_unit || 'Sem Unidade';
        const dateFormatted = new Date(booking_date).toLocaleDateString("pt-BR", { timeZone: 'UTC' });

        await supabase.from("announcements").insert({
            author_id: user.id,
            title: `Nova Reserva: ${amenity_name}`,
            content: `A área ${amenity_name} foi reservada para o dia ${dateFormatted} pelo morador ${profile.full_name} (${unitDisplay}).`,
            is_urgent: false
        });
    }

    revalidatePath("/reservas");
    revalidatePath("/dashboard");
}
