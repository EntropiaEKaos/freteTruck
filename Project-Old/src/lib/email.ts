// Professional e-mail layer — Resend-ready
// Configure RESEND_API_KEY in .env to send real e-mails.
// Without the key, e-mails are logged in dev mode (never thrown).

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "FreteTruck <nao-responder@fretetruck.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

type MailPayload = {
  to: string;
  subject: string;
  html: string;
};

function layout(title: string, body: string, cta?: { label: string; href: string }) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:16px;overflow:hidden">
    <div style="padding:24px 28px;border-bottom:1px solid #1e293b">
      <span style="font-size:20px;font-weight:800;color:#ffffff">Frete</span>
      <span style="font-size:20px;font-weight:800;color:#f97316">Truck</span>
    </div>
    <div style="padding:28px">
      <h2 style="margin:0 0 12px;font-size:20px;color:#ffffff">${title}</h2>
      <div style="font-size:14px;line-height:1.7;color:#cbd5e1">${body}</div>
      ${cta ? `<a href="${cta.href}" style="display:inline-block;margin-top:20px;background:#f97316;color:#ffffff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">${cta.label}</a>` : ""}
    </div>
    <div style="padding:18px 28px;border-top:1px solid #1e293b;font-size:11px;color:#64748b">
      Você recebeu este e-mail porque possui uma conta no FreteTruck.<br/>
      ${APP_URL} · Conectando caminhoneiros e embarcadores no Brasil.
    </div>
  </div>`;
}

export async function sendMail(payload: MailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log("[EMAIL-DEV] Destinatário:", payload.to);
    console.log("[EMAIL-DEV] Assunto:", payload.subject);
    return true;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [payload.to], subject: payload.subject, html: payload.html }),
    });
    if (!res.ok) {
      console.error("[EMAIL] Resend error:", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[EMAIL] send error:", e);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  return sendMail({
    to,
    subject: "Redefinir sua senha — FreteTruck",
    html: layout(
      `Olá, ${name.split(" ")[0]}!`,
      `Recebemos um pedido para redefinir a senha da sua conta no FreteTruck.<br/><br/>
       O link é válido por <strong>1 hora</strong>. Se você não solicitou, ignore este e-mail.`,
      { label: "Redefinir senha", href: resetUrl }
    ),
  });
}

export async function sendProposalReceivedEmail(to: string, ownerName: string, driverName: string, route: string, freightId: number) {
  return sendMail({
    to,
    subject: `Nova proposta de ${driverName} — FreteTruck`,
    html: layout(
      "Nova proposta recebida!",
      `Olá, ${ownerName.split(" ")[0]}!<br/><br/>
       <strong>${driverName}</strong> enviou uma proposta para o frete:<br/>
       <strong>${route}</strong><br/><br/>
       Acesse o painel para aceitar ou recusar.`,
      { label: "Ver proposta", href: `${APP_URL}/painel` }
    ),
  });
}

export async function sendProposalAcceptedEmail(to: string, driverName: string, route: string, contactName: string, contactPhone: string) {
  return sendMail({
    to,
    subject: "Sua proposta foi aceita! — FreteTruck",
    html: layout(
      "Proposta aceita! 🎉",
      `Olá, ${driverName.split(" ")[0]}!<br/><br/>
       Sua proposta para <strong>${route}</strong> foi <strong>aceita</strong>.<br/><br/>
       <strong>Contato do embarcador:</strong><br/>
       ${contactName} — ${contactPhone}<br/><br/>
       Combine os detalhes do carregamento diretamente.`,
      { label: "Ver frete", href: `${APP_URL}/painel` }
    ),
  });
}

export async function sendWelcomeEmail(to: string, name: string, role: string) {
  return sendMail({
    to,
    subject: "Bem-vindo ao FreteTruck! — FreteTruck",
    html: layout(
      `Bem-vindo, ${name.split(" ")[0]}!`,
      `Sua conta de <strong>${role === "motorista" ? "motorista" : "embarcador"}</strong> foi criada com sucesso.<br/><br/>
       ${
         role === "motorista"
           ? "Busque fretes com filtros por rota e caminhão, envie propostas online e converse direto pelo chat."
           : "Publique fretes em segundos e receba propostas de milhares de caminhoneiros verificados."
       }`,
      { label: "Começar agora", href: `${APP_URL}${role === "motorista" ? "/fretes" : "/publicar"}` }
    ),
  });
}
