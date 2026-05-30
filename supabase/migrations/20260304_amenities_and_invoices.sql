-- Adicionar colunas em financial_records
ALTER TABLE financial_records
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pendente';

-- Tabela de Reservas de Áreas Comuns
CREATE TABLE IF NOT EXISTS amenity_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    amenity_name TEXT NOT NULL,
    booking_date DATE NOT NULL,
    status TEXT DEFAULT 'Pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(amenity_name, booking_date)
);

-- RLS para Reservas
ALTER TABLE amenity_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View_Bookings" ON amenity_bookings
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Insert_Bookings" ON amenity_bookings
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Update_Bookings" ON amenity_bookings
    FOR UPDATE USING (
        user_id = auth.uid() OR public.get_my_role() IN ('Sindico', 'Conselho')
    );

CREATE POLICY "Delete_Bookings" ON amenity_bookings
    FOR DELETE USING (
        user_id = auth.uid() OR public.get_my_role() IN ('Sindico', 'Conselho')
    );
