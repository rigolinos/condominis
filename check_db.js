import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMaster() {
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.log("Auth Error:", authError);
        return;
    }

    const masterUser = users.users.find(u => u.email === 'rodrigorigofonseca@gmail.com');
    if (!masterUser) {
        console.log("Master user auth missing.");
        return;
    }

    console.log("Auth ID:", masterUser.id);

    const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', masterUser.id)
        .single();

    console.log("Profile Data:", profile);
    console.log("Profile Error:", profError);
}

checkMaster();
