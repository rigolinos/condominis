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
        const { data, error } = await supabase.rpc('get_policies')
        if (error) {
            console.log("no rpc getting raw query")
            const { data: qData, error: qError } = await supabase.from('pg_policies').select('*').limit(50);
            console.log("Policies:", qData, qError)
        }
    } catch (e) {
        console.error("❌ Erro inesperado:", e);
    }
}

run();
