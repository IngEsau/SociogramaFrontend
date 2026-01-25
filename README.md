<p align="center">
  <img src="https://www.utpuebla.edu.mx/images/03_filosofy/utp.png" width="104" alt="Logo UTP">
</p>

<h1 align="center">Sistema Sociograma UTP - Frontend</h1>

> Aplicación web para la gestión y análisis de relaciones interpersonales mediante una prueba sociométrica para la Universidad Tecnológica de Puebla

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.18-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## 📋 Descripción del Proyecto

**Sociograma UTP** es un sistema web diseñado para tutores donde puedan facilitar la aplicación de una prueba sociométrica en grupos academicos. Permite identificar dinámicas grupales, detectar líderes, alumnos aislados y analizar las relaciones interpersonales entre estudiantes mediante la visualizacion gráfica interactiva.

### 🎯 Objetivos

- **Digitalizar** el proceso de recolección de datos sociométricos
- **Automatizar** la generación de grafos de relaciones entre alumnos
- **Facilitar** el análisis de cohesión grupal a tutores y administradores
- **Detectar** roles clave como líderes o estudiantes aislados

---

## ✨ Características Principales

- 🔐 Autenticación segura con **JWT** y **reCAPTCHA**
- 📊 **Visualización de grafos** de relaciones interpersonales
- 📈 Cálculo automático de **métricas sociométricas**
- 📱 Diseño **responsive**
- 🎨 Interfaz moderna con **Tailwind CSS**
- ⚡ Gestión de estado global con **Zustand**
- 🔄 Manejo automático de **refresh tokens**
- 📦 Importación masiva de datos vía **CSV**

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19**
- **Vite 7** con **SWC**
- **Tailwind CSS 4**
- **PostCSS**
- **Autoprefixer**
- **Zustand**
- **Axios**
- **React Router DOM**

### Backend
- **Django 5.0** + **Django REST Framework 3.14.0**
- **MySQL**
- **JWT Authentication**

---

## 🚀 Instalación y Configuración

### Requisitos previos

- **Node.js** >= 18.x
- **npm** >= 9.x

### 1️⃣ Clonar este repositorio

```bash
git clone https://github.com/IngEsau/SociogramaFrontend.git
cd SociogramaUTP-Front-End
npm install
```

### 2️⃣ Instalar Tailwind CSS y dependencias de estilo

```bash
npm install @tailwindcss/vite postcss autoprefixer
```

### 3️⃣ Instalar dependencias de estado y HTTP

```bash
npm install axios zustand react-router-dom
```

### 4️⃣ Configurar variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Edita el archivo `.env`:

```env
# Backend API URL
VITE_API_URL=https://api.com/api

# WebSocket URL
VITE_WS_URL=ws://ejemplo.com

# reCAPTCHA
VITE_RECAPTCHA_SITE_KEY=site_key
```

### 6️⃣ Ejecutar en desarrollo

```bash
npm run dev
```

---

## 📂 Estructura del Proyecto

```
src/
├── app/                  # Configuración de la aplicación
│   ├── router.tsx        # Rutas de React Router
│   └── RecaptchaProvider.tsx
│
├── features/             # Módulos por funcionalidad
│   └── auth/             # Autenticación
│       ├── components/   # Componentes de auth
│       ├── services/     # API de autenticación
│       ├── store/        # Store Zustand
│       └── views/        # Vistas
│
├── core/                 # Funcionalidad central
│   ├── api/              # Configuración Axios
│   ├── assets/           # Assets globales (imágenes, iconos)
│   ├── config/           # Configuraciones de variables
│   ├── hooks/            # Hooks compartidos globales
│   ├── styles/           # Estilos globales
│   ├── types/            # Tipos específicos
│   └── utils/            # Utilidades compartidas
│
├── components/           # Componentes reutilizables
├── layouts/              # Layouts de página
├── services/             # Servicios compartidos
└── store/                # Exportaciones de stores
```
---

## 👨‍💻 Autores

**MacB** - [@ItsDevMacB](https://github.com/ItsDevMacB) &
**IngEsau** - [@IngEsau](https://github.com/IngEsau)

---

## 📝 Licencia

© 2017 - 2026, Universidad Tecnológica de Puebla
