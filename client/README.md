<div align="center">
  <img src="./public/favicon.svg" width="96" height="96" alt="Vaultix Logo" />

  # Vaultix
  *A clean, file-first digital workspace and secure sharing platform*

  [![React Version](https://img.shields.io/badge/React-v19.2-blue?style=flat-square&logo=react)](https://react.dev)
  [![Vite Version](https://img.shields.io/badge/Vite-v8.0-646CFF?style=flat-square&logo=vite)](https://vite.dev)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
  [![Framer Motion](https://img.shields.io/badge/Framer_Motion-v12.0-F107A3?style=flat-square&logo=framer)](https://www.framer.com/motion/)

  ⭐ If you like this project, star it on GitHub!

  [Overview](#overview) • [Features](#features) • [Design System](#design-system) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started)
</div>

---

## Overview

**Vaultix** is a premium, file-first digital workspace designed to keep the focus entirely on your content. Anchored on a clean white canvas with elegant near-monochrome primary actions and custom Cal Sans display typography, Vaultix prioritizes files, folders, previews, and sharing workflows over complex administrative dashboards.

The workspace is designed to feel like a personal digital studio—calm, intuitive, and visually centered around actual file content rather than decorative graphics or charts.

> [!NOTE]
> This repository contains the React-based frontend client for the Vaultix platform, designed for seamless file navigation, drag-and-drop uploading, and granular visibility management.

---

## Features

- 📁 **File-First Dashboard** — View and organize your recent, favorite, and shared files. Access your directories instantly from a workspace-focused interface.
- 📤 **Drag-and-Drop Uploads** — Effortlessly upload multiple files with progress tracking and real-time visual feedback.
- 👁️ **Rich File Previews** — View files, documents, and images natively within the application workspace.
- 🔒 **Granular Visibility Control** — Set specific accessibility options for your files, including *Public*, *Private*, *Shared*, and *Expired* states.
- 🔗 **Smart Link Sharing** — Generate and customize sharing links with precise expiration controls.
- 🎨 **Premium Aesthetic & Micro-animations** — Enjoy a highly responsive and polished interface featuring smooth transitions powered by Framer Motion.

---

## Design System

Vaultix is crafted according to strict web design guidelines that ensure visual harmony and premium user experience:

- **Typography** — The interface is split strictly between **Cal Sans** (display/headings) for modern confidence and **Inter** (body/UI components) for reading clarity.
- **Palette** — Primarily near-monochrome with a `#111111` brand primary color on a clean `#ffffff` canvas. Accent badge colors are soft pastels, and the page terminates with a scarce, deliberate dark footer (`#101010`).
- **Spacing & Radii** — Features a hierarchical radius system (ranging from 6px on small controls to 12px/16px on content cards) coupled with generous spacing.

---

## Tech Stack

The Vaultix client is built on modern, high-performance web technologies:

- **React 19** — Next-generation library for declarative component-driven UI.
- **Vite 8** — Ultra-fast build tool and development server.
- **Tailwind CSS v4** — High-performance utility CSS system.
- **Framer Motion 12** — Production-ready motion library for fluid interactions.
- **React Router v7** — Robust client-side routing.
- **Axios** — Efficient HTTP client for interacting with the backend API.

---

## Getting Started

Follow these instructions to run the Vaultix client environment locally.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org) (v20 or higher) installed on your system.

### Installation

1. Clone or navigate to the client project directory:
   ```bash
   cd client
   ```

2. Install the package dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will start, and the local URL (usually `http://localhost:5173`) will be displayed in your terminal.

### Building for Production

To compile and optimize the client application for production deployment:

```bash
npm run build
```

This generates static assets in the `dist` directory. You can preview the production build locally using:

```bash
npm run preview
```

### Code Quality

Run ESLint to check the codebase for syntax and style compliance:

```bash
npm run lint
```
