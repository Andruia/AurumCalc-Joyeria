---
description: Deploy AurumCalc to GitHub Pages (professional step-by-step)
---

# Deploy AurumCalc a GitHub Pages — Guía Profesional

## Pre-requisitos
- Git instalado y configurado
- Cuenta de GitHub activa
- Git repo local ya inicializado con branch `main`

---

## Paso 1: Crear el repositorio en GitHub

1. Ir a **https://github.com/new**
2. Configurar:
   - **Repository name:** `AurumCalc-Joyeria`
   - **Description:** `Calculadora profesional de aleaciones de oro para joyería — PWA`
   - **Visibility:** `Public` (requerido para GitHub Pages gratis) o `Private` (requiere GitHub Pro)
   - **NO** marcar "Add a README" (ya lo tenemos)
3. Click en **Create repository**
4. Copiar la URL del repo (ej: `https://github.com/TU-USUARIO/AurumCalc-Joyeria.git`)

## Paso 2: Conectar el repo local con GitHub

// turbo
```powershell
git remote add origin https://github.com/TU-USUARIO/AurumCalc-Joyeria.git
```
> ⚠️ Reemplazar `TU-USUARIO` con tu usuario real de GitHub

## Paso 3: Push al repositorio

// turbo
```powershell
git push -u origin main
```
> Si pide autenticación, usar Personal Access Token o GitHub CLI (`gh auth login`)

## Paso 4: Activar GitHub Pages

1. En GitHub, ir al repo → **Settings** → **Pages** (menú lateral izquierdo)
2. En **Source**, seleccionar: **GitHub Actions**
3. El workflow `deploy.yml` ya está configurado y se ejecutará automáticamente

## Paso 5: Verificar el deploy

1. Ir a la pestaña **Actions** del repo
2. Debería verse el workflow "Deploy to GitHub Pages" ejecutándose
3. Esperar ~1-2 minutos hasta que el check verde ✅ aparezca
4. La URL será: `https://TU-USUARIO.github.io/AurumCalc-Joyeria/`

## Paso 6: Probar en móvil

1. Abrir la URL desde el celular
2. **Android:** Chrome → Menú ⋮ → "Instalar app"
3. **iOS:** Safari → Compartir ↑ → "Agregar a pantalla de inicio"

---

## Dominio personalizado (opcional)

Para usar un dominio como `aurumcalc.andru.ia`:

1. En el repo, crear archivo `CNAME` con el dominio
2. En el proveedor DNS, agregar registro CNAME apuntando a `TU-USUARIO.github.io`
3. En Settings → Pages → Custom domain, escribir el dominio
4. Activar "Enforce HTTPS"

---

## Actualizaciones futuras

Cada vez que hagas cambios, solo necesitás:
```powershell
git add -A
git commit -m "descripción del cambio"
git push
```
El deploy se ejecuta automáticamente via GitHub Actions.
