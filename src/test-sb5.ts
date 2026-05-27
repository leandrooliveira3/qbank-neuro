import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://azigaziisnjguakkajza.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KGc2CWNcSy09aeBmSYoEQw_LBxLx4ku';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const { error: e3 } = await supabase.from('active_practice_sessions').select('id').limit(1);
    console.log('active_practice_sessions schema:', e3);
    
    const { error: e4 } = await supabase.from('active_video_session').select('id').limit(1);
    console.log('active_video_session schema:', e4);
}

run();
