# Instalación conservadora de disponibilidad mensual sobre el frontend existente.
# Ejecutar en la raíz de dsw2026-tpi-front desde PowerShell.
param([switch]$SinAjustarLogin)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Read-Source([string]$relative) {
  $path = Join-Path $root $relative

  if (-not (Test-Path $path -PathType Leaf)) {
    throw "No encontré $relative. Copiá el ZIP sobre la RAÍZ del frontend (dsw2026-tpi-front), no sobre src."
  }

  return [System.IO.File]::ReadAllText($path)
}

function Insert-Before([string]$source, [string]$pattern, [string]$insertion, [string]$label) {
  $match = [regex]::Match($source, $pattern)

  if (-not $match.Success) {
    throw "No pude ubicar el punto de integración en $label. Es probable que el equipo haya cambiado ese archivo. No lo reemplacé."
  }

  return $source.Substring(0, $match.Index) + $insertion + $source.Substring($match.Index)
}

# Calcular todo antes de modificar archivos: si falta un anclaje, no tocar nada.
$changes = @{}
$appPath = 'src/App.jsx'
$app = Read-Source $appPath

if ($app -notmatch 'import AvailabilityPage from') {
  $anchor = "import DoctorsPage from './modules/doctors/pages/DoctorsPage';"

  if (-not $app.Contains($anchor)) { throw 'No se encontró el import de DoctorsPage en App.jsx.' }

  $app = $app.Replace($anchor, "$anchor`nimport AvailabilityPage from './modules/availability/pages/AvailabilityPage';")
}

if ($app -notmatch "path: 'availability'") {
  $fragment = @'
      {
        path: 'availability',
        element: <AvailabilityPage />,
      },
'@
  $app = Insert-Before $app "(?m)^      \{\r?\n        path: 'doctors'," ($fragment + "`n") $appPath
}

$changes[$appPath] = $app

$layoutPath = 'src/modules/dashboard/components/DashboardLayout.jsx'
$layout = Read-Source $layoutPath

if ($layout -notmatch "to: '/admin/availability'") {
  $fragment = @'
    {
      to: '/admin/availability',
      label: 'Disponibilidad',
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
            d="M8 2v4m8-4v4M3 10h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zm3 10h3m2 0h3"
          />
        </svg>
      ),
    },
'@
  $layout = Insert-Before $layout "(?m)^    \{\r?\n      to: '/admin/specialties'," ($fragment + "`n") $layoutPath
}

$changes[$layoutPath] = $layout

$doctorPath = 'src/modules/doctors/pages/DoctorsPage.jsx'
$doctor = Read-Source $doctorPath

if ($doctor -match "alert\('Abrir modal de disponibilidad horaria'\)") {
  $oldImport = "import { useState } from 'react';"

  if ($doctor -notmatch "import \{ useNavigate \} from 'react-router-dom';") {
    if (-not $doctor.Contains($oldImport)) { throw 'El import de DoctorsPage cambió y requiere integración manual.' }

    $doctor = $doctor.Replace($oldImport, "$oldImport`nimport { useNavigate } from 'react-router-dom';")
  }

  if ($doctor -notmatch 'const navigate = useNavigate\(\);') {
    $needle = 'function DoctorsPage() {'

    if (-not $doctor.Contains($needle)) { throw 'La función DoctorsPage cambió y requiere integración manual.' }

    $doctor = $doctor.Replace($needle, "$needle`n  const navigate = useNavigate();")
  }

  $doctor = $doctor.Replace("onClick={() => alert('Abrir modal de disponibilidad horaria')}", "onClick={() => navigate('/admin/availability')}")
}

$changes[$doctorPath] = $doctor

if (-not $SinAjustarLogin) {
  $authPath = 'src/modules/auth/services/adminLogin.js'
  $auth = Read-Source $authPath

  if ($auth.Contains("instance.post('api/admin/auth/login', {")) {
    # Arreglar la ruta y el nombre de campo del servicio actual. No tocar el AuthProvider.
    $auth = $auth.Replace("instance.post('api/admin/auth/login', {", "instance.post('api/auth/admin/login', {")
    $auth = [regex]::Replace($auth, '(?m)^    username,\s*$', '    email: username,')
  }

  $changes[$authPath] = $auth
}

# Escritura UTF-8 sin BOM, compatible con Vite / ESLint.
$utf8 = [System.Text.UTF8Encoding]::new($false)

foreach ($relative in $changes.Keys) {
  $path = Join-Path $root $relative
  $original = [System.IO.File]::ReadAllText($path)

  if ($original -ne $changes[$relative]) {
    [System.IO.File]::WriteAllText($path, $changes[$relative], $utf8)
    Write-Host "Actualizado: $relative" -ForegroundColor Green
  }
  else {
    Write-Host "Sin cambios: $relative" -ForegroundColor Gray
  }
}

$envFile = Join-Path $root '.env.development.local'

if (-not (Test-Path $envFile)) {
  [System.IO.File]::WriteAllText($envFile, "VITE_BACKEND_URL=http://localhost:5278`n", $utf8)
  Write-Host 'Creado .env.development.local (ignorado por Git).' -ForegroundColor Green
}
else {
  Write-Host 'Se conservó tu .env.development.local existente; verificá VITE_BACKEND_URL.' -ForegroundColor Yellow
}

Write-Host "`nIntegración terminada. Abrí /admin/availability una vez iniciado Vite." -ForegroundColor Cyan
Write-Host 'Comprobaciones: npm.cmd ci; npm.cmd run lint; npm.cmd run build; node --test src/modules/availability/utils/availabilityValidation.test.mjs'
Write-Host 'Antes de subir: git diff --check; git status -sb'
