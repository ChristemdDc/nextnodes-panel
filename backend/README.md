# NextNodes Backend - Guía de Setup

## 📋 Requisitos Previios

- **Node.js 18+** ([descargar](https://nodejs.org/))
- **MySQL 5.7+** ([descargar](https://dev.mysql.com/downloads/mysql/))
- **Git** (para clonar)

Verifica que están instalados:
```bash
node --version
npm --version
mysql --version
```

---

## 🚀 Instalación Rápida

### Paso 1: Instalar Dependencias
```bash
cd backend
npm install
```

### Paso 2: Crear Base de Datos
```bash
# Abrir MySQL
mysql -u root -p

# Ejecutar el archivo SQL
source migrations/001_create_tables.sql;

# Verificar
USE nextnodes_auth;
SHOW TABLES;
```

### Paso 3: Configurar .env
```bash
# Copiar .env.example a .env (ya hecho)
nano .env

# Cambiar estos valores:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=nextnodes_auth
```

### Paso 4: Iniciar Backend
```bash
npm run dev
```

Deberías ver:
```
╔════════════════════════════════════════╗
║     🚀 NextNodes Backend Running      ║
╠════════════════════════════════════════╣
║  Port:    8081
║  Env:     development
║  API URL: http://localhost:8081/api/v1
╚════════════════════════════════════════╝
```

---

## 🧪 Testing Endpoints

### Health Check
```bash
curl http://localhost:8081/health
```

Response:
```json
{"status":"ok","timestamp":"2026-03-16T10:00:00.000Z","environment":"development"}
```

### Register (Signup)
```bash
curl -X POST http://localhost:8081/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "account_status": "pending_verification"
  },
  "message": "Usuario creado. Código enviado por email."
}
```

**Nota**: El código se muestra en la consola del backend en desarrollo.

### Verify Email
Primero, copia el código que se mostró en la consola (ej: `123456`)

```bash
curl -X POST http://localhost:8081/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "code": "123456"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Email verificado correctamente"
}
```

### Login
Ahora que el email está verificado, puedes hacer login:

```bash
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe"
  },
  "session": {
    "id": "uuid-aqui",
    "expires_at": "2026-03-17T10:00:00.000Z"
  }
}
```

La cookie `sessionId` se setea automáticamente.

### Me (Verificar Sesión)
```bash
# Copiar la sessionId de la respuesta anterior
curl -X GET http://localhost:8081/api/v1/auth/me \
  -H "Cookie: sessionId=uuid-aqui"
```

---

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js         # Conexión MySQL
│   ├── services/
│   │   ├── authService.js      # Lógica autenticación
│   │   └── passwordService.js  # Hash de contraseñas
│   ├── controllers/
│   │   └── authController.js   # Handlers de endpoints
│   ├── routes/
│   │   └── auth.js             # Rutas
│   └── app.js                  # Configuración Express
├── migrations/
│   └── 001_create_tables.sql   # Schema de BD
├── server.js                   # Punto de entrada
├── package.json               # Dependencias
├── .env                        # Variables de entorno
└── README.md                  # This file
```

---

## 🔄 Flujo Completo de Testing

1. **Signup**
   ```bash
   Endpoint: POST /auth/register
   Email: test123@example.com
   Password: TestPass123!
   ```

2. **Ver código en consola backend**
   ```
   ℹ️ Código para test123@example.com: XXXXXX
   ```

3. **Verificar email**
   ```bash
   Endpoint: POST /auth/verify-email
   Email: test123@example.com
   Code: XXXXXX
   ```

4. **Login**
   ```bash
   Endpoint: POST /auth/login
   Email: test123@example.com
   Password: TestPass123!
   ```

5. **Obtener sesión actual**
   ```bash
   Endpoint: GET /auth/me
   Cookie: sessionId (obtenida del login)
   ```

---

## 🐛 Troubleshooting

### "Cannot find module 'mysql2'"
```bash
npm install mysql2
```

### "Connection refused"
- ¿Está corriendo MySQL?
  ```bash
  mysql -u root -p  # Intenta conectar
  ```
- ¿Credenciales correctas en .env?
- ¿PUERTO correcto? (default 3306)

### "Table doesn't exist"
- Ejecutar migraciones:
  ```bash
  mysql -u root -p < migrations/001_create_tables.sql
  ```

### "CORS Error en frontend"
- Asegúrate que FRONTEND_URL en .env es correcto
- Default: `http://localhost:3000`

### "Port 8081 already in use"
- Cambiar PORT en .env
- O matar proceso:
  ```bash
  lsof -i :8081  # macOS/Linux
  netstat -ano | findstr :8081  # Windows
  ```

---

## 📚 Next Steps

1. ✅ Backend corriendo
2. ✅ Base de datos creada
3. 📝 **Frontend necesita:**
   - Cambiar `API_BASE_URL` a `http://localhost:8081/api/v1`
   - Cambiar `GOOGLE_CLIENT_ID` en config.js

4. **Integración:**
   - Abrir frontend en http://localhost:3000
   - Probar formulario de login
   - Debería conectar con backend

---

## 🔒 Seguridad en Producción

Antes de deployar:

- [ ] Cambiar todas las credenciales en .env
- [ ] Usar HTTPS en producción
- [ ] Implement CAPTCHA
- [ ] Implement email service real
- [ ] Implement rate limiting avanzado
- [ ] Setup logging y monitoring
- [ ] Security audit

Ver: `BACKEND_ARCHITECTURE.md` sección "Security"

---

## 📞 Support

Si tienes problemas:
1. Revisa la consola del backend (`npm run dev`)
2. Revisa la BD con `mysql`
3. Usa curl para testear endpoints
4. Revisa logs de auditoría en tabla `login_audits`

---

**¡Ready? 🚀 Ahora abre el frontend y prueba el login!**
