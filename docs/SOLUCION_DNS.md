# 🔧 Solución: Configurar DNS para Firebase Hosting

## Problema
Tienes un registro **A** existente para `alumnos.certificacionmontessori.com` apuntando a `35.208.97.76` (IP de Siteground).

Firebase Hosting necesita un **CNAME** o un registro **A** con la IP específica de Firebase.

## ✅ Solución en Siteground

### Paso 1: Eliminar el registro A actual

1. Ve a Siteground → **DNS Zone Editor**
2. Busca el registro **A** para `alumnos.certificacionmontessori.com`
3. **ELIMÍNALO** (o déjalo si Firebase te da una IP específica)

### Paso 2: Agregar el CNAME

1. En el mismo DNS Zone Editor, haz clic en **"Agregar registro"**
2. Configura:
   - **Tipo**: `CNAME`
   - **Nombre**: `alumnos` (o `alumnos.certificacionmontessori.com`)
   - **Valor**: `alumnos-certificacionmontessori.web.app`
   - **TTL**: 3600 (o por defecto)

3. **Guarda** el registro

### Alternativa: Si Firebase pide registro A

Si Firebase te da una IP específica (como `199.36.158.100`), entonces:

1. **MODIFICA** el registro A existente:
   - Tipo: `A`
   - Nombre: `alumnos`
   - Valor: `[IP que Firebase te dé]` (ej: `199.36.158.100`)
   - TTL: 3600

2. **NO** crees un CNAME, solo modifica el A existente

## 🔍 Verificar después de cambiar

```bash
# Verificar CNAME
dig alumnos.certificacionmontessori.com CNAME +short
# Debe mostrar: alumnos-certificacionmontessori.web.app

# O verificar A
dig alumnos.certificacionmontessori.com +short
# Debe mostrar la IP de Firebase
```

## ⏱️ Tiempo de propagación

- Normalmente: 15 minutos a 2 horas
- Máximo: 48 horas

## 🎯 Paso siguiente: Configurar en Firebase

Una vez que cambies el DNS:

1. Ve a: https://console.firebase.google.com/project/certificacionmontessori/hosting
2. En el sitio "alumnos-certificacionmontessori", agrega el dominio personalizado
3. Firebase detectará el cambio de DNS y lo verificará automáticamente

