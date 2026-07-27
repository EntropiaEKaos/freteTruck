/**
 * Wrapper seguro para queries de banco de dados em Server Components.
 * Em vez de quebrar a página inteira, retorna null/fallback e loga o erro.
 */
export async function safeQuery<T>(queryFn: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await queryFn();
    return { data, error: null };
  } catch (e: any) {
    const message = e?.message || "Erro desconhecido no banco de dados";
    console.error("[DB ERROR]", message);
    return { data: null, error: message };
  }
}
