import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://azigaziisnjguakkajza.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KGc2CWNcSy09aeBmSYoEQw_LBxLx4ku';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const payload = {
        id: crypto.randomUUID(),
        user_id: '52b188aa-3542-4026-a7cb-ed880a6f320e',
        front: 'Teste sync',
        back: 'Sync teste',
        interval: 0,
        ease_factor: 2.5,
        repetitions: 0,
        next_review: new Date().toISOString(),
        status: 'new',
        created_at: new Date().toISOString(),
        category: 'Geral',
        bank_name: 'Principal'
    };
    const { error: err } = await supabase.from('flashcards').upsert(payload);
    console.log('upsert err:', err);
}

run();
