use anyhow::Result;
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use tokio::fs;
use tokio::sync::RwLock;

pub struct KeyManager {
    keys: Arc<RwLock<HashMap<String, Vec<u8>>>>,
    key_dir: String,
}

impl KeyManager {
    pub async fn new() -> Result<Self> {
        let key_dir = "infra/keys".to_string();
        
        // Create key directory if it doesn't exist
        if !Path::new(&key_dir).exists() {
            fs::create_dir_all(&key_dir).await?;
        }

        let mut keys = HashMap::new();
        
        // Generate default keys for development
        Self::generate_default_keys(&mut keys).await?;
        
        // Load existing keys from disk
        Self::load_keys_from_disk(&key_dir, &mut keys).await?;
        
        // Save generated keys to disk
        Self::save_keys_to_disk(&key_dir, &keys).await?;

        Ok(Self {
            keys: Arc::new(RwLock::new(keys)),
            key_dir,
        })
    }

    async fn generate_default_keys(keys: &mut HashMap<String, Vec<u8>>) {
        // Generate default development keys
        let default_keys = vec![
            ("dilithium_ledger_dev", vec![0u8; 64]),
            ("sphincs_ledger_dev", vec![1u8; 64]),
            ("wit1", vec![2u8; 64]),
            ("wit2", vec![3u8; 64]),
            ("wit3", vec![4u8; 64]),
        ];

        for (key_id, key_data) in default_keys {
            if !keys.contains_key(key_id) {
                keys.insert(key_id.to_string(), key_data);
            }
        }
    }

    async fn load_keys_from_disk(
        key_dir: &str,
        keys: &mut HashMap<String, Vec<u8>>,
    ) -> Result<()> {
        let mut entries = fs::read_dir(key_dir).await?;
        
        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_stem() {
                    if let Some(key_id) = file_name.to_str() {
                        let key_data = fs::read(&path).await?;
                        keys.insert(key_id.to_string(), key_data);
                    }
                }
            }
        }
        
        Ok(())
    }

    async fn save_keys_to_disk(
        key_dir: &str,
        keys: &HashMap<String, Vec<u8>>,
    ) -> Result<()> {
        for (key_id, key_data) in keys {
            let key_path = Path::new(key_dir).join(format!("{}.key", key_id));
            fs::write(&key_path, key_data).await?;
        }
        
        Ok(())
    }

    pub async fn get_private_key(&self, key_id: &str) -> Result<Vec<u8>> {
        let keys = self.keys.read().await;
        keys.get(key_id)
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("Key not found: {}", key_id))
    }

    pub async fn get_public_key(&self, key_id: &str) -> Result<Vec<u8>> {
        // In a real implementation, this would derive the public key from the private key
        // For demo purposes, we'll return a modified version of the private key
        let private_key = self.get_private_key(key_id).await?;
        let mut public_key = private_key.clone();
        public_key[0] = public_key[0].wrapping_add(1); // Simple transformation
        Ok(public_key)
    }

    pub async fn list_keys(&self) -> Vec<String> {
        let keys = self.keys.read().await;
        keys.keys().cloned().collect()
    }

    pub async fn add_key(&self, key_id: String, key_data: Vec<u8>) -> Result<()> {
        let mut keys = self.keys.write().await;
        keys.insert(key_id.clone(), key_data.clone());
        
        // Save to disk
        let key_path = Path::new(&self.key_dir).join(format!("{}.key", key_id));
        fs::write(&key_path, key_data).await?;
        
        Ok(())
    }

    pub async fn store_ephemeral_key(&self, key_data: &[u8]) -> Result<()> {
        // Generate unique key ID for ephemeral key
        let key_id = format!("ephemeral_{}", std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos());
        
        self.add_key(key_id, key_data.to_vec()).await
    }
}
