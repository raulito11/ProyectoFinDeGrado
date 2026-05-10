// auth.js - Login y verificacion de sesion

// Escucha el envio del formulario de login (solo en index.html)
document.addEventListener('DOMContentLoaded', function () {
    var formulario = document.getElementById('form-login');
    if (formulario) {
        formulario.addEventListener('submit', function (e) {
            e.preventDefault();
            iniciarSesion();
        });
    }
});

// Envia las credenciales al backend y redirige segun el rol
async function iniciarSesion() {
    var email    = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;
    var mensajeError = document.getElementById('mensaje-error');

    mensajeError.style.display = 'none';

    if (!email || !password) {
        mensajeError.textContent = 'Por favor, rellena todos los campos.';
        mensajeError.style.display = 'block';
        return;
    }

    var respuesta = await fetchAPI('/ProyectoFinDeGrado/backend/auth/login.php', 'POST', {
        email: email,
        password: password
    });

    if (respuesta.success) {
        // Redirige a la pagina del rol correspondiente
        if (respuesta.rol === 'cliente') {
            window.location.href = 'pages/cliente/dashboard.html';
        } else if (respuesta.rol === 'camarero') {
            window.location.href = 'pages/camarero/horario.html';
        } else if (respuesta.rol === 'jefe_sala') {
            window.location.href = 'pages/jefe_sala/horario.html';
        } else if (respuesta.rol === 'admin') {
            window.location.href = 'pages/admin/dashboard.html';
        }
    } else {
        mensajeError.textContent = respuesta.message;
        mensajeError.style.display = 'block';
    }
}

// Comprueba si hay sesion activa. Si no la hay, redirige al login.
async function checkSession() {
    var respuesta = await fetchAPI('/ProyectoFinDeGrado/backend/auth/session_check.php');

    if (!respuesta.success) {
        window.location.href = '/ProyectoFinDeGrado/frontend/index.html';
        return null;
    }

    return respuesta.data;
}

// Cierra la sesion y vuelve al login
async function cerrarSesion() {
    await fetchAPI('/ProyectoFinDeGrado/backend/auth/logout.php', 'POST');
    window.location.href = '/ProyectoFinDeGrado/frontend/index.html';
}
