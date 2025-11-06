# 🌐 Configurar Dominio Personalizado en Firebase

## Pasos para Configurar el Dominio

### 1. Ir a Firebase Hosting Console

Ve a: https://console.firebase.google.com/project/certificacionmontessori/hosting

### 2. Agregar Dominio Personalizado

1. En la lista de sitios, encuentra **"alumnos-certificacionmontessori"**
2. Haz clic en los **3 puntos** (⋮) → **"Agregar dominio personalizado"**
3. Ingresa: `alumnos.certificacionmontessori.com`
4. Haz clic en **"Continuar"**

### 3. Firebase te dará instrucciones de DNS

Firebase te mostrará algo como:

**Opción A - Registro CNAME (recomendado):**
```
Tipo: CNAME
Nombre: alumnos
Valor: alumnos-certificacionmontessori.web.app
```

**O Opción B - Registro A:**
```
Tipo: A
Nombre: alumnos
Valor: [IP que Firebase te proporcione]
```

### 4. Verificar en Siteground

Si ya configuraste el DNS en Siteground, verifica que coincida con lo que Firebase te pide.

**Si Firebase pide CNAME:**
- Ve a Siteground → DNS Zone Editor
- Verifica que tengas:
  ```
  Tipo: CNAME
  Nombre: alumnos
  Valor: alumnos-certificacionmontessori.web.app
  ```

**Si Firebase pide registro A:**
- Actualiza el registro A existente con la IP que Firebase te proporcione

### 5. Esperar Verificación

Firebase verificará automáticamente el dominio. Esto puede tardar:
- 15 minutos a 2 horas normalmente
- Hasta 48 horas en casos excepcionales

### 6. Verificar Estado

Puedes verificar el estado del dominio en:
- Firebase Console → Hosting → alumnos-certificacionmontessori
- Debe mostrar "Verificado" cuando esté listo

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

- [ ] Configurado DNS en Siteground
- [ ] Agregado dominio en Firebase Console
- [ ] DNS propagado correctamente
- [ ] Dominio verificado en Firebase
- [ ] Certificado SSL generado (automático, puede tardar hasta 24h)

