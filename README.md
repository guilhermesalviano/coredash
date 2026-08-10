<p align="left">
  <img src="https://raw.githubusercontent.com/guilhermesalviano/casaos-coredash/main/coredash/public/logo.png" height="48" />
  &nbsp;&nbsp;
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=36&pause=2000&color=6366F1&vCenter=true&width=260&height=48&lines=CoreDash" alt="CoreDash" />
</p>
CoreDash is a lightweight, self-hosted personal dashboard.

## 🚀 Overview
Built for personal automation, system monitoring, and habit tracking, CoreDash is optimized for low-cost, "home lab" style hardware.

## Getting started
 
```bash
docker run -d \
  -p 3000:3000 \
  --name coredash \
  guilhermesalviano/coredash:latest
```
 
Or with Docker Compose:
 
```yaml
services:
  coredash:
    image: guilhermesalviano/coredash:latest
    ports:
      - "3000:3000"
    restart: unless-stopped
```
## 🛠 Development
#### Prerequisites
- Node.js (LTS version)
- Docker & Docker Compose

#### Run the coredash App
To start the frontend development server:

```Bash
cd coredash
npm run dev
```
#### Mock Services
To run the backend services and mock APIs using Docker Compose:
```Bash
docker compose up --build
```
The mock will run all external apis with mock data, using mockserver image, it will make the start easier and simpler.

## 📦 Deployment
CoreDash is designed to be deployed via Docker.

1. Pull the image locally or within your CasaOS dashboard.
2. Configure Environment Variables (.env) with your specific settings.
3. Deploy and access the dashboard via the local IP on your network.