"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteAnnouncement(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id)

    if (error) {
        console.error("Erro ao deletar aviso:", error)
        throw new Error("Não foi possível excluir o aviso.")
    }

    revalidatePath("/dashboard")
}

export async function createAnnouncement(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error("Não autenticado.")
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || (profile.role !== "Sindico" && profile.role !== "Conselho" && profile.role !== "Master" && profile.role !== "admin")) {
        throw new Error("Apenas administradores podem criar avisos.")
    }

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const is_urgent = formData.get("is_urgent") === "on"

    if (!title || !content) {
        throw new Error("Título e conteúdo são obrigatórios.")
    }

    const { error } = await supabase
        .from("announcements")
        .insert({
            author_id: user.id,
            title,
            content,
            is_urgent
        })

    if (error) {
        console.error("Erro exato ao criar aviso:", error)
        throw new Error(`Database Error: ${error.message} - ${error.details || error.hint}`)
    }

    revalidatePath("/dashboard")
}
