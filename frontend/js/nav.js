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

function brandHTML(base) {
    return '<a href="' + base + 'index.html" class="brand">' +
        '<div class="brand-mark">O</div>' +
        '<span>El Olivo</span>' +
        '</a>';
}

function initiales(nombre) {
    var partes = (nombre || '?').trim().split(' ');
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return partes[0][0].toUpperCase();
}

function navSinSesion(base) {
    return brandHTML(base) +
        '<ul>' +
        '<li><a href="' + base + 'index.html">Inicio</a></li>' +
        '<li><a href="' + base + 'pages/carta.html">Carta</a></li>' +
        '<li><a href="' + base + 'pages/auth/login.html">Reservar</a></li>' +
        '<li><a href="' + base + 'pages/auth/login.html">Iniciar sesión</a></li>' +
        '<li><a href="' + base + 'pages/auth/registro.html"><button class="btn btn-olive btn-sm">Registrarse</button></a></li>' +
        '</ul>';
}

function navConSesion(base, rol, nombre) {
    var links = '<li><a href="' + base + 'index.html">Inicio</a></li>';

    if (rol === 'cliente') {
        links += '<li><a href="' + base + 'pages/carta.html">Carta</a></li>';
        links += '<li><a href="' + base + 'pages/cliente/nueva_reserva.html">Reservar</a></li>';
        links += '<li><a href="' + base + 'pages/cliente/mis_reservas.html">Mis reservas</a></li>';
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
        links += '<li><a href="' + base + 'pages/admin/dashboard.html">Estadísticas</a></li>';
        links += '<li><a href="' + base + 'pages/admin/cierres.html">Cierres</a></li>';
        links += '<li><a href="' + base + 'pages/admin/carta.html">Carta</a></li>';
        links += '<li><a href="' + base + 'pages/admin/clientes.html">Clientes</a></li>';
    }

    links +=
        '<li class="nav-usuario">' +
            '<div class="user-pill">' +
                nombre +
                '<div class="avatar">' + initiales(nombre) + '</div>' +
            '</div>' +
            '<div class="nav-dropdown">' +
                '<div class="nav-dropdown-inner">' +
                    '<a href="' + base + 'pages/cliente/perfil.html">Mi perfil</a>' +
                    '<a href="#" onclick="cerrarSesion(); return false;">Cerrar sesión</a>' +
                '</div>' +
            '</div>' +
        '</li>';

    return brandHTML(base) + '<ul>' + links + '</ul>';
}
