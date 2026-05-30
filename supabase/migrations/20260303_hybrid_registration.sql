-- 1. Create table `invites` for tokens
CREATE TABLE IF NOT EXISTS invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    unit TEXT NOT NULL,
    role user_role DEFAULT 'Morador',
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para tabela invites
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Apenas Sindico/Conselho pode gerenciar convites
CREATE POLICY "Gerenciar convites - Sindico/Conselho" ON invites
    FOR ALL USING (public.get_my_role() IN ('Sindico', 'Conselho'));

-- 2. Update `profiles` table for manual approval flow
ALTER TABLE profiles
ADD COLUMN is_approved BOOLEAN DEFAULT false,
ADD COLUMN document_url TEXT;

-- Atualizar perfis existentes para is_approved = true para não quebrar quem já está logado
UPDATE profiles SET is_approved = true WHERE is_approved = false;

-- 3. Create bucket for upload comprovantes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprovantes', 'comprovantes', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket 'comprovantes' (Usuários não autenticados podem fazer upload temporário, e Sindicos podem ler)
CREATE POLICY "Upload Comprovantes Anônimos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'comprovantes'
        -- Permite que usuários na tela de cadastro enviem arquivos antes da criação ser 100% finalizada (ou logo após, via server action)
    );

CREATE POLICY "Sindicos visualizam comprovantes" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'comprovantes' AND public.get_my_role() IN ('Sindico', 'Conselho')
    );
