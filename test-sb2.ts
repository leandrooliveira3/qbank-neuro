import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://azigaziisnjguakkajza.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KGc2CWNcSy09aeBmSYoEQw_LBxLx4ku';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const { data: serverExisting, error: checkErr } = await supabase.from('flashcards').select('updated_at, created_at, answered_at, last_review').limit(1).maybeSingle();
    console.log('checkErr:', checkErr);
}

run();
