# Build y despliegue

Guía breve para futuras sesiones. **Desarrollo en `develop`**, **producción desde `main`** tras merge.

## Error EACCES en `node_modules/gatsby`

### Síntoma

`npm run build` (o `gatsby build`) falla con permiso denegado, por ejemplo:

```text
Error: EACCES: permission denied, ... node_modules/gatsby/...
```

### Causa

La carpeta `node_modules` (o partes como `gatsby`) quedó con dueño **root**, típico tras builds en sandbox, contenedor o ejecutar `npm`/`gatsby` como root en el proyecto.

### Prevención

- No ejecutar `npm install`, `npm ci`, `gatsby build` ni `npm run build` como **root** en este repositorio.
- En contenedores, montar el proyecto con el UID del usuario o correr el proceso con ese usuario.

### Fix rápido (local)

```bash
sudo chown -R "$USER:$USER" node_modules/gatsby
# o todo node_modules si el problema es más amplio:
sudo chown -R "$USER:$USER" node_modules
```

Luego: `npm run build`.

## Despliegue estándar (producción)

1. Integrar cambios en **`main`** (merge desde `develop`).
2. En **`main`**, con dependencias y permisos correctos:

```bash
npm run deploy
```

(`deploy` suele incluir build + `firebase deploy`; revisar `package.json` si cambia el script.)

## Build limpio (alternativa)

Útil cuando `node_modules` local está corrupto o con permisos root y no quieres arreglarlo a mano, o para replicar el entorno de CI.

### Con Podman (ejemplo usado en deploy reciente)

Desde la raíz del repo, con **`main`** como referencia de lo que se publica:

```bash
git archive main | tar -x -C /tmp/gatsby-build-clean
cd /tmp/gatsby-build-clean
npm ci
npm run build
# Copiar artefacto o desplegar desde aquí según tu flujo; luego:
firebase deploy
```

Ajusta la ruta temporal y el proyecto Firebase según tu configuración.

### Directorio temporal (sin Podman)

```bash
tmpdir=$(mktemp -d)
git archive main | tar -x -C "$tmpdir"
cd "$tmpdir"
npm ci && npm run build
# firebase deploy desde $tmpdir si aplica
```

Elimina `$tmpdir` cuando termines.

## Ramas

| Rama      | Uso                          |
|-----------|------------------------------|
| `develop` | Trabajo diario, features     |
| `main`    | Producción, `npm run deploy` |
