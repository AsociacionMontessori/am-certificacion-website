#!/bin/bash
# Script de ayuda rápida para configurar el portal de alumnos

echo "🎓 Portal de Alumnos - Configuración Rápida"
echo "=========================================="
echo ""

# 1. Verificar credenciales
echo "📋 Paso 1: Verificar credenciales de Firebase"
if grep -q "Dummy\|REPLACE" .env 2>/dev/null; then
    echo "⚠️  Necesitas actualizar las credenciales en .env"
    echo "   Ve a: https://console.firebase.google.com/project/certificacionmontessori/settings/general"
    echo "   Copia apiKey y appId y actualiza .env"
    echo ""
else
    echo "✅ Credenciales configuradas"
    echo ""
fi

# 2. Verificar dominio
echo "📋 Paso 2: Verificar dominio en Firebase"
echo "   Ve a: https://console.firebase.google.com/project/certificacionmontessori/hosting"
echo "   Agrega el dominio: alumnos.certificacionmontessori.com"
echo ""

# 3. Verificar DNS
echo "📋 Paso 3: Verificar DNS"
DNS_RESULT=$(dig alumnos.certificacionmontessori.com +short 2>/dev/null)
if [ -z "$DNS_RESULT" ]; then
    echo "⚠️  DNS aún no resuelve. Espera a que se propague."
else
    echo "✅ DNS resuelve: $DNS_RESULT"
fi
echo ""

# 4. Deploy
echo "📋 Paso 4: Deploy"
echo "   Ejecuta: npm run deploy"
echo ""

