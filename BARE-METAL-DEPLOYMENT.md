# Bare Metal Kubernetes Deployment Guide

## Quick Deployment (Automated)

The easiest way to deploy on bare metal:

```bash
./deploy-local.sh
```

This script will:
1. Build the Docker image
2. Load it into your Kubernetes cluster
3. Deploy the application
4. Show you how to access it

## Manual Deployment Steps

### Option 1: Using containerd (Recommended)

If your Kubernetes uses containerd as the container runtime:

```bash
# 1. Build the image
docker build -t sound-recorder:latest .

# 2. Save the image to a tar file
docker save sound-recorder:latest -o sound-recorder.tar

# 3. Import into containerd
sudo ctr -n k8s.io images import sound-recorder.tar

# 4. Clean up
rm sound-recorder.tar

# 5. Deploy to Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment-local.yaml -n sound-recorder
kubectl apply -f k8s/service.yaml -n sound-recorder
```

### Option 2: Using Docker (if your k8s uses Docker)

```bash
# 1. Build the image on the node
docker build -t sound-recorder:latest .

# 2. Deploy to Kubernetes (image is already available locally)
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment-local.yaml -n sound-recorder
kubectl apply -f k8s/service.yaml -n sound-recorder
```

### Option 3: Using crictl (for CRI-O)

```bash
# 1. Build with Docker
docker build -t sound-recorder:latest .

# 2. Save and load into CRI-O
docker save sound-recorder:latest -o sound-recorder.tar
sudo crictl load sound-recorder.tar
rm sound-recorder.tar

# 3. Deploy
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment-local.yaml -n sound-recorder
kubectl apply -f k8s/service.yaml -n sound-recorder
```

## Verify Deployment

```bash
# Check pods are running
kubectl get pods -n sound-recorder

# Check logs
kubectl logs -f deployment/sound-recorder -n sound-recorder

# Describe pod if there are issues
kubectl describe pod -l app=sound-recorder -n sound-recorder
```

## Access the Application

### Option 1: Port Forward (Easiest)
```bash
kubectl port-forward svc/sound-recorder 8080:80 -n sound-recorder
```
Then open: http://localhost:8080

### Option 2: NodePort Service

Edit `k8s/service.yaml` and change type to NodePort:
```yaml
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080  # Choose a port between 30000-32767
```

Apply and access at: http://<your-node-ip>:30080

### Option 3: Using kubectl proxy
```bash
kubectl proxy --port=8080
```
Access at: http://localhost:8080/api/v1/namespaces/sound-recorder/services/http:sound-recorder:80/proxy/

## Updating the Application

```bash
# 1. Build new image
docker build -t sound-recorder:latest .

# 2. Load into cluster (containerd example)
docker save sound-recorder:latest -o sound-recorder.tar
sudo ctr -n k8s.io images import sound-recorder.tar
rm sound-recorder.tar

# 3. Delete and recreate pods to use new image
kubectl delete pods -l app=sound-recorder -n sound-recorder

# Or restart the deployment
kubectl rollout restart deployment/sound-recorder -n sound-recorder
```

## Troubleshooting

### ImagePullBackOff Error
This means the image isn't available locally. Make sure you:
1. Built the image: `docker build -t sound-recorder:latest .`
2. Loaded it into the cluster runtime (containerd/crio)
3. Used `imagePullPolicy: Never` in deployment-local.yaml

### Check which runtime your cluster uses:
```bash
kubectl get nodes -o wide
# Look at CONTAINER-RUNTIME column
```

### Verify image is loaded:
```bash
# For containerd
sudo ctr -n k8s.io images ls | grep sound-recorder

# For Docker
docker images | grep sound-recorder

# For CRI-O
sudo crictl images | grep sound-recorder
```

### Pod stuck in Pending
```bash
kubectl describe pod -l app=sound-recorder -n sound-recorder
# Check for resource constraints or scheduling issues
```

### Cannot access via NodePort
```bash
# Check if firewall is blocking the port
sudo iptables -L -n | grep 30080

# Or open the port
sudo firewall-cmd --add-port=30080/tcp --permanent
sudo firewall-cmd --reload
```

## Cleanup

```bash
# Delete all resources
kubectl delete namespace sound-recorder

# Remove image from containerd
sudo ctr -n k8s.io images rm docker.io/library/sound-recorder:latest

# Remove Docker image
docker rmi sound-recorder:latest
```

## Key Differences from Cloud Deployment

1. **No LoadBalancer**: Use NodePort or port-forward instead
2. **Local images**: Must manually load images into cluster
3. **imagePullPolicy**: Set to `Never` to use local images only
4. **Single replica**: For single-node, set replicas to 1
5. **No external ingress**: May need to use port-forward or NodePort
