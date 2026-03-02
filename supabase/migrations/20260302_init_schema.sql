-- Habilitar a extensão UUID, se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Criação dos ENUMs
CREATE TYPE user_role AS ENUM ('Morador', 'Sindico', 'Conselho');
CREATE TYPE ticket_status AS ENUM ('Aberto', 'Em Manutenção', 'Concluído');
CREATE TYPE ticket_category AS ENUM ('Elétrica', 'Hidráulica', 'Elevador', 'Limpeza', 'Outros');
CREATE TYPE transaction_type AS ENUM ('Receita', 'Despesa');

-- 2. Criação das Tabelas

-- Tabela Profiles (vinculada ao auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    apartment_unit TEXT,
    role user_role DEFAULT 'Morador',
    is_owner BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela Financial Records
CREATE TABLE financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    type transaction_type NOT NULL,
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela Announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_urgent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela Tickets
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category ticket_category NOT NULL,
    status ticket_status DEFAULT 'Aberto',
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitando Row Level Security (RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (Policies)

-- PROFILES
-- Qualquer pessoa autenticada pode ver perfis (necessário para listar moradores/sindico)
CREATE POLICY "Perfis são visíveis para todos autenticados" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Usuário pode atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- FINANCIAL RECORDS
-- Todos os moradores/autenticados podem ver os registros financeiros (Transparência)
CREATE POLICY "Todos podem visualizar registros financeiros" ON financial_records
    FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas Sindico ou Conselho podem inserir/editar/deletar finanças
CREATE POLICY "Apenas Sindico e Conselho podem gerenciar finanças" ON financial_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Sindico', 'Conselho')
        )
    );

-- ANNOUNCEMENTS
-- Todos podem ver os avisos
CREATE POLICY "Todos podem visualizar avisos" ON announcements
    FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas Sindico ou Conselho podem criar/editar/deletar avisos
CREATE POLICY "Apenas Sindico e Conselho podem gerenciar avisos" ON announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Sindico', 'Conselho')
        )
    );

-- TICKETS
-- Usuários podem ver todos os tickets ou apenas os seus? 
-- Regra básica: Todos podem ver todos os tickets (transparência de manutenções no prédio) 
-- ou Sindico vê tudo, morador vê apenas os seus. Vamos assumir: Sindico vê tudo, morador vê os seus.
CREATE POLICY "Sindico vê todos os tickets" ON tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Sindico'
        )
    );

CREATE POLICY "Morador vê os próprios tickets" ON tickets
    FOR SELECT USING (auth.uid() = creator_id);

-- Qualquer um pode criar tickets
CREATE POLICY "Usuários podem criar tickets" ON tickets
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Apenas Sindico pode alterar os tickets (ex: mudar status)
CREATE POLICY "Apenas Sindico pode atualizar tickets" ON tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'Sindico'
        )
    );

-- 5. Criação do Bucket no Storage
-- Nota: Isso geralmente pode ser feito pela interface do Supabase, mas via SQL:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true);

-- Políticas para o bucket 'attachments' (Usuários autenticados podem fazer upload, e todos podem ler)
CREATE POLICY "Visualização pública de attachments" ON storage.objects
    FOR SELECT USING (bucket_id = 'attachments');

CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'attachments' AND auth.role() = 'authenticated'
    );
