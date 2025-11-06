# 🌐 Configuración de Dominio Personalizado

## ✅ Estado Actual

**El dominio personalizado está configurado y activo:**

- **URL Principal**: `https://alumnos.certificacionmontessori.com` ✅
- **URL Alternativa**: `https://alumnos-certificacionmontessori.web.app`
- **Site ID**: `alumnos-certificacionmontessori`
- **Estado**: Verificado y funcionando ✅

## 📋 Información de Configuración

### DNS Configurado (Siteground)

El DNS está configurado con:
```
Tipo: CNAME
Nombre: alumnos
Valor: alumnos-certificacionmontessori.web.app
```

### Firebase Hosting

- **Proyecto**: `certificacionmontessori`
- **Sitio**: `alumnos-certificacionmontessori`
- **Dominio personalizado**: `alumnos.certificacionmontessori.com` ✅ Verificado
- **Certificado SSL**: Automático (gestioneado por Firebase)

## 🔍 Verificar Configuración

### Verificar en Firebase Console

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/hosting
2. Selecciona el sitio **"alumnos-certificacionmontessori"**
3. Verifica que el dominio `alumnos.certificacionmontessori.com` aparezca como **"Verificado"**

### Verificar DNS desde Terminal

```bash
# Verificar registro CNAME
dig alumnos.certificacionmontessori.com CNAME +short
# Debe mostrar: alumnos-certificacionmontessori.web.app

# Verificar resolución final
dig alumnos.certificacionmontessori.com +short
# Debe mostrar la IP de Firebase (no la IP de Siteground)

# Verificar desde diferentes servidores DNS
nslookup alumnos.certificacionmontessori.com 8.8.8.8
```

## 🔄 Si Necesitas Reconfigurar

Si por alguna razón necesitas reconfigurar el dominio:

1. Ve a Firebase Console → Hosting → alumnos-certificacionmontessori
2. Haz clic en el dominio personalizado
3. Firebase te dará las instrucciones de DNS actualizadas
4. Actualiza el registro DNS en Siteground según las instrucciones

## 🔍 Verificar DNS desde Terminal

```bash
# Verificar registro CNAME
dig alumnos.certificacionmontessori.com CNAME +short

# Verificar registro A
dig alumnos.certificacionmontessori.com +short

# Verificar desde diferentes servidores DNS
nslookup alumnos.certificacionmontessori.com 8.8.8.8
```

## ✅ Checklist

- [x] Configurado DNS en Siteground ✅
- [x] Agregado dominio en Firebase Console ✅
- [x] DNS propagado correctamente ✅
- [x] Dominio verificado en Firebase ✅
- [x] Certificado SSL generado ✅

