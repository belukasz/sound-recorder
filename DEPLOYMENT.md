# Sound Recorder - Deployment Guide

## Docker Deployment

### Build Docker Image

```bash
docker build -t sound-recorder:latest .
```

### Run Docker Container Locally

```bash
docker run -p 8080:80 sound-recorder:latest
```

Access the application at: http://localhost:8080

### Push to Docker Registry

```bash
# Tag the image
docker tag sound-recorder:latest your-registry/sound-recorder:latest

# Push to registry
docker push your-registry/sound-recorder:latest
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (minikube, GKE, EKS, AKS, etc.)
- kubectl configured to access your cluster
- Docker image pushed to a registry accessible by your cluster

### Quick Start

1. **Create namespace:**
```bash
kubectl apply -f k8s/namespace.yaml
```

2. **Deploy the application:**
```bash
kubectl apply -f k8s/deployment.yaml -n sound-recorder
```

3. **Create service:**
```bash
kubectl apply -f k8s/service.yaml -n sound-recorder
```

4. **Check deployment status:**
```bash
kubectl get pods -n sound-recorder
kubectl get svc -n sound-recorder
```

### Access the Application

#### Using LoadBalancer (Cloud providers)
```bash
kubectl get svc sound-recorder -n sound-recorder
# Wait for EXTERNAL-IP to be assigned
```

#### Using Port Forward (Local/Development)
```bash
kubectl port-forward svc/sound-recorder 8080:80 -n sound-recorder
```
Access at: http://localhost:8080

### Optional: Ingress Setup

1. **Install NGINX Ingress Controller (if not already installed):**
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
```

2. **Update domain in ingress.yaml:**
Edit `k8s/ingress.yaml` and replace `sound-recorder.example.com` with your domain.

3. **Apply ingress:**
```bash
kubectl apply -f k8s/ingress.yaml -n sound-recorder
```

### Monitoring

```bash
# View logs
kubectl logs -f deployment/sound-recorder -n sound-recorder

# View pod details
kubectl describe pod -l app=sound-recorder -n sound-recorder

# View service details
kubectl describe svc sound-recorder -n sound-recorder
```

### Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment sound-recorder --replicas=5 -n sound-recorder

# Autoscaling (HPA)
kubectl autoscale deployment sound-recorder --cpu-percent=70 --min=2 --max=10 -n sound-recorder
```

### Update Deployment

```bash
# Build new image
docker build -t your-registry/sound-recorder:v2 .

# Push to registry
docker push your-registry/sound-recorder:v2

# Update deployment
kubectl set image deployment/sound-recorder sound-recorder=your-registry/sound-recorder:v2 -n sound-recorder

# Check rollout status
kubectl rollout status deployment/sound-recorder -n sound-recorder
```

### Cleanup

```bash
# Delete all resources
kubectl delete namespace sound-recorder

# Or delete individually
kubectl delete -f k8s/deployment.yaml -n sound-recorder
kubectl delete -f k8s/service.yaml -n sound-recorder
kubectl delete -f k8s/ingress.yaml -n sound-recorder
kubectl delete -f k8s/namespace.yaml
```

## Local Development with Minikube

```bash
# Start minikube
minikube start

# Build image in minikube's Docker environment
eval $(minikube docker-env)
docker build -t sound-recorder:latest .

# Deploy
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml -n sound-recorder
kubectl apply -f k8s/service.yaml -n sound-recorder

# Access the service
minikube service sound-recorder -n sound-recorder
```

## Configuration

### Resource Limits
Edit `k8s/deployment.yaml` to adjust resource limits:
- Memory: 64Mi (request) / 128Mi (limit)
- CPU: 100m (request) / 200m (limit)

### Replicas
Edit `k8s/deployment.yaml` to change the number of replicas:
```yaml
spec:
  replicas: 2  # Change this value
```

### Health Checks
The deployment includes:
- **Liveness Probe**: Checks if the container is running
- **Readiness Probe**: Checks if the container is ready to serve traffic

## Troubleshooting

### Pods not starting
```bash
kubectl get pods -n sound-recorder
kubectl describe pod <pod-name> -n sound-recorder
kubectl logs <pod-name> -n sound-recorder
```

### Image pull errors
Ensure your image is pushed to the registry and the cluster has access:
```bash
kubectl get events -n sound-recorder
```

### Service not accessible
```bash
kubectl get svc -n sound-recorder
kubectl get endpoints -n sound-recorder
```

## Production Considerations

1. **Use a specific image tag** instead of `:latest`
2. **Set up proper ingress** with TLS/SSL certificates
3. **Configure resource limits** based on actual usage
4. **Set up monitoring** (Prometheus, Grafana)
5. **Configure backup strategy** (though this app stores data in browser)
6. **Use secrets** for sensitive configuration
7. **Implement CI/CD** for automated deployments
