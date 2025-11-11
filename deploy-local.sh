#!/bin/bash

set -e

echo "🔨 Building Docker image..."
docker build -t sound-recorder:latest .

echo "📦 Saving Docker image to tar..."
docker save sound-recorder:latest -o sound-recorder.tar

echo "🚀 Loading image into containerd (k8s runtime)..."
# For containerd (most common in bare metal k8s)
sudo ctr -n k8s.io images import sound-recorder.tar

echo "🧹 Cleaning up tar file..."
rm sound-recorder.tar

echo "📝 Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment-local.yaml -n sound-recorder
kubectl apply -f k8s/service.yaml -n sound-recorder

echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=60s deployment/sound-recorder -n sound-recorder

echo "✅ Deployment complete!"
echo ""
echo "📊 Pod status:"
kubectl get pods -n sound-recorder

echo ""
echo "🌐 Service info:"
kubectl get svc -n sound-recorder

echo ""
echo "💡 To access the application, run:"
echo "   kubectl port-forward svc/sound-recorder 8080:80 -n sound-recorder"
echo "   Then open: http://localhost:8080"
