# Nota: integración Stripe

Las Cloud Functions de Stripe se despliegan desde **`../functions-stripe/`** (codebase `stripe` en `firebase.json`). Esa carpeta es la **única fuente de verdad**: edita ahí directamente.

Despliegue:

```
cd alumnos-app
npm run deploy:stripe   # = npx firebase deploy --only functions:stripe
```

El codebase `default` (`functions/`) solo contiene `enviarEmailNotificacion` y
`verificarMateriasProximas` (en `index.js`); se despliega con
`firebase deploy --only functions:default`.

> Histórico: antes existía `functions/stripe/` (copia) y un script
> `sync-stripe-functions.js` que copiaba `functions/stripe/ → functions-stripe/`.
> Ambos se eliminaron porque estaban desactualizados y el sync sobrescribía la
> fuente real, arriesgando regresar producción. **No reintroducir ese sync.**
> Si algún día se recuperan permisos sobre `index.js`, se pueden fusionar los
> exports de `functions-stripe/index.js` en un solo codebase.
