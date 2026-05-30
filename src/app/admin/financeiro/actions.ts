"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addFinancialRecord(formData: FormData) {
    const supabase = await createClient();

    // Basic validation that user is Admin is handled in the page route, 
    // but let's re-verify role for security on mutation.
    const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .single();

    if (!userProfile || (userProfile.role !== "Sindico" && userProfile.role !== "Conselho" && userProfile.role !== "Master")) {
        return { error: "Sem permissão." };
    }

    const description = formData.get("description") as string;
    const amountStr = formData.get("amount") as string;
    const date = formData.get("date") as string;
    const category = formData.get("category") as string;
    const type = formData.get("type") as string;
    const is_private = formData.get("is_private") === "on";
    const file = formData.get("invoice") as File;
    const unit = formData.get("unit") as string | null;
    const status = formData.get("status") as string || 'Pendente';

    if (!description || !amountStr || !date || !category || !type) {
        return { error: "Todos os campos obrigatórios devem ser preenchidos." };
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
        return { error: "Valor inválido." };
    }

    let invoice_url = null;

    // Handle file upload
    if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `invoices/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("attachments")
            .upload(filePath, file);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return { error: "Falha ao fazer upload do comprovante." };
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from("attachments")
            .getPublicUrl(filePath);

        invoice_url = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("financial_records").insert({
        description,
        amount,
        date,
        category,
        type,
        is_private,
        invoice_url,
        unit: unit || null,
        status,
    });

    if (error) {
        console.error("Insert error:", error);
        return { error: "Falha ao salvar o registro financeiro." };
    }

    revalidatePath("/admin/financeiro");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function deleteFinancialRecord(id: string) {
    const supabase = await createClient();

    const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .single();

    if (!userProfile || (userProfile.role !== "Sindico" && userProfile.role !== "Conselho" && userProfile.role !== "Master")) {
        return { error: "Sem permissão." };
    }

    const { error } = await supabase
        .from("financial_records")
        .delete()
        .eq("id", id);

    if (error) {
        return { error: "Erro ao excluir registro." };
    }

    revalidatePath("/admin/financeiro");
    revalidatePath("/dashboard");
    return { success: true };
}
