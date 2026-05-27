
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

declare const Deno: any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: CORS_HEADERS });
  }

  try {
    // Parâmetros de Entrada
    const { pageToken, action, threshold, mode = 'videos' } = await req.json().catch(() => ({ pageToken: null }));
    
    // Configuração baseada no modo (Vídeos ou Materiais)
    const isMaterialMode = mode === 'materials';
    const targetTable = isMaterialMode ? 'didactic_materials' : 'videos';
    const mimeQuery = isMaterialMode 
        ? "(mimeType = 'application/pdf' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'application/vnd.google-apps.document')"
        : "mimeType contains 'video/'";
    
    console.log(`🚀 [EDGE] Sync Mode: ${mode} -> Table: ${targetTable}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // --- AÇÃO: PRUNE (LIMPEZA) ---
    if (action === 'prune') {
        if (!threshold) throw new Error("Parâmetro 'threshold' obrigatório para limpeza.");
        
        console.log(`🗑️ [EDGE] Limpeza ${targetTable} anterior a ${threshold}...`);
        
        // CRITICAL FIX: Delete based on updated_at, not created_at. 
        // Files found during sync have their updated_at refreshed. Files NOT found retain old updated_at.
        const { error, count } = await supabaseAdmin
            .from(targetTable)
            .delete({ count: 'exact' })
            .not('drive_file_id', 'is', null)
            .lt('updated_at', threshold); 
            
        if (error) throw error;
        
        return new Response(
            JSON.stringify({ success: true, deletedCount: count }),
            { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 200 }
        );
    }

    // --- FLUXO NORMAL: SINCRONIZAÇÃO DO DRIVE ---

    const clientEmail = Deno.env.get("GOOGLE_CLIENT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");

    if (!clientEmail || !privateKey) {
      throw new Error("Credenciais do Google não configuradas.");
    }

    const accessToken = await getGoogleAccessToken(clientEmail, privateKey, SCOPES);

    // --- PASSO 1: MAPEAR ESTRUTURA DE PASTAS (Cache Simples) ---
    const folderMap = new Map<string, {name: string, parentId?: string}>();
    let folderPageToken = null;
    let hasMoreFolders = true;

    do {
        const qFolder = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
        let urlFolder = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(qFolder)}&fields=nextPageToken,files(id,name,parents)&pageSize=1000`;
        if (folderPageToken) urlFolder += `&pageToken=${folderPageToken}`;

        const resF = await fetch(urlFolder, { headers: { Authorization: `Bearer ${accessToken}` } });
        const dataF = await resF.json();
        
        if (dataF.files) {
            dataF.files.forEach((f: any) => {
                folderMap.set(f.id, { name: f.name, parentId: f.parents?.[0] });
            });
        }
        folderPageToken = dataF.nextPageToken;
        if (!folderPageToken) hasMoreFolders = false;
    } while (hasMoreFolders);

    const buildPath = (folderId: string | undefined): string => {
        if (!folderId || !folderMap.has(folderId)) return "";
        const folder = folderMap.get(folderId)!;
        const parentPath = buildPath(folder.parentId);
        return parentPath ? `${parentPath}/${folder.name}` : folder.name;
    };

    // --- PASSO 2: LISTAR ARQUIVOS ---
    const query = `${mimeQuery} and trashed = false`;
    const fields = "nextPageToken,files(id,name,mimeType,size,createdTime,videoMediaMetadata,parents,description,webContentLink,webViewLink)";
    
    let driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${fields}&pageSize=50`;
    if (pageToken) {
        driveUrl += `&pageToken=${pageToken}`;
    }

    const driveRes = await fetch(driveUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!driveRes.ok) {
      const err = await driveRes.text();
      throw new Error(`Erro Google Drive API: ${err}`);
    }

    const driveData = await driveRes.json();
    const files = driveData.files || [];
    const nextPageToken = driveData.nextPageToken || null;

    console.log(`📂 [EDGE] Processando ${files.length} arquivos (${mode})...`);

    const logs: string[] = [];
    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    for (const file of files) {
        // Caminho Real
        const parentId = file.parents?.[0];
        const fullPath = buildPath(parentId) || "Geral";
        const pathParts = fullPath.split('/');
        
        // Link de Download/Preview
        // Para vídeos, usamos preview. Para materiais, download direto.
        let fileUrl = "";
        if (isMaterialMode) {
            fileUrl = `https://drive.google.com/uc?id=${file.id}&export=download`;
        } else {
            fileUrl = `https://drive.google.com/file/d/${file.id}/preview`;
        }

        const { data: existing } = await supabaseAdmin
            .from(targetTable)
            .select('id')
            .eq('drive_file_id', file.id)
            .maybeSingle();

        const payload: any = {
            title: file.name.replace(/\.[^/.]+$/, ""), // Remove extensão para título
            description: file.description || `Path: ${fullPath}`,
            mime_type: file.mimeType,
            size_bytes: file.size,
            drive_path: fullPath,
            drive_file_id: file.id,
            // CRITICAL: Always update timestamp to prevent pruning
            updated_at: new Date().toISOString()
        };

        if (isMaterialMode) {
            payload.download_url = fileUrl;
        } else {
            payload.url = fileUrl;
            payload.status = 'active';
            payload.bank_name = pathParts[0] || "Geral";
            payload.category = pathParts.length > 1 ? pathParts[pathParts.length - 1] : 'Geral';
            // Tratamento de Duração (Apenas Vídeos)
            if (file.videoMediaMetadata && file.videoMediaMetadata.durationMillis) {
                payload.duration_seconds = Math.round(parseInt(file.videoMediaMetadata.durationMillis) / 1000);
            } else {
                payload.duration_seconds = 0;
            }
        }

        if (existing) {
            // Update
            const { error: updateError } = await supabaseAdmin
                .from(targetTable)
                .update(payload)
                .eq('id', existing.id);

            if (!updateError) updatedCount++;
            else console.error(`Erro update ${file.id}:`, updateError);
        } else {
            // Insert
            payload.created_at = new Date().toISOString();
            const { error: insertError } = await supabaseAdmin
                .from(targetTable)
                .insert(payload);

            if (!insertError) {
                createdCount++;
                logs.push(`Novo: ${payload.title}`);
            } else {
                console.error(`Erro insert ${file.id}:`, insertError);
            }
        }
        processedCount++;
    }

    if (updatedCount > 0) logs.push(`Sincronizados: ${updatedCount}`);
    if (createdCount > 0) logs.push(`Adicionados: ${createdCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        nextPageToken: nextPageToken,
        logs: logs.slice(0, 20) 
      }),
      { 
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("❌ [EDGE] Erro fatal:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});

// --- Auth Helpers (JWT) ---
async function getGoogleAccessToken(clientEmail: string, privateKeyPEM: string, scopes: string[]): Promise<string> {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  let pemContents = privateKeyPEM;
  if (privateKeyPEM.includes(pemHeader)) {
      pemContents = privateKeyPEM.replace(pemHeader, "").replace(pemFooter, "");
  }
  pemContents = pemContents.replace(/\\n/g, "").replace(/\s+/g, "");

  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: clientEmail,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = btoaUrl(JSON.stringify(header));
  const encodedClaimSet = btoaUrl(JSON.stringify(claimSet));
  const unsignedToken = `${encodedHeader}.${encodedClaimSet}`;

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedToken)
  );
  const signature = btoaUrl(arrayBufferToString(signatureBuffer));
  const jwt = `${unsignedToken}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Google Auth Failed: ${data.error_description}`);
  return data.access_token;
}

function btoaUrl(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function arrayBufferToString(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}
