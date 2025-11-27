# Caddy Migration Summary

This document summarizes the steps taken to migrate from nginx to Caddy for automatic HTTPS support.

## Overview

Migrated the Sound Recorder application from nginx to Caddy web server to enable easier SSL/TLS management and prepare for Let's Encrypt integration.

## Changes Made

### 1. Created Caddyfile Configuration

**File:** `Caddyfile`

Created a new Caddyfile with dual HTTP/HTTPS configuration:

```caddyfile
{
	auto_https disable_redirects
}

:80 {
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

:443 {
	tls /etc/caddy/ssl/tls.crt /etc/caddy/ssl/tls.key

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

**Key features:**
- Serves on both port 80 (HTTP) and 443 (HTTPS)
- Uses self-signed certificates from Kubernetes secret
- Includes gzip compression
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Static asset caching with 1-year expiration
- SPA routing support (serves index.html for all routes)

### 2. Updated Dockerfile

**File:** `Dockerfile`

**Before (nginx):**
```dockerfile
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx-https.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /etc/nginx/ssl
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

**After (Caddy):**
```dockerfile
FROM caddy:2-alpine
COPY --from=builder /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
RUN mkdir -p /etc/caddy/ssl
EXPOSE 80 443
# Caddy starts automatically with default entrypoint
```

**Changes:**
- Base image: `nginx:alpine` → `caddy:2-alpine`
- Static files path: `/usr/share/nginx/html` → `/usr/share/caddy`
- Configuration file: `nginx-https.conf` → `Caddyfile`
- SSL directory: `/etc/nginx/ssl` → `/etc/caddy/ssl`
- Removed explicit CMD (Caddy uses default entrypoint)

### 3. Updated Kubernetes Deployment

**File:** `k8s/deployment.yaml`

**Changes made:**

#### Added HTTP port (port 80)
```yaml
ports:
- containerPort: 80
  name: http
- containerPort: 443
  name: https
```

#### Changed volume mount path
```yaml
volumeMounts:
- name: tls-certs
  mountPath: /etc/caddy/ssl  # Changed from /etc/nginx/ssl
  readOnly: true
```

#### Updated health probes to use HTTP
```yaml
livenessProbe:
  httpGet:
    path: /
    port: 80          # Changed from 443
    scheme: HTTP      # Changed from HTTPS
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /
    port: 80          # Changed from 443
    scheme: HTTP      # Changed from HTTPS
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

**Reason for HTTP health probes:**
- Kubernetes doesn't trust self-signed certificates
- Using HTTP on port 80 avoids TLS validation errors
- Prevents continuous pod restarts due to failed probes

### 4. Updated Kubernetes Service

**File:** `k8s/service.yaml`

**Before:**
```yaml
spec:
  type: NodePort
  ports:
  - port: 443
    targetPort: 443
    nodePort: 30443
    protocol: TCP
    name: https
```

**After:**
```yaml
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080
    protocol: TCP
    name: http
  - port: 443
    targetPort: 443
    nodePort: 30443
    protocol: TCP
    name: https
```

**Changes:**
- Added HTTP port 80 with NodePort 30080
- Kept HTTPS port 443 with NodePort 30443

### 5. Updated Documentation

**File:** `README.md`

Updated references from nginx to Caddy:

- Tech Stack: `Nginx` → `Caddy`
- Acknowledgments: `[Nginx](https://nginx.org/)` → `[Caddy](https://caddyserver.com/) - Web server with automatic HTTPS`

### 6. Deployment Process

The existing `deploy.sh` script continues to work without modifications:

1. Builds Docker image with Caddy
2. Saves and transfers image to remote server
3. Loads image into containerd
4. Generates self-signed SSL certificate (stored in `/etc/ssl/sound-recorder/`)
5. Creates Kubernetes TLS secret
6. Applies deployment and service manifests
7. Waits for rollout to complete

## Access Points

After migration, the application is accessible at:

- **HTTP:** http://192.99.35.139:30080
- **HTTPS:** https://192.99.35.139:30443 (with self-signed certificate warning)

## Benefits of Migration

### Immediate Benefits

1. **Simpler Configuration**
   - Caddyfile is more concise and readable than nginx config
   - Less boilerplate code

2. **Same Features Preserved**
   - Gzip compression
   - Static asset caching
   - Security headers
   - SPA routing support

3. **Better HTTP/2 and HTTP/3 Support**
   - Caddy enables HTTP/2 and HTTP/3 by default
   - Automatic protocol negotiation

### Future Benefits (with Domain)

1. **Automatic Let's Encrypt SSL**
   - Zero-configuration HTTPS with real domain
   - Automatic certificate renewal
   - No manual certificate management

2. **Automatic HTTP→HTTPS Redirects**
   - Built-in redirect from HTTP to HTTPS
   - No manual configuration needed

3. **OCSP Stapling**
   - Improved TLS performance
   - Automatic implementation

## Files Modified

- ✅ `Caddyfile` (new)
- ✅ `Dockerfile`
- ✅ `k8s/deployment.yaml`
- ✅ `k8s/service.yaml`
- ✅ `README.md`

## Files Unchanged (Still Used)

- ✅ `deploy.sh` (works without modifications)
- ✅ `k8s/namespace.yaml`
- ⚠️ `nginx.conf` (deprecated, can be removed)
- ⚠️ `nginx-https.conf` (deprecated, can be removed)

## Verification Steps

### 1. Check Pod Status
```bash
kubectl get pods -n sound-recorder
```

Expected: `STATUS: Running`, `READY: 1/1`

### 2. Check Service
```bash
kubectl get svc -n sound-recorder
```

Expected: Ports `80:30080/TCP,443:30443/TCP`

### 3. Test HTTP (Internal)
```bash
kubectl run test-curl --image=curlimages/curl:latest --rm -it --restart=Never -- \
  curl -v http://sound-recorder.sound-recorder.svc.cluster.local/
```

Expected: `HTTP/1.1 200 OK`

### 4. Test HTTPS (Internal)
```bash
kubectl run test-curl --image=curlimages/curl:latest --rm -it --restart=Never -- \
  curl -k -I https://sound-recorder.sound-recorder.svc.cluster.local/
```

Expected: `HTTP/2 200`

### 5. Test External Access
```bash
# HTTP
curl -I http://192.99.35.139:30080/

# HTTPS
curl -k -I https://192.99.35.139:30443/
```

Expected: Both return `200 OK`

### 6. Check Caddy Logs
```bash
kubectl logs -n sound-recorder -l app=sound-recorder --tail=50
```

Expected logs:
- `"msg":"server running","name":"srv0","protocols":["h1","h2","h3"]`
- `"msg":"server running","name":"srv1","protocols":["h1","h2","h3"]`
- No error messages

## Troubleshooting

### Issue: Health Probes Failing

**Symptoms:**
```
Warning  Unhealthy  kubelet  Liveness probe failed: Get "https://...": remote error: tls: internal error
```

**Solution:**
Change health probes to use HTTP on port 80 instead of HTTPS on port 443.

### Issue: Pod Not Starting

**Check logs:**
```bash
kubectl logs -n sound-recorder -l app=sound-recorder
```

**Common causes:**
- Caddyfile syntax error
- Missing SSL certificates
- Volume mount issues

### Issue: Can't Access from Browser

**Check:**
1. Pod is running: `kubectl get pods -n sound-recorder`
2. Service is correct: `kubectl get svc -n sound-recorder`
3. Firewall allows NodePort: Check if ports 30080/30443 are open
4. Test internally first before testing externally

### Issue: Certificate Errors

**Current Setup:**
Uses self-signed certificates from Kubernetes secret. Browser warnings are expected.

**Future:**
Follow `LETS-ENCRYPT-SETUP.md` to use real Let's Encrypt certificates.

## Next Steps

To enable automatic Let's Encrypt SSL certificates:

1. Obtain a domain name
2. Point DNS to `192.99.35.139`
3. Follow instructions in `LETS-ENCRYPT-SETUP.md`

## Rollback Plan

If you need to rollback to nginx:

1. Restore `Dockerfile` to use `nginx:alpine`
2. Update `k8s/deployment.yaml` volume mounts to `/etc/nginx/ssl`
3. Update `k8s/deployment.yaml` health probes to use HTTPS with certificate skip
4. Remove port 80 from service
5. Run `./deploy.sh`

## Migration Completion Date

November 27, 2025

## References

- [Caddy Documentation](https://caddyserver.com/docs/)
- [Caddyfile Syntax](https://caddyserver.com/docs/caddyfile)
- [Caddy Docker Image](https://hub.docker.com/_/caddy)
