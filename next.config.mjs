/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Anti-clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Impede sniffing de MIME type
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Não vaza URL de origem para sites externos
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Desativa câmera / microfone / geolocalização
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Força HTTPS por 1 ano
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Content Security Policy — bloqueia execução de scripts externos não autorizados
          // (proteção contra XSS)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: apenas o próprio site + Mercado Pago + Next.js inline (nonce não suportado em static export)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://www.mercadopago.com",
              // Estilos: inline permitido (Tailwind gera inline)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fontes
              "font-src 'self' https://fonts.gstatic.com",
              // Imagens: próprio site + Google (fotos de perfil OAuth) + Melhor Envio logos
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://sandbox.melhorenvio.com.br https://melhorenvio.com.br",
              // Conexões: próprio site + ViaCEP + Mercado Pago + Melhor Envio + Google OAuth
              "connect-src 'self' https://viacep.com.br https://api.mercadopago.com https://sandbox.mercadopago.com.br https://sandbox.melhorenvio.com.br https://melhorenvio.com.br https://oauth2.googleapis.com https://accounts.google.com",
              // Iframes: Mercado Pago e Google (OAuth pode usar iframes)
              "frame-src https://www.mercadopago.com https://www.mercadolibre.com https://accounts.google.com",
              // Tudo mais bloqueado
              "object-src 'none'",
              "base-uri 'self'",
              // form-action: Google OAuth usa POST redirect para iniciar o fluxo
              "form-action 'self' https://www.mercadopago.com https://accounts.google.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
