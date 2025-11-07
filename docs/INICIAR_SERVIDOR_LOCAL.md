# 🚀 Iniciar Servidor Local

## Comando para Desarrollo

Para iniciar el servidor de desarrollo en local, usa:

```bash
cd alumnos-app
npm run dev
```

**Nota:** El comando es `npm run dev`, no `npm start`.

## Puerto por Defecto

El servidor se iniciará en:
- **URL:** http://localhost:5173
- **Puerto:** 5173 (puerto por defecto de Vite)

## Otros Comandos Útiles

### Desarrollo
```bash
npm run dev          # Inicia servidor de desarrollo
```

### Build
```bash
npm run build        # Compila para producción
npm run preview      # Previsualiza el build de producción
```

### Linting
```bash
npm run lint         # Ejecuta el linter
```

### Firebase
```bash
npm run deploy       # Compila y despliega a Firebase
npm run deploy:rules # Despliega solo reglas de Firestore y Storage
```

### Configuración de Pagos
```bash
npm run init:pagos              # Inicializa configuración de pagos
npm run verify:pagos            # Verifica configuración de pagos
npm run create:config-general   # Crea documento general de configuración
```

## Solución de Problemas

### Puerto ya en uso

Si el puerto 5173 está ocupado, Vite intentará usar el siguiente puerto disponible (5174, 5175, etc.).

### Error: "Cannot find module"

```bash
npm install
```

### Error: "Firebase not configured"

Verifica que el archivo `.env` exista y tenga las variables de entorno correctas:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Acceso a la Aplicación

Una vez iniciado el servidor, accede a:

- **Desarrollo:** http://localhost:5173
- **Producción:** https://alumnos-certificacionmontessori.web.app

## Hot Module Replacement (HMR)

El servidor de desarrollo tiene HMR habilitado, lo que significa que los cambios en el código se reflejarán automáticamente en el navegador sin necesidad de recargar la página.

