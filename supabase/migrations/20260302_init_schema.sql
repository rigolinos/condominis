-- Habilitar a extensão UUID, se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Criação dos ENUMs
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Morador', 'Sindico', 'Conselho');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('Aberto', 'Em Manutenção', 'Concluído');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_category AS ENUM ('Elétrica', 'Hidráulica', 'Elevador', 'Limpeza', 'Outros');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('Receita', 'Despesa');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criação das Tabelas

-- Tabela Profiles (vinculada ao auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    apartment_unit TEXT,
    role user_role DEFAULT 'Morador',
    is_owner BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela Financial Records
CREATE TABLE IF NOT EXISTS financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    type transaction_type NOT NULL,
    invoice_url TEXT,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_urgent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela Tickets
CREATE TABLE IF NOT EXISTS tickets (
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

-- 4. Função Auxiliar para Roles (Evita Recursão no RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- Indice para performance nas consultas de RLS baseadas em role (Recomendação do Supabase)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 5. Políticas de Segurança (Policies)

-- PROFILES
-- Proteção de Perfil: Vê a si mesmo, ou vê síndico. Síndico/Conselho vê todos.
CREATE POLICY "View_Profiles" ON profiles
    FOR SELECT USING (
        id = auth.uid() 
        OR role = 'Sindico' 
        OR public.get_my_role() IN ('Sindico', 'Conselho')
    );

CREATE POLICY "Update_Own_Profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- FINANCIAL RECORDS
-- Sigilo de Inadimplência
CREATE POLICY "View_Financial" ON financial_records
    FOR SELECT USING (
        is_private = false
        OR public.get_my_role() IN ('Sindico', 'Conselho')
    );

CREATE POLICY "Manage_Financial" ON financial_records
    FOR ALL USING (public.get_my_role() IN ('Sindico', 'Conselho'));

-- ANNOUNCEMENTS
-- Autoridade do Mural
CREATE POLICY "View_Announcements" ON announcements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Manage_Announcements" ON announcements
    FOR ALL USING (public.get_my_role() IN ('Sindico', 'Master', 'admin', 'Conselho'));

-- TICKETS
-- Isolamento de Ocorrências
CREATE POLICY "View_Tickets" ON tickets
    FOR SELECT USING (
        creator_id = auth.uid() 
        OR public.get_my_role() IN ('Sindico', 'Conselho') 
    );

CREATE POLICY "Insert_Tickets" ON tickets
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Update_Tickets" ON tickets
    FOR UPDATE USING (
        creator_id = auth.uid() 
        OR public.get_my_role() IN ('Sindico')
    );

CREATE POLICY "Delete_Tickets" ON tickets
    FOR DELETE USING (public.get_my_role() = 'Sindico');

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
