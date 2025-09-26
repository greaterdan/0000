use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing::{info, warn};

mod crypto;
mod key_manager;

use crypto::{CryptoService, SignScheme};
use key_manager::KeyManager;

#[derive(Clone)]
struct AppState {
    crypto_service: Arc<CryptoService>,
    key_manager: Arc<KeyManager>,
}

#[derive(Deserialize)]
struct SignRequest {
    message_bytes_base64: String,
    key_id: String,
    scheme: String,
}

#[derive(Serialize)]
struct SignResponse {
    sig_base64: String,
}

#[derive(Deserialize)]
struct VerifyRequest {
    message: String,
    sig: String,
    pubkey: String,
    scheme: String,
}

#[derive(Serialize)]
struct VerifyResponse {
    valid: bool,
}

#[derive(Deserialize)]
struct KemInitRequest {
    peer_pubkey: String,
}

#[derive(Serialize)]
struct KemInitResponse {
    ciphertext: String,
    shared_secret: String,
}

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    supported_schemes: Vec<String>,
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        supported_schemes: vec![
            "dilithium3".to_string(),
            "sphincs-sha2-128f".to_string(),
        ],
    })
}

async fn sign(
    State(state): State<AppState>,
    Json(request): Json<SignRequest>,
) -> Result<Json<SignResponse>, StatusCode> {
    info!("Sign request for key_id: {}", request.key_id);

    let scheme = match request.scheme.as_str() {
        "dilithium3" => SignScheme::Dilithium3,
        "sphincs-sha2-128f" => SignScheme::SphincsSha2128f,
        _ => {
            warn!("Unsupported signing scheme: {}", request.scheme);
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    let message_bytes = match base64::decode(&request.message_bytes_base64) {
        Ok(bytes) => bytes,
        Err(_) => {
            warn!("Invalid base64 message");
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    let signature = state
        .crypto_service
        .sign(&message_bytes, &request.key_id, scheme)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(SignResponse {
        sig_base64: base64::encode(signature),
    }))
}

async fn verify(
    State(state): State<AppState>,
    Json(request): Json<VerifyRequest>,
) -> Result<Json<VerifyResponse>, StatusCode> {
    info!("Verify request for scheme: {}", request.scheme);

    let scheme = match request.scheme.as_str() {
        "dilithium3" => SignScheme::Dilithium3,
        "sphincs-sha2-128f" => SignScheme::SphincsSha2128f,
        _ => {
            warn!("Unsupported signing scheme: {}", request.scheme);
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    let signature = match base64::decode(&request.sig) {
        Ok(bytes) => bytes,
        Err(_) => {
            warn!("Invalid base64 signature");
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    let pubkey = match base64::decode(&request.pubkey) {
        Ok(bytes) => bytes,
        Err(_) => {
            warn!("Invalid base64 public key");
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    let valid = state
        .crypto_service
        .verify(&request.message.as_bytes(), &signature, &pubkey, scheme)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(VerifyResponse { valid }))
}

async fn kem_init(
    State(state): State<AppState>,
    Json(request): Json<KemInitRequest>,
) -> Result<Json<KemInitResponse>, StatusCode> {
    info!("KEM init request");

    let peer_pubkey = match base64::decode(&request.peer_pubkey) {
        Ok(bytes) => bytes,
        Err(_) => {
            warn!("Invalid base64 peer public key");
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    let (ciphertext, shared_secret) = state
        .crypto_service
        .kem_init(&peer_pubkey)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(KemInitResponse {
        ciphertext: base64::encode(ciphertext),
        shared_secret: base64::encode(shared_secret),
    }))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter("pqsigner=debug,tower_http=debug")
        .init();

    info!("Starting pqsigner service...");

    // Initialize key manager
    let key_manager = Arc::new(KeyManager::new().await?);
    
    // Initialize crypto service
    let crypto_service = Arc::new(CryptoService::new(key_manager.clone()).await?);

    let state = AppState {
        crypto_service,
        key_manager,
    };

    // Build the application
    let app = Router::new()
        .route("/health", get(health))
        .route("/sign", post(sign))
        .route("/verify", post(verify))
        .route("/kem/init", post(kem_init))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    info!("pqsigner listening on 0.0.0.0:3000");

    axum::serve(listener, app).await?;

    Ok(())
}
