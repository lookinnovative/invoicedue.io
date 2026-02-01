import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import { compare, hash } from 'bcryptjs';
import { db } from './db';
import { randomBytes } from 'crypto';

export const authOptions: NextAuthOptions = {
  trustHost: false,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const tenant = await db.tenant.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!tenant) {
          throw new Error('Invalid credentials');
        }

        const isValid = await compare(credentials.password, tenant.passwordHash);

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: tenant.id,
          email: tenant.email,
          name: tenant.companyName,
        };
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/github`,
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, ensure a Tenant record exists
      if (account?.provider !== 'credentials' && user.email) {
        try {
          const existingTenant = await db.tenant.findUnique({
            where: { email: user.email.toLowerCase() },
          });

          if (!existingTenant) {
            // Create a new Tenant for OAuth user
            const randomPassword = randomBytes(32).toString('hex');
            const passwordHash = await hash(randomPassword, 12);
            
            const newTenant = await db.tenant.create({
              data: {
                email: user.email.toLowerCase(),
                passwordHash,
                companyName: user.name || user.email.split('@')[0],
              },
            });
            
            // Store tenant ID on user object for JWT callback
            user.id = newTenant.id;
          } else {
            // Use existing tenant ID
            user.id = existingTenant.id;
          }
        } catch (error) {
          console.error('Failed to create/find tenant for OAuth user:', error);
          return false; // Reject sign-in if tenant creation fails
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
