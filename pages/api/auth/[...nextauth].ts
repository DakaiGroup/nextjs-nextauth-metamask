import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { ethers } from "ethers";
import NextAuth, { AuthOptions, RequestInternal } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Authorization function for crypto login
//  takes publicAdress and signature from credentials and returns
//  either a user object on success or null on failure
async function authorizeCrypto(
  credentials: Record<"publicAddress" | "signedNonce", string> | undefined,
  req: Pick<RequestInternal, "body" | "headers" | "method" | "query">
) {
  if (!credentials) return null;

  const { publicAddress, signedNonce } = credentials;

  // Get user from database with their generated nonce
  const user = await prisma.user.findUnique({
    where: { publicAddress },
    include: { cryptoLoginNonce: true },
  });

  if (!user?.cryptoLoginNonce) return null;

  // Compute the signer address from the saved nonce and the received signature
  const signerAddress = ethers.verifyMessage(
    user.cryptoLoginNonce.nonce,
    signedNonce
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

// see: https://next-auth.js.org/configuration/options
export const authOptions: AuthOptions = {
  // Setting error and signin pages to our /auth custom page
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  providers: [
    // see: https://next-auth.js.org/configuration/providers/credentials
    CredentialsProvider({
      id: "crypto",
      name: "Crypto Wallet Auth",
      credentials: {
        publicAddress: { label: "Public Address", type: "text" },
        signedNonce: { label: "Signed Nonce", type: "text" },
      },
      authorize: authorizeCrypto,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  // Due to a NextAuth bug, the default database strategy is no usable
  //  with CredentialsProvider, so we need to set strategy to JWT
  session: {
    strategy: "jwt",
  },
  // Setting secret here for convenience, do not use this in production
  secret: "DO_NOT_USE_THIS_IN_PROD",
};

export default NextAuth(authOptions);
