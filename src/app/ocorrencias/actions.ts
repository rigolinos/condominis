"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTicket(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Não autenticado." };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const file = formData.get("photo") as File;

    if (!title || !description || !category) {
        return { error: "Todos os campos obrigatórios devem ser preenchidos." };
    }

    let photo_url = null;

    if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `tickets/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("attachments")
            .upload(filePath, file);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return { error: "Falha ao fazer upload da foto." };
        }

        const { data: publicUrlData } = supabase.storage
            .from("attachments")
            .getPublicUrl(filePath);

        photo_url = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("tickets").insert({
        creator_id: user.id,
        title,
        description,
        category,
        photo_url,
        status: 'Aberto'
    });

    if (error) {
        console.error("Insert ticket error:", error);
        return;
    }

    revalidatePath("/ocorrencias");
}

export async function updateTicketStatus(id: string, formData: FormData) {
    const supabase = await createClient();

    const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (await supabase.auth.getUser()).data.user?.id) // MUST bind to user id!! It was targeting a random profile before.
        .single();

    if (!userProfile || (userProfile.role !== "Sindico" && userProfile.role !== "Conselho" && userProfile.role !== "Master")) {
        return;
    }

    const newStatus = formData.get("status") as string;

    const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", id);

    if (error) {
        return;
    }

    revalidatePath("/ocorrencias");
}

export async function deleteTicket(id: string) {
    const supabase = await createClient();

    // RLS will also block this, but we check here too
    const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (await supabase.auth.getUser()).data.user?.id) // Same here
        .single();

    if (!userProfile || (userProfile.role !== "Sindico" && userProfile.role !== "Master")) {
        return;
    }

    const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", id);

    if (error) {
        return;
    }

    revalidatePath("/ocorrencias");
}
