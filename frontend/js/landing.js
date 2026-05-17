// landing.js - Carga datos publicos en la landing page

document.addEventListener('DOMContentLoaded', function () {
    cargarHorarios();
    cargarPlatos();
});

function cargarHorarios() {
    fetch(API_BASE + '/horarios/obtener_horarios.php')
        .then(function (res) { return res.json(); })
        .then(function (respuesta) {
            var contenedor = document.getElementById('lista-horarios');
            if (!contenedor || !respuesta.success) return;

            var activos = respuesta.horarios.filter(function (h) { return h.activo == 1; });

            if (activos.length === 0) {
                contenedor.innerHTML = '<p style="color:var(--ink-3);">No hay horarios disponibles en este momento.</p>';
                return;
            }

            // Separar mediodía y noche
            var mediodia = activos.filter(function(h) {
                return parseInt(h.hora_inicio) < 18;
            });
            var noche = activos.filter(function(h) {
                return parseInt(h.hora_inicio) >= 18;
            });

            function horaEnMinutos(hora) {
                var p = hora.split(':');
                var min = parseInt(p[0]) * 60 + parseInt(p[1]);
                return min === 0 ? 24 * 60 : min; // 00:00 equivale a 24:00
            }

            // Solo slots donde hora_inicio + 2h <= hora de cierre del turno
            function turnosReserva(lista) {
                if (lista.length === 0) return [];
                var cierreMin = horaEnMinutos(lista[lista.length - 1].hora_fin);
                return lista.filter(function(h) {
                    return horaEnMinutos(h.hora_inicio) + 120 <= cierreMin;
                });
            }

            function bloqueHtml(titulo, rango, lista) {
                var chips = lista.map(function(h) {
                    return '<span class="horario-chip">' + h.hora_inicio.substring(0,5) + '</span>';
                }).join('');
                return '<div style="flex:1;">' +
                    '<div class="mono" style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:12px;">' + titulo + '</div>' +
                    '<div class="display" style="font-size:28px;margin-bottom:14px;">' + rango + '</div>' +
                    '<div class="horario-chips">' + chips + '</div>' +
                    '</div>';
            }

            var html = '';
            if (mediodia.length > 0) {
                var rMed = mediodia[0].hora_inicio.substring(0,5) + ' — ' + mediodia[mediodia.length-1].hora_fin.substring(0,5);
                html += bloqueHtml('Mediodía', rMed, turnosReserva(mediodia));
            }
            if (noche.length > 0) {
                var rNoc = noche[0].hora_inicio.substring(0,5) + ' — ' + noche[noche.length-1].hora_fin.substring(0,5);
                html += bloqueHtml('Noche', rNoc, turnosReserva(noche));
            }
            contenedor.innerHTML = html;

            // Actualizar horario de hoy en hero
            var heroHorario = document.getElementById('hero-horario-hoy');
            if (heroHorario && activos.length > 0) {
                var primera = activos[0].hora_inicio.substring(0,5);
                var ultima  = activos[activos.length-1].hora_fin.substring(0,5);
                heroHorario.textContent = 'Abierto · ' + primera + ' — ' + ultima;
            }
        })
        .catch(function () {
            var contenedor = document.getElementById('lista-horarios');
            if (contenedor) contenedor.innerHTML = '<p style="color:var(--ink-3);">No se pudieron cargar los horarios.</p>';
        });
}

function cargarPlatos() {
    fetch(API_BASE + '/carta/platos_publicos.php')
        .then(function (res) { return res.json(); })
        .then(function (respuesta) {
            var contenedor = document.getElementById('lista-platos');
            if (!contenedor || !respuesta.success) return;

            if (respuesta.data.length === 0) {
                contenedor.innerHTML = '<p style="color:var(--ink-3);">No hay platos destacados en este momento.</p>';
                return;
            }

            var html = '';
            respuesta.data.forEach(function (plato) {
                html += '<article class="card plato-card">';
                if (plato.imagen) {
                    html += '<img src="' + plato.imagen + '" alt="' + plato.nombre + '">';
                } else {
                    html += '<div class="ph-img" style="height:220px;border-radius:0;border-bottom:1px solid var(--line);">sin imagen</div>';
                }
                html += '<div class="plato-card-info">';
                html += '<div class="plato-categoria">' + plato.nombre_categoria + '</div>';
                html += '<div class="display plato-nombre">' + plato.nombre + '</div>';
                html += '<p class="plato-descripcion">' + plato.descripcion + '</p>';
                html += '<div class="row between" style="align-items:center;">';
                html += '<span class="num plato-precio">' + parseFloat(plato.precio).toFixed(2) + ' €</span>';
                html += '<span style="font-size:11.5px;color:var(--ink-3);">Disponible hoy</span>';
                html += '</div>';
                html += '</div>';
                html += '</article>';
            });
            contenedor.innerHTML = html;
        })
        .catch(function () {
            var contenedor = document.getElementById('lista-platos');
            if (contenedor) contenedor.innerHTML = '<p style="color:var(--ink-3);">No se pudieron cargar los platos.</p>';
        });
}
