'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error, data: authData } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect('/login?message=' + encodeURIComponent(error.message))
    }

    // Bootstrap/Retroactive fix for Master User if account already exists
    if (email.trim().toLowerCase() === 'rodrigorigofonseca@gmail.com' && authData.user) {
        // Must use admin client to force update regardless of RLS
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error: masterErr } = await adminSupabase
            .from('profiles')
            .update({ role: 'Master', is_approved: true })
            .eq('id', authData.user.id)

        console.log("Master Update Error:", masterErr)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const unit = formData.get('unit') as string

    // Auth vars
    const token = formData.get('token') as string | null
    const comprovante = formData.get('comprovante') as File | null

    // 1. Validate Flow Input
    let role = 'Morador'
    let is_approved = false
    let document_url: string | null = null

    const isMaster = email.trim().toLowerCase() === 'rodrigorigofonseca@gmail.com'

    if (isMaster) {
        role = 'Master'
        is_approved = true
    } else if (token) {
        // Valida token (Service Role approach ou RLS bypassing if needed, here we'll assume RLS allows reading if open)
        // Precisamos do service_role para ler invites sem estar logado
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: invite, error: inviteError } = await adminSupabase
            .from('invites')
            .select('*')
            .eq('token', token)
            .eq('used', false)
            .single()

        if (inviteError || !invite) {
            return redirect('/login?message=' + encodeURIComponent('Código de convite inválido ou já utilizado.'))
        }

        role = invite.role
        is_approved = true

        // Mark token as used
        await adminSupabase
            .from('invites')
            .update({ used: true })
            .eq('id', invite.id)

    } else if (comprovante && comprovante.size > 0) {
        // Upload do arquivo para o storage
        const fileExt = comprovante.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('comprovantes')
            .upload(fileName, comprovante, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            console.error("Upload Error: ", uploadError)
            return redirect('/login?message=' + encodeURIComponent('Erro ao enviar o comprovante. Tente novamente.'))
        }

        const { data: { publicUrl } } = supabase.storage
            .from('comprovantes')
            .getPublicUrl(uploadData.path)

        document_url = publicUrl
        is_approved = false

    } else {
        return redirect('/login?message=' + encodeURIComponent('É necessário um token de convite ou enviar um comprovante.'))
    }

    // 2. Create User in Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (authError) {
        return redirect('/login?message=' + encodeURIComponent(authError.message))
    }

    // 3. Insert or Update Profile
    // Wait for triggers to create the profile, or upsert it explicitly.
    // We'll update the existing profile since the trigger (assuming one exists) creates an empty one, or we insert.
    if (authData.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: authData.user.id,
                full_name: name,
                apartment_unit: unit,
                role: role,
                is_approved: is_approved,
                document_url: document_url
            })

        if (profileError) {
            console.error("Profile Setup Error:", profileError)
        }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
