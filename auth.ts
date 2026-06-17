import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // trustHost: necessário no Vercel para usar o header X-Forwarded-Host
  // como base da URL de callback. Sem isso, NextAuth usa NEXTAUTH_URL=localhost
  // e o Google rejeita o redirect com "redirect_uri_mismatch".
  trustHost: true,
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      }
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
})
