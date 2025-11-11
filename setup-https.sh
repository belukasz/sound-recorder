#!/bin/bash

# Generate self-signed certificate on the k8s node
K8S_HOST="ubuntu@192.99.35.139"
DOMAIN="192.99.35.139"

echo "🔐 Generating self-signed SSL certificate..."

ssh $K8S_HOST << 'EOF'
# Create directory for certs
sudo mkdir -p /etc/ssl/sound-recorder

# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/sound-recorder/tls.key \
  -out /etc/ssl/sound-recorder/tls.crt \
  -subj "/CN=192.99.35.139/O=SoundRecorder"

echo "✅ Certificate generated at /etc/ssl/sound-recorder/"
EOF

echo ""
echo "📝 Creating Kubernetes TLS secret..."

# Create k8s secret from the certificate on the remote node
ssh $K8S_HOST "sudo cat /etc/ssl/sound-recorder/tls.crt" > /tmp/tls.crt
ssh $K8S_HOST "sudo cat /etc/ssl/sound-recorder/tls.key" > /tmp/tls.key

kubectl create secret tls sound-recorder-tls \
  --cert=/tmp/tls.crt \
  --key=/tmp/tls.key \
  -n sound-recorder --dry-run=client -o yaml | kubectl apply -f -

rm /tmp/tls.crt /tmp/tls.key

echo "✅ TLS secret created!"
echo ""
echo "💡 Now apply the HTTPS ingress or update nginx config"
