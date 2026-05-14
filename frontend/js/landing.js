// landing.js - Carga datos publicos en la landing page

document.addEventListener('DOMContentLoaded', function () {
    cargarHorarios();
    cargarPlatos();
    configurarBotonReserva();
});

function configurarBotonReserva() {
    var boton = document.getElementById('botonReserva');
    if (!boton) return;

    boton.addEventListener('click', function (e) {
        e.preventDefault();
        fetchAPI('/ProyectoFinDeGrado/backend/auth/session_check.php')
            .then(function (respuesta) {
                if (respuesta.success) {
                    window.location.href = '/ProyectoFinDeGrado/frontend/pages/cliente/nueva_reserva.html';
                } else {
                    window.location.href = '/ProyectoFinDeGrado/frontend/pages/auth/login.html';
                }
            });
    });
}

function cargarHorarios() {
    fetch('/ProyectoFinDeGrado/backend/horarios/obtener_horarios.php')
        .then(function (res) { return res.json(); })
        .then(function (respuesta) {
            var contenedor = document.getElementById('lista-horarios');
            if (!contenedor || !respuesta.success) return;

            var activos = respuesta.horarios.filter(function (h) { return h.activo == 1; });

            if (activos.length === 0) {
                contenedor.innerHTML = '<p>No hay horarios disponibles en este momento.</p>';
                return;
            }

            var html = '';
            activos.forEach(function (h) {
                var inicio = h.hora_inicio.substring(0, 5);
                var fin    = h.hora_fin.substring(0, 5);
                html += '<div class="horario-slot">' + inicio + ' – ' + fin + '</div>';
            });
            contenedor.innerHTML = html;
        })
        .catch(function () {
            var contenedor = document.getElementById('lista-horarios');
            if (contenedor) contenedor.innerHTML = '<p>No se pudieron cargar los horarios.</p>';
        });
}

function cargarPlatos() {
    fetch('/ProyectoFinDeGrado/backend/carta/platos_publicos.php')
        .then(function (res) { return res.json(); })
        .then(function (respuesta) {
            var contenedor = document.getElementById('lista-platos');
            if (!contenedor || !respuesta.success) return;

            if (respuesta.data.length === 0) {
                contenedor.innerHTML = '<p>No hay platos destacados en este momento.</p>';
                return;
            }

            var html = '';
            respuesta.data.forEach(function (plato) {
                html += '<div class="plato-card">';
                if (plato.imagen) {
                    html += '<img src="' + plato.imagen + '" alt="' + plato.nombre + '">';
                } else {
                    html += '<div class="plato-card-sin-imagen"></div>';
                }
                html += '<div class="plato-card-info">';
                html += '<span class="plato-categoria">' + plato.nombre_categoria + '</span>';
                html += '<h3>' + plato.nombre + '</h3>';
                html += '<p>' + plato.descripcion + '</p>';
                html += '<span class="plato-precio">' + parseFloat(plato.precio).toFixed(2) + ' €</span>';
                html += '</div>';
                html += '</div>';
            });
            contenedor.innerHTML = html;
        })
        .catch(function () {
            var contenedor = document.getElementById('lista-platos');
            if (contenedor) contenedor.innerHTML = '<p>No se pudieron cargar los platos.</p>';
        });
}
