import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
for (const line of envFile.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let key = match[1];
        let value = match[2] || '';
        value = value.replace(/(^['"]|['"]$)/g, '').trim();
        envVars[key] = value;
    }
}

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        const { data: usersData, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) return console.log("Erro no Auth:", authError.message);

        const myUser = usersData.users.find(u => u.email === 'rodrigorigofonseca@gmail.com');
        if (!myUser) return console.log("Usuário rodrigorigofonseca@gmail.com não encontrado!");

        console.log("Tentando criar aviso para o usuario:", myUser.id);

        const { data, error } = await supabase
            .from("announcements")
            .insert({
                author_id: myUser.id,
                title: "Aviso de Teste Automático Backend",
                content: "Isso é um teste",
                is_urgent: true
            })
            .select();

        if (error) {
            console.error("❌ Erro exato recebido do banco:", JSON.stringify(error, null, 2));
        } else {
            console.log("✅ Aviso criado com sucesso via API!", data);

            // Cleanup
            await supabase.from("announcements").delete().eq("id", data[0].id);
        }

    } catch (e) {
        console.error("❌ Erro inesperado:", e);
    }
}

run();
