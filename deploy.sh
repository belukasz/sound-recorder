#!/bin/bash

set -e

# Configuration
K8S_HOST="${K8S_HOST:-ubuntu@192.99.35.139}"
IMAGE_NAME="sound-recorder:latest"
NAMESPACE="sound-recorder"
DOMAIN="192.99.35.139"

echo "=========================================="
echo "Sound Recorder - Deployment Script"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  K8s Host: $K8S_HOST"
echo "  Image: $IMAGE_NAME"
echo "  Namespace: $NAMESPACE"
echo ""

# Step 1: Build Docker image
echo "📦 Step 1/7: Building Docker image for linux/amd64..."
docker build --platform linux/amd64 -t $IMAGE_NAME .
echo "✅ Docker image built successfully"
echo ""

# Step 2: Save Docker image to tar
echo "💾 Step 2/7: Saving Docker image to tar file..."
docker save $IMAGE_NAME -o sound-recorder.tar
echo "✅ Image saved to sound-recorder.tar"
echo ""

# Step 3: Copy image to remote server
echo "📤 Step 3/7: Copying image to remote K8s server..."
scp sound-recorder.tar $K8S_HOST:/tmp/
echo "✅ Image copied to remote server"
echo ""

# Step 4: Load image into containerd
echo "📥 Step 4/7: Loading image into containerd..."
ssh $K8S_HOST "sudo ctr -n k8s.io images import /tmp/sound-recorder.tar && rm /tmp/sound-recorder.tar"
echo "✅ Image loaded into containerd"
echo ""

# Step 5: Generate SSL certificate
echo "🔐 Step 5/7: Generating self-signed SSL certificate..."
ssh $K8S_HOST << 'EOF'
sudo mkdir -p /etc/ssl/sound-recorder
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/sound-recorder/tls.key \
  -out /etc/ssl/sound-recorder/tls.crt \
  -subj "/CN=192.99.35.139/O=SoundRecorder" 2>/dev/null
EOF
echo "✅ SSL certificate generated"
echo ""

# Step 6: Create Kubernetes resources
echo "☸️  Step 6/7: Creating Kubernetes resources..."

# Create namespace
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Create TLS secret
echo "  Creating TLS secret..."
ssh $K8S_HOST "sudo cat /etc/ssl/sound-recorder/tls.crt" > /tmp/tls.crt
ssh $K8S_HOST "sudo cat /etc/ssl/sound-recorder/tls.key" > /tmp/tls.key
kubectl create secret tls sound-recorder-tls \
  --cert=/tmp/tls.crt \
  --key=/tmp/tls.key \
  -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
rm /tmp/tls.crt /tmp/tls.key

# Apply deployment and service
echo "  Applying deployment..."
kubectl apply -f k8s/deployment.yaml -n $NAMESPACE

echo "  Applying service..."
kubectl apply -f k8s/service.yaml -n $NAMESPACE

echo "✅ Kubernetes resources created"
echo ""

# Step 7: Wait for deployment
echo "⏳ Step 7/7: Waiting for deployment to be ready..."
kubectl rollout status deployment/sound-recorder -n $NAMESPACE --timeout=120s
echo "✅ Deployment ready"
echo ""

# Cleanup
echo "🧹 Cleaning up local files..."
rm -f sound-recorder.tar
echo "✅ Cleanup complete"
echo ""

# Get service info
echo "=========================================="
echo "🎉 Deployment Complete!"
echo "=========================================="
echo ""
echo "Access your application at:"
echo "  🔒 HTTPS: https://$DOMAIN:30443"
echo ""
echo "Note: You'll see a browser warning for the self-signed certificate."
echo "Click 'Advanced' → 'Proceed to site' to access the app."
echo ""
echo "Kubernetes Resources:"
kubectl get pods -n $NAMESPACE
echo ""
kubectl get svc -n $NAMESPACE
echo ""
