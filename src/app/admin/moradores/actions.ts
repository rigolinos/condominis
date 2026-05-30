import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Inicializa o cliente admin com a service_role_key para bypassar o RLS e gerenciar usuários auth
const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function addResident(formData: FormData) {
    const supabase = await createClient()

    // 1. Validar se quem está chamando é o Síndico
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autenticado")

    const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (myProfile?.role !== 'Sindico' && myProfile?.role !== 'Master') {
        throw new Error("Acesso negado. Apenas o Síndico pode adicionar moradores.")
    }

    const email = formData.get('email') as string
    const nome = formData.get('nome') as string
    const unidade = formData.get('unidade') as string
    const role = formData.get('role') as string || 'Morador'
    // Geramos uma senha padrão provisória baseada na unidade ou algo genérico
    const defaultPassword = `Condo@${unidade.replace(/\s/g, '')}`

    try {
        // 2. Criar o usuário no Auth (Admin)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: defaultPassword,
            email_confirm: true // Pula a confirmação via email para facilitar
        })

        if (authError) throw authError

        const newUserId = authData.user.id

        // 3. Inserir o perfil correspondente
        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
            id: newUserId,
            full_name: nome,
            apartment_unit: unidade,
            role: role,
            is_owner: false
        })

        if (profileError) {
            // Rollback auth user creation if profile fails
            await supabaseAdmin.auth.admin.deleteUser(newUserId)
            throw profileError
        }

        revalidatePath('/admin/moradores')
        return

    } catch (error: any) {
        console.error("Erro ao adicionar morador:", error)
        return
    }
}

export async function deleteResident(userId: string) {
    const supabase = await createClient()

    // 1. Validar se quem está chamando é o Síndico
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autenticado")

    if (user.id === userId) throw new Error("Você não pode excluir a si mesmo.")

    const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (myProfile?.role !== 'Sindico' && myProfile?.role !== 'Master') {
        throw new Error("Acesso negado.")
    }

    // Deleta o usuário da tabela auth. O ON DELETE CASCADE na tabela profiles cuidará do resto
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
        console.error("Erro ao deletar morador:", error)
        throw new Error(error.message)
    }

    revalidatePath('/admin/moradores')
}

export async function updateResidentUnit(userId: string, newUnit: string) {
    const supabase = await createClient()

    // 1. Validar se quem está chamando é o Síndico
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autenticado")

    const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (myProfile?.role !== 'Sindico' && myProfile?.role !== 'Master') {
        throw new Error("Acesso negado.")
    }

    const { error } = await supabaseAdmin.from('profiles')
        .update({ apartment_unit: newUnit })
        .eq('id', userId)

    if (error) {
        console.error("Erro ao atualizar unidade:", error)
        throw new Error(error.message)
    }

    revalidatePath('/admin/moradores')
}

export async function generateInvite(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autenticado")

    const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (myProfile?.role !== 'Sindico' && myProfile?.role !== 'Master') {
        throw new Error("Acesso negado.")
    }

    const unit = formData.get('unidade_convite') as string
    const role = formData.get('role_convite') as string

    // Generate random 6 char token
    const token = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { error } = await supabaseAdmin.from('invites').insert({
        token,
        unit,
        role,
        used: false
    })

    if (error) {
        console.error("Erro ao gerar convite:", error)
        throw new Error(error.message)
    }

    revalidatePath('/admin/moradores')

    const { redirect } = await import('next/navigation')
    redirect(`/admin/moradores?generatedToken=${token}`)
}

export async function approveResident(userId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autenticado")

    const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (myProfile?.role !== 'Sindico' && myProfile?.role !== 'Master') {
        throw new Error("Acesso negado.")
    }

    const { error } = await supabaseAdmin.from('profiles')
        .update({ is_approved: true })
        .eq('id', userId)

    if (error) {
        console.error("Erro ao aprovar residente:", error)
        throw new Error(error.message)
    }

    revalidatePath('/admin/moradores')
}

export async function rejectResident(userId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Não autenticado")

    const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (myProfile?.role !== 'Sindico' && myProfile?.role !== 'Master') {
        throw new Error("Acesso negado.")
    }

    // Deleta o usário e o perfil em cascata
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
        console.error("Erro ao rejeitar/deletar residente:", error)
        throw new Error(error.message)
    }

    revalidatePath('/admin/moradores')
}
