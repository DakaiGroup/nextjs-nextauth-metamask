import { ethers } from "ethers";
import { signIn } from "next-auth/react";

// Fix typescript errors for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Auth() {
  return (
    <main>
      <p>
        After clicking the button you will be prompted to connect your wallet
        with this site, then you will need to sign a nonce (random hex string)
        to prove you own the account.
      </p>
      <button onClick={onSignInWithCrypto}>Sign in with Metamask</button>
    </main>
  );
}

// This function requests a nonce then signs it, proving that
//  the user owns the public address they are using
async function onSignInWithCrypto() {
  try {
    if (!window.ethereum) {
      window.alert("Please install MetaMask first.");
      return;
    }

    // Get the wallet provider, the signer and address
    //  see: https://docs.ethers.org/v6/getting-started/#starting-signing
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const publicAddress = await signer.getAddress();

    // Send the public address to generate a nonce associates with our account
    const response = await fetch("/api/auth/crypto/generateNonce", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicAddress,
      }),
    });
    const responseData = await response.json();

    // Sign the received nonce
    const signedNonce = await signer.signMessage(responseData.nonce);

    // Use NextAuth to sign in with our address and the nonce
    await signIn("crypto", {
      publicAddress,
      signedNonce,
      callbackUrl: "/",
    });
  } catch {
    window.alert("Error with signing, please try again.");
  }
}
