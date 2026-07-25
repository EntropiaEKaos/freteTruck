import { db } from "@/db";
import { pool } from "@/db";

/**
 * Wrapper seguro para queries de banco de dados em Server Components.
 * Em vez de quebrar a página inteira com "An error occurred in the Server Components render",
 * retorna null/fallback e loga o erro.
 */
export async function safeQuery<T>(queryFn: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    // Teste rápido de conectividade
    const client = await pool.connect();
    client.release();
    const data = await queryFn();
    return { data, error: null };
  } catch (e: any) {
    const message = e?.message || "Erro desconhecido no banco de dados";
    console.error("[DB ERROR]", message);
    return { data: null, error: message };
  }
}
