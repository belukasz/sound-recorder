# Let's Encrypt Setup Guide

This guide explains how to enable automatic SSL certificates from Let's Encrypt with your current Caddy setup.

## Prerequisites

- A registered domain name (e.g., `soundrecorder.example.com`)
- DNS configured to point to your server IP (`192.99.35.139`)
- Ports 80 and 443 accessible from the internet

## Steps to Enable Let's Encrypt

### 1. Domain Setup

- **Register a domain** or use an existing one
- **Configure DNS A record** to point to your server:
  ```
  soundrecorder.example.com  →  192.99.35.139
  ```
- **Wait for DNS propagation** (can take 5-60 minutes)
- **Verify DNS** is working:
  ```bash
  nslookup soundrecorder.example.com
  dig soundrecorder.example.com
  ```

### 2. Firewall Configuration

Let's Encrypt requires ports 80 and 443 to be publicly accessible for domain validation.

#### Check Current Firewall Rules

```bash
ssh ubuntu@192.99.35.139 "sudo iptables -L -n -v"
```

#### Allow Ports 80 and 443

If needed, add firewall rules:

```bash
# Using iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Using ufw (if installed)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

#### Verify Ports are Open

From an external machine:
```bash
telnet 192.99.35.139 80
telnet 192.99.35.139 443
```

Or use online tools like: https://www.yougetsignal.com/tools/open-ports/

### 3. Update Caddyfile

Replace the current IP-based configuration with your domain.

**Before:**
```caddyfile
:80 {
    # ... config
}

:443 {
    tls /etc/caddy/ssl/tls.crt /etc/caddy/ssl/tls.key
    # ... config
}
```

**After:**
```caddyfile
{
    email your-email@example.com
}

soundrecorder.example.com {
    root * /usr/share/caddy
    encode gzip

    @static {
        path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2 *.ttf *.eot
    }
    header @static Cache-Control "public, max-age=31536000, immutable"

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
    }

    try_files {path} {path}/ /index.html
    file_server
}
```

**Key changes:**
- Replace `:80` and `:443` with your domain name
- Remove `tls /etc/caddy/ssl/tls.crt /etc/caddy/ssl/tls.key` line
- Add global `email` directive for Let's Encrypt notifications
- Caddy will automatically handle HTTP→HTTPS redirect
- Caddy will automatically obtain and renew certificates

### 4. Update Kubernetes Service

Change from NodePort to LoadBalancer or use an Ingress controller.

#### Option A: LoadBalancer (Simpler)

Update `k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: sound-recorder
  labels:
    app: sound-recorder
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
    name: http
  - port: 443
    targetPort: 443
    protocol: TCP
    name: https
  selector:
    app: sound-recorder
```

This exposes ports 80 and 443 directly on your server's public IP.

#### Option B: Ingress (More Advanced)

If you prefer using an Ingress controller, you'll need to:
1. Install an ingress controller (e.g., nginx-ingress, traefik)
2. Create an Ingress resource pointing to your service
3. Configure the ingress to use Caddy as backend

### 5. Update Kubernetes Deployment

Remove the TLS certificate volume mount since Caddy will manage certificates automatically.

**Update `k8s/deployment.yaml`:**

Remove these lines:
```yaml
        volumeMounts:
        - name: tls-certs
          mountPath: /etc/caddy/ssl
          readOnly: true
```

And:
```yaml
      volumes:
      - name: tls-certs
        secret:
          secretName: sound-recorder-tls
```

Caddy will store certificates in `/data/caddy` automatically.

**Add persistent volume for certificates (recommended):**

```yaml
      volumes:
      - name: caddy-data
        persistentVolumeClaim:
          claimName: caddy-data-pvc
```

Create a PVC:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: caddy-data-pvc
  namespace: sound-recorder
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

### 6. Update Deployment Script

Modify `deploy.sh` to remove the self-signed certificate generation step.

**Remove or comment out Step 5:**

```bash
# Step 5: Generate SSL certificate (NO LONGER NEEDED)
# Caddy will automatically obtain Let's Encrypt certificates
```

**Remove or comment out TLS secret creation in Step 6:**

```bash
# Create TLS secret (NO LONGER NEEDED)
# kubectl create secret tls sound-recorder-tls ...
```

### 7. Deploy Updated Configuration

```bash
./deploy.sh
```

### 8. Verify Let's Encrypt Certificate

After deployment, check the Caddy logs:

```bash
kubectl logs -n sound-recorder -l app=sound-recorder --tail=100 | grep -i "certificate"
```

You should see messages about obtaining certificates from Let's Encrypt.

### 9. Test Your Domain

Access your application:
```
https://soundrecorder.example.com
```

Verify the certificate:
- Click the padlock icon in your browser
- Check that the certificate is issued by "Let's Encrypt"
- Verify there are no browser warnings

## Troubleshooting

### Certificate Not Obtained

**Check Caddy logs:**
```bash
kubectl logs -n sound-recorder -l app=sound-recorder
```

**Common issues:**
- DNS not propagated yet (wait and try again)
- Ports 80/443 not accessible from internet
- Domain pointing to wrong IP
- Rate limit hit (Let's Encrypt has rate limits)

### DNS Not Resolving

```bash
nslookup soundrecorder.example.com
dig soundrecorder.example.com
```

If DNS doesn't resolve to `192.99.35.139`, update your DNS settings and wait for propagation.

### Ports Not Accessible

Test from external machine:
```bash
curl -I http://192.99.35.139
curl -I https://192.99.35.139
```

Check firewall rules:
```bash
sudo iptables -L -n
sudo ufw status
```

### Let's Encrypt Rate Limits

Let's Encrypt has rate limits:
- 5 failed validations per account per hour
- 50 certificates per registered domain per week

If you hit the rate limit, wait or use Let's Encrypt staging for testing:

```caddyfile
{
    email your-email@example.com
    acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
}
```

## Certificate Renewal

Caddy automatically renews certificates before they expire (Let's Encrypt certificates are valid for 90 days).

**Check certificate expiration:**
```bash
echo | openssl s_client -servername soundrecorder.example.com -connect soundrecorder.example.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Rollback to Self-Signed Certificates

If you need to rollback, restore the original Caddyfile configuration:

```caddyfile
:443 {
    tls /etc/caddy/ssl/tls.crt /etc/caddy/ssl/tls.key
    # ... rest of config
}
```

And restore the volume mounts and deployment script.

## Resources

- [Caddy Documentation](https://caddyserver.com/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Caddy Automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [Let's Encrypt Rate Limits](https://letsencrypt.org/docs/rate-limits/)
