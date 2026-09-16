import TestePagamento from './teste-pagamento'

// Server component: a Public Key do Mercado Pago é pública por natureza (usada no navegador).
export default function Page() {
  const publicKey =
    process.env.MP_MODE === 'test' && process.env.MP_PUBLIC_KEY_TEST
      ? process.env.MP_PUBLIC_KEY_TEST
      : process.env.MP_PUBLIC_KEY ?? ''
  return <TestePagamento publicKey={publicKey} />
}
