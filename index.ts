// Supabase Edge Function : envoie le ticket par mail via ton compte Gmail.
// Le mot de passe d'application Gmail n'est JAMAIS dans ce fichier : il est lu
// depuis une variable d'environnement (secret) configurée sur Supabase,
// jamais exposée au navigateur ni poussée sur GitHub.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const GMAIL_USER = Deno.env.get("GMAIL_USER")!;
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to_email, to_name, prenom, communaute, ville, ticket_number, qr_url } = await req.json();

    if (!to_email || !ticket_number) {
      return new Response(JSON.stringify({ error: "Champs manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <div style="font-family: Georgia, serif; background:#121110; padding:30px;">
        <div style="max-width:420px; margin:0 auto; background:#1E1A15; color:#F3E9D6; border-radius:20px; overflow:hidden; border:1px solid rgba(201,162,39,0.3);">
          <div style="padding:30px; text-align:center;">
            <div style="font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#A6231F;">Ticket confirmé</div>
            <h1 style="font-size:24px; margin:10px 0; color:#F3E9D6;">${to_name}</h1>
            <div style="font-family:monospace; color:#A6231F; font-size:14px;">${ticket_number}</div>
          </div>
          <div style="border-top:2px dashed rgba(201,162,39,0.3);"></div>
          <div style="padding:22px 30px 30px; text-align:center;">
            <p style="font-size:14px; color:rgba(243,233,214,0.85); line-height:1.6;">
              Ton inscription pour <strong>Holy Brunch × Christ's Lovers</strong> est confirmée.<br>
              Communauté : ${communaute} — Ville : ${ville}
            </p>
            <img src="${qr_url}" width="140" height="140" style="background:#fff; padding:8px; border-radius:10px; margin:16px 0;">
            <p style="font-size:13px; color:rgba(243,233,214,0.7);">
              Présente ce ticket (ou ce QR code) le jour de l'événement.<br>
              Une famille, une foi, un feu 🔥
            </p>
          </div>
        </div>
      </div>`;

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: GMAIL_USER,
          password: GMAIL_APP_PASSWORD,
        },
      },
    });

    await client.send({
      from: `Holy Brunch × Christ's Lovers <${GMAIL_USER}>`,
      to: to_email,
      subject: "Ton ticket — Holy Brunch × Christ's Lovers 🔥",
      html: html,
      content: "auto",
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
