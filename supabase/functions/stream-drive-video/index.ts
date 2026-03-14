
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: CORS_HEADERS });
  }

  try {
    // 2. Validate Input
    let body;
    try {
        body = await req.json();
    } catch {
        throw new Error("Invalid JSON body");
    }
    
    const { fileId } = body;
    
    if (!fileId) {
      throw new Error("Parâmetro 'fileId' é obrigatório.");
    }

    // 3. Get Environment Credentials
    const clientEmail = Deno.env.get("GOOGLE_CLIENT_EMAIL");
    const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");

    if (!clientEmail || !privateKey) {
      console.error("Missing Google Credentials in Supabase Secrets");
      throw new Error("Credenciais do Google não configuradas (Erro 500)");
    }

    // 4. Generate Google Access Token (OAuth2 via JWT)
    const accessToken = await getGoogleAccessToken(clientEmail, privateKey, SCOPES);

    // 5. Construct Direct Streaming URL
    // We send this so the SW knows where to fetch, but SW will add the token.
    const directUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    // 6. Return JSON to Frontend
    return new Response(
      JSON.stringify({ 
        url: directUrl,
        accessToken: accessToken, // Required for Service Worker Proxy
        fileId: fileId,
        expiresIn: 3600
      }),
      { 
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Edge Function Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});

/**
 * Gera um Access Token do Google usando JWT assinado manualmente.
 */
async function getGoogleAccessToken(clientEmail: string, privateKeyPEM: string, scopes: string[]): Promise<string> {
  // Limpar a chave privada
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  
  let pemContents = privateKeyPEM;
  if (privateKeyPEM.includes(pemHeader)) {
      pemContents = privateKeyPEM.replace(pemHeader, "").replace(pemFooter, "");
  }
  pemContents = pemContents.replace(/\\n/g, "").replace(/\s+/g, "");

  // Importar a chave para Web Crypto API
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

  // Criar JWT
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

  // Assinar
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedToken)
  );
  const signature = btoaUrl(arrayBufferToString(signatureBuffer));
  const jwt = `${unsignedToken}.${signature}`;

  // Trocar JWT por Access Token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Google Auth Failed: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

// Utilitários de Encoding
function btoaUrl(str: string): string {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
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
