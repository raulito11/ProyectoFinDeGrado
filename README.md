# 🍽️ Los Olivos — Sistema de Reservas de Restaurante

> Proyecto de Fin de Grado · Ciclo Superior de Desarrollo de Aplicaciones Web (DAW) · 2º Curso

Aplicación web para la gestión de reservas de un restaurante, desarrollada sin frameworks como proyecto final de grado.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Backend | PHP 8.2 (sin frameworks) |
| Base de datos | MySQL |
| Entorno local | XAMPP (Apache + MySQL) |

---

## Funcionalidades

### Roles de usuario

| Rol | Permisos |
|-----|---------|
| **Cliente** | Crear, ver y cancelar sus propias reservas |
| **Camarero** | Consultar horario semanal y mesas asignadas |
| **Jefe de sala** | Ver horario, consultar mesas y asignarlas |
| **Admin** | Gestión completa de usuarios, reservas y carta |

### Módulos principales

- **Sistema de reservas** con control de aforo por franjas horarias de 30 minutos
- **Carta del restaurante** con categorías y platos gestionables desde el panel admin
- **Gestión de horarios** semanales del personal
- **Cierres** del restaurante por días festivos o vacaciones
- **Dashboard admin** con estadísticas y KPIs
- **Autenticación** con control de sesión y roles

---

## Lógica de reservas

- Las reservas se hacen en intervalos de **30 minutos**
- Cada reserva ocupa **2 horas** (genera 4 bloques en `bloques_reserva`)
- La capacidad asignada se calcula como: `CEIL(num_personas / 2) * 2`
- No se permiten reservas en fechas marcadas como cierre
- El sistema controla el aforo total por fecha y franja horaria

---

## Estructura del proyecto

```
ProyectoFinDeGrado/
├── backend/
│   ├── auth/           # Login, logout, registro, sesión
│   ├── carta/          # CRUD de categorías y platos
│   ├── cierres/        # Gestión de días cerrados
│   ├── clientes/       # Listado de clientes
│   ├── config/         # Conexión a base de datos
│   ├── dashboard/      # Estadísticas y KPIs
│   ├── empleados/      # Horarios y asignación de mesas
│   ├── horarios/       # Configuración de horarios
│   ├── reservas/       # CRUD de reservas y disponibilidad
│   └── usuarios/       # Gestión de usuarios
├── database/
│   ├── schema.sql          # Esquema de la base de datos
│   ├── datos_iniciales.sql # Datos de prueba
│   └── *.sql               # Alteraciones y ampliaciones
└── frontend/
    ├── index.html
    ├── css/style.css
    ├── js/                 # Scripts por módulo
    └── pages/
        ├── admin/          # Panel de administración
        ├── auth/           # Login y registro
        ├── camarero/       # Vistas del camarero
        ├── cliente/        # Vistas del cliente
        └── jefe_sala/      # Vistas del jefe de sala
```

---

## Instalación local

### Requisitos previos

- [XAMPP](https://www.apachefriends.org/) con Apache y MySQL activos
- PHP 8.2 o superior

### Pasos

1. Clona el repositorio dentro de la carpeta `htdocs` de XAMPP:

   ```bash
   git clone https://github.com/tu-usuario/ProyectoFinDeGrado.git
   ```

2. Abre **phpMyAdmin** (`http://localhost/phpmyadmin`) y crea una base de datos llamada `restaurante`.

3. Importa los archivos SQL en este orden:

   ```
   database/schema.sql
   database/datos_iniciales.sql
   ```

4. Comprueba la configuración de la conexión en `backend/config/db.php` y ajusta si es necesario:

   ```php
   $host = 'localhost';
   $db   = 'restaurante';
   $user = 'root';
   $pass = '';
   ```

5. Accede a la aplicación en el navegador:

   ```
   http://localhost/ProyectoFinDeGrado/frontend/
   ```

---

## Usuarios de prueba

Una vez importado `datos_iniciales.sql`, puedes entrar con los siguientes usuarios:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin@elolivo.com` | `password` | Admin |
| `jefe@elolivo.com` | `password` | Jefe de sala |
| `camarero@elolivo.com` | `password` | Camarero |
| `cliente@elolivo.com` | `password` | Cliente |

> ⚠️ Comprueba los datos exactos en `database/datos_iniciales.sql`, ya que pueden variar.

---

## Base de datos — Tablas principales

| Tabla | Descripción |
|-------|------------|
| `usuarios` | Usuarios registrados con su rol |
| `roles` | Roles disponibles del sistema |
| `reservas` | Reservas realizadas por clientes |
| `bloques_reserva` | Bloques de 30 min ocupados por cada reserva |
| `aforo` | Capacidad máxima por franja horaria |
| `horarios` | Horarios de apertura del restaurante |
| `cierres` | Días en los que el restaurante está cerrado |
| `categorias` | Categorías de la carta |
| `platos` | Platos del menú con precio e imagen |

---

## Autor

**Raúl García** · Proyecto de Fin de Grado · DAW 2º · Madrid · 2026
