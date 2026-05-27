import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://azigaziisnjguakkajza.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KGc2CWNcSy09aeBmSYoEQw_LBxLx4ku';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const { data: ua, error: e2 } = await supabase.from('user_answers').select('*').limit(1);
    console.log('user_answers schema sample:', ua?.[0], e2);
}

run();
