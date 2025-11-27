# Sound Recorder - Reaction Training Application

A web-based reaction training application that allows you to record sounds and create randomized exercise sequences for martial arts, sports, or any activity requiring unpredictable audio cues.

![React](https://img.shields.io/badge/React-18.3-blue)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5)

## Features

### 🎙️ Sound Recording
- Record audio directly from your microphone
- Play back recordings to verify
- Rename recordings for easy identification
- Delete unwanted recordings
- Mobile-compatible (iOS/Android)

### 📋 Phase System
- Create training phases with multiple recordings
- Configure random delay intervals (min/max seconds)
- Run phases continuously with unpredictable timing
- Each phase plays ONE random recording from its pool

### 💪 Exercise System
- Combine multiple phases into structured exercises
- Define repetition counts (how many times to run the full sequence)
- Phases execute sequentially in order
- Each phase plays a random recording from its pool
- Perfect for progressive training (warm-up → intense → cool-down)

### 🎯 Use Cases
- **Martial Arts**: Random striking combinations (jab, cross, hook, uppercut)
- **Sports Training**: Drill calls for basketball, football, soccer
- **Fitness**: HIIT workout instructions with random exercises
- **Reaction Training**: Unpredictable audio cues for agility drills
- **Language Learning**: Random vocabulary or phrase practice

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:5173

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker Deployment

### Build and Run Locally

```bash
# Build the Docker image
docker build -t sound-recorder:latest .

# Run with HTTP
docker run -p 8080:80 sound-recorder:latest

# Or run with HTTPS (requires SSL certificates)
docker run -p 8080:80 -p 8443:443 \
  -v /path/to/certs:/etc/caddy/ssl:ro \
  sound-recorder:latest
```

Access at:
- HTTP: http://localhost:8080
- HTTPS: https://localhost:8443

> **Note**: Browsers require HTTPS for microphone access when not on localhost

## Kubernetes Deployment

### Deploy to Kubernetes

```bash
# Set your Kubernetes node address (if deploying remotely)
export K8S_HOST="ubuntu@192.168.1.100"

# Deploy
./deploy.sh
```

The deployment script will:
1. Build the Docker image for linux/amd64
2. Transfer the image to your Kubernetes server
3. Generate self-signed SSL certificates
4. Deploy to Kubernetes with HTTPS support

### Access Your Application

After deployment:
- **HTTP**: http://your-node-ip:30080
- **HTTPS**: https://your-node-ip:30443

> **Note**: Self-signed certificates will show a browser warning. For production, see [LETS-ENCRYPT-SETUP.md](LETS-ENCRYPT-SETUP.md)

### Additional Guides

- [Caddy Migration Details](CADDY-MIGRATION.md)
- [Let's Encrypt Setup](LETS-ENCRYPT-SETUP.md)

## Architecture

### Tech Stack

- **Frontend**: React 18.3 + Vite
- **Audio API**: MediaRecorder API (browser native)
- **Styling**: Pure CSS with component-scoped styles
- **Storage**: Browser memory (session-based)
- **Deployment**: Docker + Kubernetes + Caddy

### Project Structure

```
sound-recorder/
├── src/
│   ├── components/
│   │   ├── RecordingControls.jsx    # Record/Stop buttons
│   │   ├── RecordingsList.jsx       # List of recordings
│   │   ├── RecordingItem.jsx        # Individual recording
│   │   ├── PhaseManager.jsx         # Phase creation/management
│   │   ├── ExerciseManager.jsx      # Exercise creation/management
│   │   └── StatusMessage.jsx        # Status feedback
│   ├── App.jsx                      # Main application
│   └── main.jsx                     # Entry point
├── k8s/                             # Kubernetes manifests
│   ├── deployment.yaml              # App deployment
│   ├── service.yaml                 # NodePort service
│   └── namespace.yaml               # Namespace definition
├── Dockerfile                       # Multi-stage build with Caddy
├── Caddyfile                        # Caddy web server configuration
├── deploy.sh                        # Kubernetes deployment script
├── CADDY-MIGRATION.md               # Caddy migration details
└── LETS-ENCRYPT-SETUP.md            # Let's Encrypt setup guide
```

## How It Works

### Workflow Example

1. **Record Sounds**
   - Record: "Jab", "Cross", "Hook", "Uppercut"
   - Record: "Jump", "Duck", "Side Step"

2. **Create Phases**
   - **Warm Up Phase**: "Jab", "Cross" (3-5 second delays)
   - **Intense Phase**: All punches (1-2 second delays)
   - **Footwork Phase**: "Jump", "Duck", "Side Step" (2-4 second delays)

3. **Create Exercise**
   - Name: "Boxing Workout"
   - Phases: Warm Up → Intense → Footwork
   - Repetitions: 3
   - Each phase plays ONE random recording

4. **Run Exercise**
   - Rep 1: Warm Up (plays "Cross") → Intense (plays "Hook") → Footwork (plays "Duck")
   - Rep 2: Warm Up (plays "Jab") → Intense (plays "Uppercut") → Footwork (plays "Jump")
   - Rep 3: Warm Up (plays "Jab") → Intense (plays "Cross") → Footwork (plays "Side Step")
   - **Completed!**

### Key Concepts

- **Unpredictability**: You never know which recording will play
- **Structured Randomness**: Phases ensure training progression
- **Repetition**: Practice the same sequence multiple times
- **Configurable Timing**: Control delay between cues

## Browser Compatibility

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✅ | ✅ | Full support |
| Firefox | ✅ | ✅ | Full support |
| Safari | ✅ (14.3+) | ✅ (iOS 14.3+) | Requires iOS 14.3+ for MediaRecorder |
| Edge | ✅ | ✅ | Full support |

**Important**: Microphone access requires HTTPS when accessing from remote servers (HTTP works only on localhost).

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Modern web browser

### Run in Development Mode

```bash
npm install
npm run dev
```

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

## Kubernetes Features

- **Multi-platform builds**: linux/amd64 support
- **Resource limits**: Configurable CPU and memory (64Mi/128Mi, 100m/200m)
- **Health checks**: HTTP-based liveness and readiness probes
- **Automatic HTTPS**: Self-signed certificates (upgradeable to Let's Encrypt)
- **Dual port support**: HTTP (30080) and HTTPS (30443) via NodePort
- **Caddy web server**: Automatic HTTPS with minimal configuration
- **Persistent storage ready**: Can mount volumes for certificate persistence

## Configuration

### Phase Delays

Configure per-phase:
- **Initial Delay**: Minimum wait time (seconds)
- **Maximum Delay**: Maximum wait time (seconds)

Random delay is calculated between these values.

### Exercise Repetitions

Set how many times the entire exercise sequence repeats.

### Resource Limits (Kubernetes)

Edit `k8s/deployment.yaml`:

```yaml
resources:
  requests:
    memory: "64Mi"
    cpu: "100m"
  limits:
    memory: "128Mi"
    cpu: "200m"
```

## Troubleshooting

### Microphone Access Error

**Problem**: "Error: Could not access microphone"

**Solutions**:
1. Use HTTPS (required for remote access)
2. Use localhost/127.0.0.1 (HTTP allowed)
3. Use `kubectl port-forward` to access via localhost
4. Check browser permissions

### ImagePullBackOff (Kubernetes)

**Problem**: Pods fail to start with ImagePullBackOff

**Solution**: The deployment uses local images (imagePullPolicy: Never)
```bash
# Ensure image is loaded on the Kubernetes node
./deploy.sh
```

### Platform Mismatch

**Problem**: Image won't load on different architecture

**Solution**: The deploy.sh script automatically builds for linux/amd64. If building manually:
```bash
docker build --platform linux/amd64 -t sound-recorder:latest .
```

### Pod Not Ready / Health Probe Failures

**Problem**: Pod shows as not ready or restarts frequently

**Cause**: Health probes failing (common with TLS/certificate issues)

**Solution**:
- Check pod logs: `kubectl logs -n sound-recorder -l app=sound-recorder`
- Verify ports 80 and 443 are exposed in deployment
- Ensure health probes use HTTP on port 80 (not HTTPS)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

Built with:
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) - Audio recording
- [Kubernetes](https://kubernetes.io/) - Container orchestration
- [Docker](https://www.docker.com/) - Containerization
- [Caddy](https://caddyserver.com/) - Web server with automatic HTTPS

---

**Made for reaction training enthusiasts** 🥊 🏃 ⚡
