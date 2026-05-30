-- Force Profile insert/update for Master User

DO $$
DECLARE
    master_uid uuid;
BEGIN
    SELECT id INTO master_uid FROM auth.users WHERE email = 'rodrigorigofonseca@gmail.com';

    IF master_uid IS NOT NULL THEN
        -- Check if profile exists
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = master_uid) THEN
            UPDATE public.profiles 
            SET role = 'Master', is_approved = true 
            WHERE id = master_uid;
        ELSE
            INSERT INTO public.profiles (id, full_name, apartment_unit, role, is_approved)
            VALUES (master_uid, 'Master Admin', 'Apt 000', 'Master', true);
        END IF;
    END IF;
END $$;
