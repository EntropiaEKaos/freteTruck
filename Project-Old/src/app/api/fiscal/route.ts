import { NextResponse } from "next/server";
import { db } from "@/db";
import { fiscalDocuments, freights, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function generateAccessKey(docType: "cte" | "mdfe", ufCode = "35") {
  // Chave simulada com 44 dígitos: UF + AAMM + CNPJ + modelo + série + número + tipo + código + DV
  const now = new Date();
  const aamm = String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, "0");
  const cnpj = "12345678000195";
  const model = docType === "cte" ? "57" : "58";
  const serie = "001";
  const number = String(Math.floor(Math.random() * 999999999)).padStart(9, "0");
  const emissionType = "1";
  const code = String(Math.floor(Math.random() * 99999999)).padStart(8, "0");
  const base = `${ufCode}${aamm}${cnpj}${model}${serie}${number}${emissionType}${code}`.slice(0, 43);
  const dv = String(base.split("").reduce((sum, n, idx) => sum + Number(n) * ((idx % 8) + 2), 0) % 10);
  return `${base}${dv}`;
}

function buildFiscalXml(docType: "cte" | "mdfe", accessKey: string, freight: typeof freights.$inferSelect, ownerName: string) {
  const tag = docType === "cte" ? "CTe" : "MDFe";
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<${tag} xmlns="http://www.portalfiscal.inf.br/${docType}">
  <inf${tag} Id="${tag}${accessKey}" versao="4.00">
    <ide>
      <cUF>35</cUF>
      <dhEmi>${now}</dhEmi>
      <modal>01</modal>
      <tpAmb>2</tpAmb>
      <tpEmis>1</tpEmis>
      <procEmi>0</procEmi>
    </ide>
    <emit>
      <xNome>${ownerName}</xNome>
    </emit>
    <infCarga>
      <xProd>${freight.cargoType}</xProd>
      <qCarga>${freight.weightKg}</qCarga>
    </infCarga>
    <infRota>
      <orig>${freight.originCity}/${freight.originState}</orig>
      <dest>${freight.destCity}/${freight.destState}</dest>
      <distancia>${freight.distanceKm || 0}</distancia>
    </infRota>
    <infFreteTruck>
      <freightId>${freight.id}</freightId>
      <status>simulacao_pre_homologacao</status>
    </infFreteTruck>
  </inf${tag}>
</${tag}>`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const rows = await db
    .select({ document: fiscalDocuments, freight: freights })
    .from(fiscalDocuments)
    .innerJoin(freights, eq(fiscalDocuments.freightId, freights.id))
    .where(eq(fiscalDocuments.userId, user.id))
    .orderBy(desc(fiscalDocuments.createdAt))
    .limit(100);

  return NextResponse.json({ documents: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Faça login para criar documentos fiscais." }, { status: 401 });

  const body = await req.json();
  const freightId = parseInt(body.freightId, 10);
  const docType = body.docType as "cte" | "mdfe";

  if (Number.isNaN(freightId)) return NextResponse.json({ error: "Frete inválido." }, { status: 400 });
  if (!["cte", "mdfe"].includes(docType)) return NextResponse.json({ error: "Tipo deve ser CT-e ou MDF-e." }, { status: 400 });

  const freightRows = await db.select().from(freights).where(eq(freights.id, freightId)).limit(1);
  const freight = freightRows[0];
  if (!freight) return NextResponse.json({ error: "Frete não encontrado." }, { status: 404 });
  if (freight.userId !== user.id && user.role !== "admin") return NextResponse.json({ error: "Sem permissão para este frete." }, { status: 403 });

  const accessKey = generateAccessKey(docType);
  const xmlContent = buildFiscalXml(docType, accessKey, freight, user.company || user.name);

  const payload = {
    ambiente: "homologacao_simulada",
    tipo: docType,
    frete: {
      id: freight.id,
      origem: `${freight.originCity}/${freight.originState}`,
      destino: `${freight.destCity}/${freight.destState}`,
      carga: freight.cargoType,
      pesoKg: freight.weightKg,
      valorFrete: freight.price,
    },
    emitente: {
      nome: user.company || user.name,
      telefone: onlyNumbers(user.phone),
    },
    observacao: "Rascunho técnico. Para emissão real é necessário certificado A1/A3 e integração SEFAZ/provedor fiscal.",
  };

  const [created] = await db
    .insert(fiscalDocuments)
    .values({
      freightId,
      userId: user.id,
      docType,
      status: "pronto_para_emitir",
      accessKey,
      xmlContent,
      payload,
    })
    .returning();

  return NextResponse.json({ document: created }, { status: 201 });
}
