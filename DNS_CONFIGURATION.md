# 🔧 Configuración DNS para Firebase Hosting

## 📋 Instrucciones para Siteground

### ✅ PASOS A REALIZAR EN SITEGROUND

#### 1️⃣ ELIMINAR registros A antiguos (si existen)

Si tienes alguno de estos registros A para `certificacionmontessori.com`, **ELIMÍNALOS**:

- ❌ `certificacionmontessori.com` → `34.149.120.3`
- ❌ `certificacionmontessori.com` → `34.149.36.179`
- ❌ `certificacionmontessori.com` → `34.160.17.71`
- ❌ `certificacionmontessori.com` → `35.227.194.51`

**NOTA**: Si tienes un registro A que dice "Registro CDN", probablemente necesitas eliminarlo o reemplazarlo.

#### 2️⃣ AGREGAR registro A para el dominio raíz

**Tipo**: `A`  
**Nombre**: `certificacionmontessori.com` (o `@`)  
**Valor**: `199.36.158.100`  
**TTL**: 3600 (o el valor por defecto)

#### 3️⃣ AGREGAR registro TXT para verificación

**Tipo**: `TXT`  
**Nombre**: `certificacionmontessori.com` (o `@`)  
**Valor**: `hosting-site=certificacionmontessori`  
**TTL**: 3600 (o el valor por defecto)

**⚠️ IMPORTANTE**: Este registro TXT es temporal para verificación. Firebase lo puede eliminar después de verificar.

#### 4️⃣ CONFIGURAR www.certificacionmontessori.com (opcional pero recomendado)

Para que `www.certificacionmontessori.com` también funcione, agrega:

**Tipo**: `CNAME`  
**Nombre**: `www.certificacionmontessori.com` (o `www`)  
**Valor**: `certificacionmontessori.web.app`  
**TTL**: 3600 (o el valor por defecto)

**O alternativamente**, si Firebase te da una IP diferente para www, usa:

**Tipo**: `A`  
**Nombre**: `www.certificacionmontessori.com` (o `www`)  
**Valor**: `199.36.158.100`  
**TTL**: 3600

---

## 📝 Resumen de Cambios en Siteground

### ❌ ELIMINAR (si existen):
```
A   certificacionmontessori.com   34.149.120.3
A   certificacionmontessori.com   34.149.36.179
A   certificacionmontessori.com   34.160.17.71
A   certificacionmontessori.com   35.227.194.51
A   certificacionmontessori.com   [Registro CDN actual]
```

### ✅ AGREGAR:
```
A   certificacionmontessori.com   199.36.158.100
TXT certificacionmontessori.com   hosting-site=certificacionmontessori
```

### ✅ MODIFICAR (si existe):
```
A   www.certificacionmontessori.com   [Cambiar a]   199.36.158.100
```

O agregar:
```
CNAME www.certificacionmontessori.com   certificacionmontessori.web.app
```

---

## ⏱️ Tiempo de Propagación

Después de hacer los cambios:
- **Propagación DNS**: 15 minutos a 48 horas (normalmente 1-2 horas)
- **Verificación Firebase**: Automática cuando DNS se propague

---

## ✅ Verificación

Una vez configurado, puedes verificar:

1. **En Firebase Console**: https://console.firebase.google.com/project/certificacionmontessori/hosting
2. **Verificar DNS**: https://www.whatsmydns.net/#A/certificacionmontessori.com
3. **Verificar sitio**: https://certificacionmontessori.com (después de propagación)

---

## 🔍 Verificación de DNS desde Terminal

```bash
# Verificar registro A
dig certificacionmontessori.com +short

# Verificar registro TXT
dig certificacionmontessori.com TXT +short

# Verificar desde diferentes servidores DNS
nslookup certificacionmontessori.com 8.8.8.8
```

