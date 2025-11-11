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

# Run the container
docker run -p 8080:80 sound-recorder:latest
```

Access at: http://localhost:8080

### With HTTPS (for microphone access)

```bash
# Build with HTTPS support
docker build -f Dockerfile.https -t sound-recorder:latest .

# Run with port mapping
docker run -p 8443:443 sound-recorder:latest
```

Access at: https://localhost:8443

> **Note**: Browsers require HTTPS for microphone access (except on localhost)

## Kubernetes Deployment

### Local Kubernetes (Minikube, Kind, etc.)

```bash
./deploy-local.sh
```

### Remote Bare Metal Kubernetes

```bash
# Set your Kubernetes node address
export K8S_HOST="ubuntu@192.168.1.100"

# Deploy
./deploy-remote.sh
```

### With HTTPS Support

```bash
./deploy-https.sh
```

Access at: https://your-node-ip:30443

### Detailed Deployment Guides

- [General Kubernetes Deployment](DEPLOYMENT.md)
- [Bare Metal Deployment](BARE-METAL-DEPLOYMENT.md)
- [Remote Deployment](REMOTE-DEPLOYMENT.md)

## Architecture

### Tech Stack

- **Frontend**: React 18.3 + Vite
- **Audio API**: MediaRecorder API (browser native)
- **Styling**: Pure CSS with component-scoped styles
- **Storage**: Browser memory (session-based)
- **Deployment**: Docker + Kubernetes + Nginx

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
├── Dockerfile                       # Docker build (HTTP)
├── Dockerfile.https                 # Docker build (HTTPS)
└── deploy-*.sh                      # Deployment scripts
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

- **Multi-platform builds**: Supports ARM64 and AMD64
- **Resource limits**: Configurable CPU and memory
- **Health checks**: Liveness and readiness probes
- **Scaling**: Horizontal pod autoscaling ready
- **Service types**: LoadBalancer, NodePort, ClusterIP
- **Ingress support**: With TLS/SSL configuration
- **HTTPS**: Self-signed certificate generation

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

**Problem**: Pods fail to start

**Solution**: Use local image deployment:
```bash
./deploy-remote.sh  # For remote k8s
./deploy-local.sh   # For local k8s
```

### Platform Mismatch

**Problem**: Image won't load on different architecture

**Solution**: Build for correct platform:
```bash
docker build --platform linux/amd64 -t sound-recorder:latest .
```

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
- [Nginx](https://nginx.org/) - Web server

---

**Made for reaction training enthusiasts** 🥊 🏃 ⚡
