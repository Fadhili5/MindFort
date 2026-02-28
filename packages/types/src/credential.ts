/**
 * Quantum-resistant credential minted on the Abelian QDay chain.
 * Represents a UTXO the student permanently owns.
 */
export interface AbelianCredential {
  /** Abelian transaction ID */
  txId: string;
  /** Student's quantum-resistant public key (Dilithium) */
  studentPublicKey: string;
  /** The attested mastery data committed to the UTXO */
  attestation: CredentialAttestation;
  /** Lattice-based signature (CRYSTALS-Dilithium) from backend key */
  signature: string;
  mintedAt: number;
}

export interface CredentialAttestation {
  pseudonymousId: string;
  topicId: string;
  score: number;
  achievedAt: number;
}

/**
 * Request sent from the backend to the Abelian node to mint a credential.
 */
export interface MintCredentialRequest {
  studentPublicKey: string;
  attestation: CredentialAttestation;
}

export interface MintCredentialResponse {
  txId: string;
  signature: string;
}
