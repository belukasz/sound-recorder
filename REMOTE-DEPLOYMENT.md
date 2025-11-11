# Remote Bare Metal Kubernetes Deployment

This guide is for deploying to a Kubernetes cluster running on a **different machine**.

## Prerequisites

- SSH access to your Kubernetes node
- kubectl configured to access the remote cluster
- Docker installed locally (for building the image)

## Option 1: Automated Deployment (Recommended)

### Setup
Edit `deploy-remote.sh` and set your Kubernetes node address:
```bash
export K8S_HOST="user@192.168.1.100"  # Your k8s node SSH address
```

### Deploy
```bash
./deploy-remote.sh
```

This will:
1. Build the image locally
2. Copy it to your k8s node via SCP
3. Load it into containerd on the remote node
4. Deploy to Kubernetes

## Option 2: Manual Deployment

### Step 1: Build Image Locally
```bash
docker build -t sound-recorder:latest .
docker save sound-recorder:latest -o sound-recorder.tar
```

### Step 2: Copy to Remote Node
```bash
# Replace with your k8s node address
scp sound-recorder.tar user@192.168.1.100:/tmp/
```

### Step 3: Load on Remote Node
SSH into your k8s node and run:

**For containerd (most common):**
```bash
ssh user@192.168.1.100
sudo ctr -n k8s.io images import /tmp/sound-recorder.tar
rm /tmp/sound-recorder.tar
exit
```

**For Docker runtime:**
```bash
ssh user@192.168.1.100
docker load -i /tmp/sound-recorder.tar
rm /tmp/sound-recorder.tar
exit
```

**For CRI-O:**
```bash
ssh user@192.168.1.100
sudo crictl load /tmp/sound-recorder.tar
rm /tmp/sound-recorder.tar
exit
```

### Step 4: Deploy to Kubernetes
From your local machine (with kubectl configured):
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment-local.yaml -n sound-recorder
kubectl apply -f k8s/service.yaml -n sound-recorder
```

### Step 5: Verify
```bash
kubectl get pods -n sound-recorder
kubectl get svc -n sound-recorder
```

## Option 3: Use a Docker Registry

For easier updates, set up a local registry on your network:

### On your k8s node:
```bash
docker run -d -p 5000:5000 --restart=always --name registry registry:2
```

### From your local machine:
```bash
# Build and tag
docker build -t localhost:5000/sound-recorder:latest .

# Push to local registry (use k8s node IP)
docker tag localhost:5000/sound-recorder:latest 192.168.1.100:5000/sound-recorder:latest
docker push 192.168.1.100:5000/sound-recorder:latest
```

### Update deployment.yaml to use registry:
```yaml
spec:
  containers:
  - name: sound-recorder
    image: 192.168.1.100:5000/sound-recorder:latest
    imagePullPolicy: Always
```

### Configure k8s to allow insecure registry:
On k8s node, edit `/etc/containerd/config.toml`:
```toml
[plugins."io.containerd.grpc.v1.cri".registry.mirrors."192.168.1.100:5000"]
  endpoint = ["http://192.168.1.100:5000"]

[plugins."io.containerd.grpc.v1.cri".registry.configs."192.168.1.100:5000".tls]
  insecure_skip_verify = true
```

Restart containerd:
```bash
sudo systemctl restart containerd
```

## Accessing the Application

### Option 1: Port Forward (from anywhere)
```bash
kubectl port-forward svc/sound-recorder 8080:80 -n sound-recorder
```
Open: http://localhost:8080

### Option 2: NodePort (access via k8s node IP)

Edit `k8s/service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: sound-recorder
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080  # Choose 30000-32767
  selector:
    app: sound-recorder
```

Apply:
```bash
kubectl apply -f k8s/service.yaml -n sound-recorder
```

Access at: `http://<k8s-node-ip>:30080`

### Option 3: Ingress (if you have nginx-ingress)

First install nginx-ingress controller on your cluster:
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/baremetal/deploy.yaml
```

Then apply the ingress:
```bash
kubectl apply -f k8s/ingress.yaml -n sound-recorder
```

Get the ingress port:
```bash
kubectl get svc -n ingress-nginx
```

Access via: `http://<k8s-node-ip>:<ingress-port>`

## Updating the Application

### Using the script:
```bash
./deploy-remote.sh
```

### Manual update:
```bash
# 1. Build new image
docker build -t sound-recorder:latest .
docker save sound-recorder:latest -o sound-recorder.tar

# 2. Copy to remote
scp sound-recorder.tar user@192.168.1.100:/tmp/

# 3. Load on remote
ssh user@192.168.1.100 "sudo ctr -n k8s.io images import /tmp/sound-recorder.tar && rm /tmp/sound-recorder.tar"

# 4. Restart pods
kubectl delete pods -l app=sound-recorder -n sound-recorder
```

## Troubleshooting

### Cannot SSH to k8s node
```bash
# Test SSH connection
ssh user@192.168.1.100 "echo 'Connection successful'"

# Set up SSH key if needed
ssh-copy-id user@192.168.1.100
```

### Permission denied on remote node
```bash
# Your user needs sudo access or be in docker group
ssh user@192.168.1.100 "sudo -v"
```

### Check which runtime your cluster uses
```bash
kubectl get nodes -o wide
# Look at CONTAINER-RUNTIME column
```

### Verify image on remote node
```bash
# For containerd
ssh user@192.168.1.100 "sudo ctr -n k8s.io images ls | grep sound-recorder"

# For docker
ssh user@192.168.1.100 "docker images | grep sound-recorder"
```

### Still getting ImagePullBackOff
```bash
# Check pod events
kubectl describe pod -l app=sound-recorder -n sound-recorder

# Verify image is loaded on the CORRECT node
kubectl get pods -n sound-recorder -o wide
# Note which node the pod is on

ssh user@<that-node-ip> "sudo ctr -n k8s.io images ls | grep sound-recorder"
```

## SSH Configuration Tips

Create `~/.ssh/config` for easier connection:
```
Host k8s-node
    HostName 192.168.1.100
    User your-username
    IdentityFile ~/.ssh/id_rsa
```

Then use:
```bash
export K8S_HOST="k8s-node"
./deploy-remote.sh
```

## Cleanup

```bash
# Delete from Kubernetes
kubectl delete namespace sound-recorder

# Remove image from remote node
ssh user@192.168.1.100 "sudo ctr -n k8s.io images rm docker.io/library/sound-recorder:latest"

# Remove local image
docker rmi sound-recorder:latest
```
