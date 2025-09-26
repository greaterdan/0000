use crate::key_manager::KeyManager;
use anyhow::Result;
use std::sync::Arc;
// Real quantum-safe cryptography imports
use pqcrypto_dilithium::dilithium3::*;
use pqcrypto_sphincs::sphincssha2128fsimple::*;
use pqcrypto_kyber::kyber768::*;
use ring::digest;
use sha2::{Sha256, Digest};
use rand::Rng;

#[derive(Debug, Clone, Copy)]
pub enum SignScheme {
    Dilithium3,
    SphincsSha2128f,
}

pub struct CryptoService {
    key_manager: Arc<KeyManager>,
}

impl CryptoService {
    pub async fn new(key_manager: Arc<KeyManager>) -> Result<Self> {
        Ok(Self { key_manager })
    }

    pub async fn sign(
        &self,
        message: &[u8],
        key_id: &str,
        scheme: SignScheme,
    ) -> Result<Vec<u8>> {
        // Hash the message first for better security
        let mut hasher = Sha256::new();
        hasher.update(message);
        let message_hash = hasher.finalize();
        
        match scheme {
            SignScheme::Dilithium3 => {
                // Get or generate Dilithium3 key pair
                let (private_key, _) = self.get_or_generate_dilithium_keypair(key_id).await?;
                
                // Sign with Dilithium3
                let signature = detached_sign(&message_hash, &private_key);
                Ok(signature.as_bytes().to_vec())
            }
            SignScheme::SphincsSha2128f => {
                // Get or generate SPHINCS+ key pair
                let (private_key, _) = self.get_or_generate_sphincs_keypair(key_id).await?;
                
                // Sign with SPHINCS+
                let signature = detached_sign(&message_hash, &private_key);
                Ok(signature.as_bytes().to_vec())
            }
        }
    }

    pub async fn verify(
        &self,
        message: &[u8],
        signature: &[u8],
        public_key: &[u8],
        scheme: SignScheme,
    ) -> Result<bool> {
        // Hash the message first
        let mut hasher = Sha256::new();
        hasher.update(message);
        let message_hash = hasher.finalize();
        
        match scheme {
            SignScheme::Dilithium3 => {
                // Convert public key to Dilithium3 public key
                let pk = match PublicKey::from_bytes(public_key) {
                    Ok(pk) => pk,
                    Err(_) => return Ok(false),
                };
                
                // Convert signature to Dilithium3 signature
                let sig = match DetachedSignature::from_bytes(signature) {
                    Ok(sig) => sig,
                    Err(_) => return Ok(false),
                };
                
                // Verify signature
                Ok(verify_detached_signature(&sig, &message_hash, &pk).is_ok())
            }
            SignScheme::SphincsSha2128f => {
                // Convert public key to SPHINCS+ public key
                let pk = match PublicKey::from_bytes(public_key) {
                    Ok(pk) => pk,
                    Err(_) => return Ok(false),
                };
                
                // Convert signature to SPHINCS+ signature
                let sig = match DetachedSignature::from_bytes(signature) {
                    Ok(sig) => sig,
                    Err(_) => return Ok(false),
                };
                
                // Verify signature
                Ok(verify_detached_signature(&sig, &message_hash, &pk).is_ok())
            }
        }
    }

    pub async fn kem_init(&self, peer_pubkey: &[u8]) -> Result<(Vec<u8>, Vec<u8>)> {
        // Real Kyber KEM implementation
        let peer_pk = match pqcrypto_kyber::kyber768::PublicKey::from_bytes(peer_pubkey) {
            Ok(pk) => pk,
            Err(_) => return Err(anyhow::anyhow!("Invalid peer public key")),
        };
        
        // Encapsulate shared secret using Kyber768
        let (ciphertext, shared_secret) = encapsulate(&peer_pk);
        
        Ok((ciphertext.as_bytes().to_vec(), shared_secret.as_bytes().to_vec()))
    }

    // Helper methods for key generation
    async fn get_or_generate_dilithium_keypair(&self, key_id: &str) -> Result<(SecretKey, PublicKey)> {
        // Try to get existing key from key manager
        if let Ok(private_key_bytes) = self.key_manager.get_private_key(key_id).await {
            if let Ok(secret_key) = SecretKey::from_bytes(&private_key_bytes) {
                let public_key = secret_key.public_key();
                return Ok((secret_key, public_key));
            }
        }
        
        // Generate new key pair
        let (public_key, secret_key) = keypair();
        
        // Store the private key
        self.key_manager.store_private_key(key_id, &secret_key.as_bytes()).await?;
        
        Ok((secret_key, public_key))
    }
    
    async fn get_or_generate_sphincs_keypair(&self, key_id: &str) -> Result<(SecretKey, PublicKey)> {
        // Try to get existing key from key manager
        if let Ok(private_key_bytes) = self.key_manager.get_private_key(&format!("{}_sphincs", key_id)).await {
            if let Ok(secret_key) = SecretKey::from_bytes(&private_key_bytes) {
                let public_key = secret_key.public_key();
                return Ok((secret_key, public_key));
            }
        }
        
        // Generate new key pair
        let (public_key, secret_key) = keypair();
        
        // Store the private key
        self.key_manager.store_private_key(&format!("{}_sphincs", key_id), &secret_key.as_bytes()).await?;
        
        Ok((secret_key, public_key))
    }
    
    pub async fn generate_kyber_keypair(&self) -> Result<(Vec<u8>, Vec<u8>)> {
        // Generate real Kyber768 key pair
        let (public_key, secret_key) = keypair();
        Ok((public_key.as_bytes().to_vec(), secret_key.as_bytes().to_vec()))
    }
}
