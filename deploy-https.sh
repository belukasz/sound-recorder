#!/bin/bash

K8S_HOST="${K8S_HOST:-ubuntu@192.99.35.139}"
IMAGE_NAME="sound-recorder:latest"

set -e

echo "🔨 Building Docker image with HTTPS support for linux/amd64 platform..."
docker build --platform linux/amd64 -f Dockerfile.https -t $IMAGE_NAME .

echo "📦 Saving Docker image to tar..."
docker save $IMAGE_NAME -o sound-recorder.tar

echo "📤 Copying image to remote Kubernetes node..."
scp sound-recorder.tar $K8S_HOST:/tmp/

echo "🚀 Loading image into remote containerd..."
ssh $K8S_HOST "sudo ctr -n k8s.io images import /tmp/sound-recorder.tar && rm /tmp/sound-recorder.tar"

echo "🧹 Cleaning up local tar file..."
rm sound-recorder.tar

echo "🔐 Setting up SSL certificates..."
./setup-https.sh

echo "📝 Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment-https.yaml -n sound-recorder
kubectl apply -f k8s/service-nodeport-https.yaml -n sound-recorder

echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=60s deployment/sound-recorder -n sound-recorder || true

echo "✅ Deployment complete!"
echo ""
echo "📊 Pod status:"
kubectl get pods -n sound-recorder

echo ""
echo "🌐 Service info:"
kubectl get svc -n sound-recorder

echo ""
echo "💡 To access the application:"
echo "   HTTPS (recommended): https://192.99.35.139:30443"
echo "   HTTP (redirects): http://192.99.35.139:30080"
echo ""
echo "⚠️  Note: You'll get a browser warning about self-signed certificate."
echo "   Click 'Advanced' and 'Proceed' to access the app."
