# 🔧 Solución: Error 404 en Verificación de Dominio Firebase

## ❌ Problema Actual

Firebase está recibiendo este error:
```
Falló una o más de las solicitudes HTTP GET de Hosting del desafío de ACME: 
35.208.97.76: 404 Not Found
```

**Causa**: El dominio `alumnos.certificacionmontessori.com` todavía apunta a la IP de Siteground (`35.208.97.76`) en lugar de Firebase.

## ✅ Solución

### Paso 1: Verificar DNS Actual

El dominio actualmente resuelve a:
```bash
dig alumnos.certificacionmontessori.com +short
# Resultado: 35.208.97.76 (IP de Siteground - INCORRECTO)
```

### Paso 2: Configurar CNAME en Siteground

1. Ve a **Siteground → DNS Zone Editor**
2. **ELIMINA** cualquier registro A o CNAME existente para `alumnos`
3. **AGREGA** un nuevo registro CNAME:
   ```
   Tipo: CNAME
   Nombre: alumnos
   Valor: alumnos-certificacionmontessori.web.app
   TTL: 3600 (o por defecto)
   ```

### Paso 3: Esperar Propagación

El DNS puede tardar:
- **Rápido**: 15-30 minutos
- **Normal**: 1-2 horas
- **Máximo**: 24-48 horas

### Paso 4: Verificar Propagación

Ejecuta estos comandos para verificar:

```bash
# Verificar CNAME
dig alumnos.certificacionmontessori.com CNAME +short
# Debe mostrar: alumnos-certificacionmontessori.web.app

# Verificar resolución final
dig alumnos.certificacionmontessori.com +short
# Debe mostrar la IP de Firebase (no 35.208.97.76)
```

### Paso 5: Reintentar Verificación en Firebase

Una vez que el DNS se propague:

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/hosting
2. En el sitio "alumnos-certificacionmontessori", busca el dominio
3. Haz clic en "Reintentar verificación" o espera a que Firebase lo detecte automáticamente

## 🔍 Verificación Alternativa

Si después de 2 horas sigue sin funcionar, verifica:

1. **Que el CNAME esté correcto en Siteground**
   - No debe haber registros A para `alumnos`
   - El CNAME debe apuntar exactamente a: `alumnos-certificacionmontessori.web.app`

2. **Que no haya caché DNS local**
   - Prueba desde diferentes ubicaciones/servidores DNS
   - Usa: https://www.whatsmydns.net/#CNAME/alumnos.certificacionmontessori.com

3. **Que Firebase esté configurado correctamente**
   - El sitio debe existir: `alumnos-certificacionmontessori`
   - El dominio debe estar agregado en la configuración

## 📝 Nota Importante

Mientras se resuelve el DNS, el sitio funciona perfectamente en:
- ✅ **https://alumnos-certificacionmontessori.web.app**

El dominio personalizado se activará automáticamente una vez que Firebase verifique el DNS.

