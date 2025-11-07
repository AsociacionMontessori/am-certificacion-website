#!/bin/bash

echo "📧 Configuración de Email para Cloud Functions"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Este script te ayudará a configurar las credenciales de email."
echo ""
echo "¿Qué servicio de email quieres usar?"
echo "1) Gmail (Recomendado para Google Workspace)"
echo "2) SendGrid"
echo ""
read -p "Selecciona una opción (1 o 2): " opcion

case $opcion in
  1)
    echo ""
    echo "${YELLOW}Configuración de Gmail${NC}"
    echo "-------------------"
    echo ""
    echo "Para usar Gmail, necesitas:"
    echo "1. Activar la verificación en dos pasos"
    echo "2. Generar una 'Contraseña de aplicación'"
    echo ""
    echo "Pasos:"
    echo "1. Ve a: https://myaccount.google.com/apppasswords"
    echo "2. Selecciona 'Correo' y 'Otro (nombre personalizado)'"
    echo "3. Escribe 'Firebase Functions' como nombre"
    echo "4. Copia la contraseña de 16 caracteres que se genera"
    echo ""
    read -p "Presiona Enter cuando hayas generado la contraseña..."
    echo ""
    read -p "Ingresa tu email de Gmail: " email
    read -p "Ingresa la contraseña de aplicación (16 caracteres): " password
    
    echo ""
    echo "${GREEN}Configurando credenciales...${NC}"
    firebase functions:config:set email.user="$email"
    firebase functions:config:set email.pass="$password"
    
    echo ""
    echo "${GREEN}✓ Credenciales configuradas${NC}"
    echo ""
    echo "Verificando configuración:"
    firebase functions:config:get
    ;;
    
  2)
    echo ""
    echo "${YELLOW}Configuración de SendGrid${NC}"
    echo "----------------------"
    echo ""
    echo "Para usar SendGrid:"
    echo "1. Crea una cuenta en: https://sendgrid.com/"
    echo "2. Genera una API Key en: https://app.sendgrid.com/settings/api_keys"
    echo "3. Copia la API Key (solo se muestra una vez)"
    echo ""
    read -p "Presiona Enter cuando hayas creado la API Key..."
    echo ""
    read -p "Ingresa tu API Key de SendGrid: " apikey
    
    echo ""
    echo "${GREEN}Configurando credenciales...${NC}"
    firebase functions:config:set email.user="apikey"
    firebase functions:config:set email.pass="$apikey"
    
    echo ""
    echo "${GREEN}✓ Credenciales configuradas${NC}"
    echo ""
    echo "Verificando configuración:"
    firebase functions:config:get
    echo ""
    echo "${YELLOW}⚠️ IMPORTANTE:${NC} Necesitas actualizar functions/index.js para usar SendGrid"
    echo "Cambia el transporter para usar 'smtp.sendgrid.net'"
    ;;
    
  *)
    echo "Opción no válida"
    exit 1
    ;;
esac

echo ""
echo "${GREEN}Próximos pasos:${NC}"
echo "1. Desplegar Functions: firebase deploy --only functions"
echo "2. Verificar logs: firebase functions:log"
echo ""

