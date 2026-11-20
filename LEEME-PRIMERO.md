# Turno Norte — entrega frontend de Nacho

**Base revisada:** `emiliolj1/dsw2026-tpi-front`, rama `development`, consulta realizada el 20/11/2026. **API:** contrato de desarrollo v1.7.

## Qué vas a copiar

Este ZIP **no es otro repositorio**. Contiene un módulo nuevo en `src/modules/availability/` y el script `Integrar-Nacho.ps1` para unirlo sin pisar los archivos completos del resto del equipo. No copies el ZIP dentro de `src` ni sobre el backend.

1. Descargá/descomprimí este ZIP. Copiá **todo su contenido** a la raíz de tu carpeta **`dsw2026-tpi-front`** (la que tiene `package.json`). Windows puede preguntarte si querés combinar carpetas; **sí, combinar**. No reemplaza ningún archivo previo de `src/modules/availability/` si esa carpeta ya existía: revisá conflictos antes de copiar.
2. Abrí **PowerShell** en `dsw2026-tpi-front`. Asegurate de estar en tu rama `feature/nacho-disponibilidad` (crear la rama desde `development` si no existe) y de tener guardados los cambios existentes. Ejecutá:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\Integrar-Nacho.ps1
   npm.cmd ci
   npx.cmd prettier --write src/modules/availability src/App.jsx src/modules/dashboard/components/DashboardLayout.jsx src/modules/doctors/pages/DoctorsPage.jsx src/modules/auth/services/adminLogin.js
   node --test src/modules/availability/utils/availabilityValidation.test.mjs
   npm.cmd run lint
   npm.cmd run build
   ```

3. Levantá la API y el frontend según `Guia_Turno_Norte_Nacho.markdown`: backend en **http://localhost:5278**, frontend en **http://localhost:5173**. Entrá con el **administrador real** configurado en tu base, no con las credenciales de demostración. Después abrí **http://localhost:5173/admin/availability**.
4. La pantalla consulta el **GET paginado de médicos reales**, permite elegir profesional, agrega y quita franjas por día, valida y guarda por POST/PUT. El menú del dashboard y el botón de "Agregar Disponibilidad Horaria" del listado existente se enlazan a esta pantalla. Podés probar crear, editar, cancelar cambios, cambiar de médico, guardar vacío y errores de la API.

**Si Emilio ya integró un login nuevo**, ejecutá el instalador con `-SinAjustarLogin` para no tocar `src/modules/auth/services/adminLogin.js`, y comprobá que su login llame a `POST /api/auth/admin/login` con `email` y `password` y guarde el JWT devuelto.

**Importante:** `.env.development.local` queda fuera de Git. El instalador solo lo crea si no existe; si ya existe comprobá que tenga `VITE_BACKEND_URL=http://localhost:5278`. `npm.cmd` evita el bloqueo de `npm.ps1` en Windows.

## Lo que no debés subir / todavía falta integrar

- **No subas** `.env.development.local`, tokens, contraseñas, `node_modules`, `dist` ni capturas con datos sensibles.
- Las páginas actuales de médicos, especialidades y autenticación aún contienen maquetas y lógica de demostración en la base revisada; **no son parte de este módulo**. El instalador solo conecta el botón y corrige el endpoint actual del login administrativo, sin reescribir `AuthProvider` ni el módulo de médicos.
- El GET administrativo devuelve `[]` tanto si no hay reglas como si se guardó una planificación vacía. En un inicio de sesión nuevo, la pantalla usa POST cuando la lista está vacía; si la API distingue internamente un plan vacío previo, podría exigir PUT. Eso requiere una decisión de contrato o ajuste junto al backend.
- La consigna presenta una tensión entre "próxima semana" y "mes actual". Esta implementación usa **el mes vigente** según la API actual. Emilio debe confirmar con el docente la vigencia definitiva.
- Sin levantar la base y autenticar una sesión **no puede garantizarse** la prueba de extremo a extremo: realizala siguiendo `Guia_Turno_Norte_Nacho.markdown` antes de abrir el PR.

## Subir únicamente tu parte

```powershell
git status -sb
git diff --check
git add src/modules/availability src/App.jsx src/modules/dashboard/components/DashboardLayout.jsx src/modules/doctors/pages/DoctorsPage.jsx src/modules/auth/services/adminLogin.js
git diff --cached --stat
git diff --cached --check
git commit -m "feat(frontend): editor de disponibilidad mensual"
git push -u origin feature/nacho-disponibilidad
```

Si omitiste el ajuste de login, no hace falta agregar ese archivo. El archivo `Integrar-Nacho.ps1` y este README son auxiliares: podés guardarlos fuera del repositorio y no incluirlos en el PR. Nunca uses `git add .` sin revisar el `git status`.

Abrí un **Pull Request hacia `development`**, no hacia `main`. La descripción sugerida está en `DESCRIPCION-PR.md` (adaptá las casillas a las pruebas que realmente realizaste).
