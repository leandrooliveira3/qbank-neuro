import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://azigaziisnjguakkajza.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KGc2CWNcSy09aeBmSYoEQw_LBxLx4ku';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const { data: fc, error: e1 } = await supabase.from('flashcards').select('*').limit(1);
    console.log('Flashcards schema sample:', fc?.[0], e1);
    
    const { data: q, error: e2 } = await supabase.from('questions').select('*').limit(1);
    console.log('Questions schema sample:', q?.[0], e2);
}

run();
