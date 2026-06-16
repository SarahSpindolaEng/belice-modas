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
          // Impede que o site seja carregado dentro de um iframe (anti-clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Impede que o navegador adivinhe o tipo do arquivo
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Não envia a URL de origem para sites externos
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Desativa funcionalidades desnecessárias do navegador
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Força HTTPS por 1 ano
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
}

export default nextConfig
