-- 1. Add Master to user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Master';

-- 2. Create Global Bypass Policies for Master user
-- Profiles
CREATE POLICY "Master_Bypass_Profiles" ON profiles FOR ALL USING (public.get_my_role() = 'Master');

-- Financial Records
CREATE POLICY "Master_Bypass_Financial" ON financial_records FOR ALL USING (public.get_my_role() = 'Master');

-- Announcements
CREATE POLICY "Master_Bypass_Announcements" ON announcements FOR ALL USING (public.get_my_role() = 'Master');

-- Tickets
CREATE POLICY "Master_Bypass_Tickets" ON tickets FOR ALL USING (public.get_my_role() = 'Master');

-- Invites
CREATE POLICY "Master_Bypass_Invites" ON invites FOR ALL USING (public.get_my_role() = 'Master');

-- Storage (comprovantes e attachments)
CREATE POLICY "Master pode gerenciar arquivos (comprovantes)" ON storage.objects
    FOR ALL USING (
        bucket_id = 'comprovantes' AND public.get_my_role() = 'Master'
    );
    
CREATE POLICY "Master pode gerenciar arquivos (attachments)" ON storage.objects
    FOR ALL USING (
        bucket_id = 'attachments' AND public.get_my_role() = 'Master'
    );
