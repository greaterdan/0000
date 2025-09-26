#!/bin/bash

# Generate mTLS certificates for AIM Currency services
set -e

CERT_DIR="./certs"
mkdir -p $CERT_DIR

# Generate CA private key and certificate
openssl genrsa -out $CERT_DIR/ca.key 4096
openssl req -new -x509 -days 365 -key $CERT_DIR/ca.key -out $CERT_DIR/ca.crt \
  -subj "/C=US/ST=CA/L=San Francisco/O=AIM Currency/OU=IT/CN=AIM-CA"

# Services that need certificates
SERVICES=("ledgerd" "mintd" "logd" "treasury" "gateway" "agent-gateway" "marketplace" "metering" "webhookd" "pqsigner")

for service in "${SERVICES[@]}"; do
  echo "Generating certificate for $service..."
  
  # Generate private key
  openssl genrsa -out $CERT_DIR/${service}.key 2048
  
  # Generate certificate signing request
  openssl req -new -key $CERT_DIR/${service}.key -out $CERT_DIR/${service}.csr \
    -subj "/C=US/ST=CA/L=San Francisco/O=AIM Currency/OU=IT/CN=${service}"
  
  # Generate certificate signed by CA
  openssl x509 -req -days 365 -in $CERT_DIR/${service}.csr -CA $CERT_DIR/ca.crt -CAkey $CERT_DIR/ca.key \
    -CAcreateserial -out $CERT_DIR/${service}.crt \
    -extensions v3_req -extfile <(
      echo "[v3_req]"
      echo "keyUsage = keyEncipherment, dataEncipherment"
      echo "extendedKeyUsage = serverAuth, clientAuth"
      echo "subjectAltName = @alt_names"
      echo "[alt_names]"
      echo "DNS.1 = ${service}"
      echo "DNS.2 = ${service}.aim.local"
      echo "DNS.3 = localhost"
      echo "IP.1 = 127.0.0.1"
    )
  
  # Clean up CSR
  rm $CERT_DIR/${service}.csr
done

echo "Certificates generated successfully in $CERT_DIR"
echo "CA certificate: $CERT_DIR/ca.crt"
echo "Service certificates: $CERT_DIR/*.crt"
