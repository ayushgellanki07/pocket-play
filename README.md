# Pocket Play

**Live Application:** https://pocket-play.onrender.com/

## Prerequisites

- Node.js 20.x LTS
- npm (v9 or newer)
- C/C++ build tools (\gcc\/\g++\ and \make\ on Linux, Visual C++ Build Tools on Windows for SQLite compilation)

---

## Setup Instructions

1. Clone the repository:
   git clone https://github.com/IIIT-ECell/megathon26-edgecase.git
   cd megathon26-edgecase

2. Install dependencies:
   npm install
   npm rebuild sqlite3 --build-from-source
   cd frontend
   npm install
   cd ..

---

## Build Instructions

Compile the frontend production bundle:
cd frontend
npm run build
cd ..

---

## Run Locally

From the repository root:
node server.js

The application serves the static React build and REST API at: http://localhost:4000 (or the port defined by process.env.PORT).

---

## External Datasets and Model Weights

No externally hosted datasets or model weights are used in this project.
