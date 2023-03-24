import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { ethers } from "ethers";
import NextAuth, { AuthOptions, RequestInternal } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Authorization function for crypto login
//  takes publicAdress and signature from credentials and returns
//  either a user object on success or null on failure
async function authorizeCrypto(
  credentials: Record<"publicAddress" | "signature", string> | undefined,
  req: Pick<RequestInternal, "body" | "headers" | "method" | "query">
) {
  if (!credentials) return null;

  const { publicAddress, signature } = credentials;

  // Get user from database with their generated nonce
  const user = await prisma.user.findUnique({
    where: { publicAddress },
    include: { cryptoLoginNonce: true },
  });

  if (!user?.cryptoLoginNonce) return null;

  // Compute the signer address from the saved nonce and the received signature
  const signerAddress = ethers.verifyMessage(
    user.cryptoLoginNonce.nonce,
    signature
  );

  // Check that the signer address matches the public address
  //  that is trying to sign in
  if (signerAddress !== publicAddress) return null;

  // Check that the nonce is not expired
  if (user.cryptoLoginNonce.expires < new Date()) return null;

  // Everything is fine, clear the nonce and return the user
  await prisma.cryptoLoginNonce.delete({ where: { userId: user.id } });

  return {
    id: user.id,
    publicAddress: user.publicAddress,
  };
}

export const authOptions: AuthOptions = {
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  providers: [
    CredentialsProvider({
      id: "crypto",
      name: "Crypto Wallet Auth",
      credentials: {
        publicAddress: { label: "Public Address", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      authorize: authorizeCrypto,
    }),
  ],
  callbacks: {
    // Add publicAddress to session object
    async session({ session, token }: any) {
      const u = await prisma.user.findUnique({ where: { id: token.sub } });
      session.publicAddress = u?.publicAddress;
      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  // Setting secret here for convenience, do not use this in production
  secret: "DO_NOT_USE_THIS_IN_PROD",
};

export default NextAuth(authOptions);
