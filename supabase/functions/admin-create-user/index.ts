
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    if (!authHeader) throw new Error("Não autorizado");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(token);
    
    if (callerError || !caller) throw new Error("Sessão administrativa expirada");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, email")
      .eq("id", caller.id)
      .maybeSingle();

    const isMasterAdmin = caller.email === 'steamleandro@hotmail.com' || profile?.email === 'steamleandro@hotmail.com';
    const hasAdminRole = profile?.role === "admin";

    const { action, email, password, full_name, role, userId } = await req.json();
    const isSelfDelete = action === 'delete' && userId === caller.id;

    if (!isMasterAdmin && !hasAdminRole && !isSelfDelete) {
      throw new Error("Acesso negado.");
    }

    if (action === 'sync_profiles') {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        if (listError) throw listError;
        let syncedCount = 0;
        for (const u of users) {
            const { data: existing } = await supabaseAdmin.from('profiles').select('id').eq('id', u.id).maybeSingle();
            if (!existing) {
                await supabaseAdmin.from('profiles').insert({
                    id: u.id,
                    email: u.email,
                    full_name: u.user_metadata?.full_name || 'Usuário Recuperado',
                    role: (u.user_metadata?.role as string) || 'user',
                    status: 'approved',
                    created_at: u.created_at
                });
                syncedCount++;
            }
        }
        return new Response(JSON.stringify({ success: true, count: syncedCount }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }

    // --- NOVA AÇÃO: RESET GLOBAL DE XP ---
    if (action === 'reset_xp_global') {
        if (!isMasterAdmin) throw new Error("Apenas Master Admin pode zerar o ranking.");
        
        // Update all profiles to 0 XP and level 1
        const { error: resetError, count } = await supabaseAdmin
            .from('profiles')
            .update({ 
                xp: 0, 
                level: 1, 
                rank: 'Calouro da Sinapse',
                streak_count: 0 // Opcional: Zerar streak também para igualdade total
            })
            .neq('id', '00000000-0000-0000-0000-000000000000') // Safety check (all non-null ids)
            .select('id', { count: 'exact' });

        if (resetError) throw resetError;

        // Limpa histórico de XP para consistência
        await supabaseAdmin.from('xp_history').delete().neq('id', '0000');

        return new Response(JSON.stringify({ success: true, count }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }

    if (action === 'create') {
      const targetEmail = email.trim().toLowerCase();
      const { data: existing } = await supabaseAdmin.from("profiles").select("id, deleted_at").eq("email", targetEmail).maybeSingle();
      if (existing && !existing.deleted_at) throw new Error("Este e-mail já está em uso.");

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: targetEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name }
      });
      if (createError) throw createError;
      
      if (newUser.user) {
        await supabaseAdmin.from("profiles").upsert({ id: newUser.user.id, email: targetEmail, full_name: full_name, role: role || "user", status: 'approved' });
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }

    if (action === 'approve') {
        if (!userId) throw new Error("ID necessário");
        await supabaseAdmin.from("profiles").update({ status: 'approved' }).eq("id", userId);
        return new Response(JSON.stringify({ success: true }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }

    if (action === 'delete') {
      if (!userId) throw new Error("ID do usuário é obrigatório.");
      await supabaseAdmin.from("profiles").update({ deleted_at: new Date().toISOString(), status: 'deleted' }).eq("id", userId);
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;
      return new Response(JSON.stringify({ success: true }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }

    if (action === 'cleanup') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { error: cleanupError } = await supabaseAdmin.from('profiles').delete().lt('deleted_at', sevenDaysAgo.toISOString());
        if (cleanupError) throw cleanupError;
        return new Response(JSON.stringify({ success: true }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }

    if (action === 'update-password') {
      if (!userId || !password) throw new Error("Dados insuficientes.");
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      if (updateError) throw updateError;
      return new Response(JSON.stringify({ success: true }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
    }

    throw new Error("Ação inválida.");

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
});
