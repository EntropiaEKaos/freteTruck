import { NextResponse } from "next/server";
import { pool } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login." }, { status: 401 });

  const { cnpj } = await req.json();
  const clean = (cnpj || "").replace(/\D/g, "");
  if (clean.length !== 14) return NextResponse.json({ error: "CNPJ inválido (14 dígitos)." }, { status: 400 });

  try {
    // Consulta gratuita via BrasilAPI
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return NextResponse.json({ error: "CNPJ não encontrado na Receita Federal." }, { status: 404 });
    const data = await res.json();

    const companyName = data.razao_social || data.nome_fantasia || "";
    const status = data.descricao_situacao_cadastral === "ATIVA" ? "ativo" : "inativo";

    await pool.query(
      `INSERT INTO cnpj_verifications (user_id, cnpj, company_name, status, api_response, verified_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT DO NOTHING`,
      [user.id, clean, companyName, status, JSON.stringify(data)]
    );

    await auditLog({ userId: user.id, actorEmail: user.email, action: "cnpj.verify", entity: "cnpj_verification", details: { cnpj: clean, status } });

    return NextResponse.json({
      cnpj: clean,
      razaoSocial: data.razao_social,
      nomeFantasia: data.nome_fantasia,
      situacao: data.descricao_situacao_cadastral,
      uf: data.uf,
      municipio: data.municipio,
      atividadePrincipal: data.cnae_fiscal_descricao || data.atividade_principal?.[0]?.text,
      abertura: data.data_inicio_atividade,
      status,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Erro ao consultar CNPJ: " + (e.message || "timeout") }, { status: 502 });
  }
}
