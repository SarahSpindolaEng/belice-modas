/**
 * Retorna o access token do Mercado Pago conforme o modo.
 * MP_MODE=test  -> usa MP_ACCESS_TOKEN_TEST (pagamentos de teste, sem dinheiro real)
 * caso contrario -> usa MP_ACCESS_TOKEN (produção, dinheiro real)
 */
export function mpAccessToken(): string {
  if (process.env.MP_MODE === 'test' && process.env.MP_ACCESS_TOKEN_TEST) {
    return process.env.MP_ACCESS_TOKEN_TEST
  }
  return process.env.MP_ACCESS_TOKEN!
}
