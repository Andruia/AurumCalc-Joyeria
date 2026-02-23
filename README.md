# AurumCalc — Calculadora de Aleaciones de Oro para Joyería

> 🪙 Aplicación web PWA profesional que calcula proporciones exactas de metales para crear aleaciones de oro de distintos kilates y colores.

## ✨ Características

- **3 Modos de Cálculo:**
  - Desde oro 24K disponible
  - Desde peso final deseado
  - Conversión entre kilates (subir/bajar)
- **Colores:** Amarillo, Rosa, Blanco, Verde
- **Kilates:** 9K, 10K, 14K, 18K, 21K, 22K
- **PWA Instalable** en Android e iOS
- **Funciona offline** gracias al Service Worker
- **Diseño premium** dark mode con glassmorphism

## 🧮 Motor de Conversión

| Dirección | Fórmula | Ejemplo |
|-----------|---------|---------|
| **Subir** (16K→18K) | `Y = W × (K2-K1) / (24-K2)` | 10g → +3.33g Au24K |
| **Bajar** (22K→18K) | `Liga = Gold_in / (K2/24) - W` | 10g → +2.22g liga |

## 🚀 Deploy

Este proyecto se despliega automáticamente a GitHub Pages via GitHub Actions en cada push a `main`.

**URL:** `https://<tu-usuario>.github.io/AurumCalc-Joyeria/`

## 📱 Instalar como App

1. Abrir la URL desde el navegador del celular
2. **Android (Chrome):** Menú ⋮ → "Instalar app"
3. **iOS (Safari):** Compartir ↑ → "Agregar a pantalla de inicio"

## 🛠️ Tecnologías

- HTML5 + CSS3 + JavaScript Vanilla
- PWA (Service Worker + Manifest)
- Google Fonts (Inter, Outfit)
- Cero dependencias externas

## 📄 Licencia

© 2026 **Andru.ia Solutions IA** — Todos los derechos reservados.
