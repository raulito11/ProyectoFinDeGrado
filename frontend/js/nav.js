// nav.js - Navbar dinamico segun el rol del usuario

document.addEventListener('DOMContentLoaded', function () {
    construirNavbar();
});

function construirNavbar() {
    var nav = document.getElementById('navbar'); 
    if (!nav) return;

    var base = '/ProyectoFinDeGrado/frontend/';

    fetch('/ProyectoFinDeGrado/backend/auth/session_check.php')
        .then(function (res) { return res.json(); })
        .then(function (respuesta) {
            if (!respuesta.success) {
                nav.innerHTML = navSinSesion(base);
            } else {
                nav.innerHTML = navConSesion(base, respuesta.data.rol, respuesta.data.nombre);
            }
        })
        .catch(function () {
            nav.innerHTML = navSinSesion(base);
        });
}

function navSinSesion(base) {
    return '<a href="' + base + 'index.html"><img src="' + base + 'favicon.png" alt="El Olivo" style="height: 48px; vertical-align: middle;"></a>' +
        '<ul>' +
        '<li><a href="' + base + 'index.html">Inicio</a></li>' +
        '<li><a href="' + base + 'pages/carta.html">Carta</a></li>' +
        '<li><a href="' + base + 'pages/auth/login.html">Reservar</a></li>' +
        '<li><a href="' + base + 'pages/auth/login.html">Iniciar sesion</a></li>' +
        '<li><a href="' + base + 'pages/auth/registro.html">Registrarse</a></li>' +
        '</ul>';
}

function navConSesion(base, rol, nombre) {
    var links = '<li><a href="' + base + 'index.html">Inicio</a></li>';

    if (rol === 'cliente') {
        links += '<li><a href="' + base + 'pages/carta.html">Carta</a></li>';
        links += '<li><a href="' + base + 'pages/cliente/nueva_reserva.html">Reservar</a></li>';
        links += '<li><a href="' + base + 'pages/cliente/mis_reservas.html">Mis Reservas</a></li>';
    } else if (rol === 'camarero') {
        links += '<li><a href="' + base + 'pages/camarero/horario.html">Horario</a></li>';
        links += '<li><a href="' + base + 'pages/camarero/mesas.html">Mesas</a></li>';
    } else if (rol === 'jefe_sala') {
        links += '<li><a href="' + base + 'pages/jefe_sala/horario.html">Horario</a></li>';
        links += '<li><a href="' + base + 'pages/jefe_sala/mesas.html">Mesas</a></li>';
    } else if (rol === 'admin') {
        links += '<li><a href="' + base + 'pages/admin/usuarios.html">Usuarios</a></li>';
        links += '<li><a href="' + base + 'pages/admin/reservas.html">Reservas</a></li>';
        links += '<li><a href="' + base + 'pages/admin/horarios.html">Horarios</a></li>';
        links += '<li><a href="' + base + 'pages/admin/dashboard.html">Estadisticas</a></li>';
        links += '<li><a href="' + base + 'pages/admin/cierres.html">Cierres</a></li>';
        links += '<li><a href="' + base + 'pages/admin/carta.html">Carta</a></li>';
    }

    links += '<li class="nav-usuario">' +
        '<span class="nav-nombre">' + nombre + ' &#9662;</span>' +
        '<div class="nav-dropdown">' +
        '<a href="' + base + 'pages/cliente/perfil.html">Mi perfil</a>' +
        '<a href="#" onclick="cerrarSesion(); return false;">Cerrar sesion</a>' +
        '</div>' +
        '</li>';

    return '<a href="' + base + 'index.html"><img src="' + base + 'favicon.png" alt="El Olivo" style="height: 48px; vertical-align: middle;"></a><ul>' + links + '</ul>';
}
