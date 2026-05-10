// empleados.js - Logica compartida para camarero y jefe de sala

// ─────────────────────────────────────────────
// HORARIO SEMANAL
// ─────────────────────────────────────────────

// Pide al backend el horario de la semana actual y devuelve la promesa
function cargarHorarioSemanal() {
    return fetchAPI('/ProyectoFinDeGrado/backend/empleados/obtener_horario_semanal.php')
        .then(function (respuesta) {
            if (!respuesta.success) {
                console.error('Error al cargar el horario:', respuesta.message);
                return null;
            }
            return respuesta.semana;
        })
        .catch(function (err) {
            console.error('Error de conexion al cargar el horario:', err);
            return null;
        });
}

// Renderiza la tabla del horario semanal con los 7 dias
function mostrarHorarioSemanal(semana) {
    var cuerpo   = document.getElementById('cuerpo-horario');
    var sinDatos = document.getElementById('sin-horario');

    if (!cuerpo) return;

    cuerpo.innerHTML = '';

    if (!semana || semana.length === 0) {
        if (sinDatos) sinDatos.style.display = 'block';
        return;
    }

    if (sinDatos) sinDatos.style.display = 'none';

    semana.forEach(function (dia) {
        var fila = document.createElement('tr');

        // Si el dia es cierre, pintamos la fila en naranja y ponemos CERRADO
        if (dia.es_cierre) {
            fila.style.backgroundColor = '#fff3e0';
            fila.innerHTML =
                '<td><strong>' + dia.dia_semana + '</strong></td>' +
                '<td>' + dia.fecha + '</td>' +
                '<td colspan="2" style="text-align: center; color: #b45309; font-weight: bold; letter-spacing: 1px;">CERRADO</td>';
        } else {
            var textoComida = calcularRangoTurno(dia.slots_comida);
            var textoCena   = calcularRangoTurno(dia.slots_cena);

            fila.innerHTML =
                '<td><strong>' + dia.dia_semana + '</strong></td>' +
                '<td>' + dia.fecha + '</td>' +
                '<td>' + textoComida + '</td>' +
                '<td>' + textoCena + '</td>';
        }

        cuerpo.appendChild(fila);
    });
}

// Calcula el rango de horas de un turno a partir de sus slots activos
// Ej: de "13:00" a "16:30" => "13:00 - 16:30"
// Si no hay slots activos => "Sin turno"
function calcularRangoTurno(slots) {
    if (!slots || slots.length === 0) return 'Sin turno';

    // Filtramos solo los slots activos
    var activos = slots.filter(function (s) { return s.activo == 1; });

    if (activos.length === 0) return 'Sin turno';

    // El primero da la hora de inicio, el ultimo da la hora fin
    var inicio = formatearHora(activos[0].hora_inicio);
    var ultimo  = activos[activos.length - 1].hora_inicio;

    // Sumamos 30 minutos al ultimo slot para obtener la hora de fin del turno
    var fin = sumarMinutos(ultimo, 30);

    return inicio + ' - ' + fin;
}

// Suma minutos a una hora en formato "HH:MM" o "HH:MM:SS" y devuelve "HH:MM"
function sumarMinutos(horaString, minutos) {
    var partes  = horaString.split(':');
    var horas   = parseInt(partes[0]);
    var mins    = parseInt(partes[1]) + minutos;

    if (mins >= 60) {
        horas += Math.floor(mins / 60);
        mins   = mins % 60;
    }

    var hStr = horas   < 10 ? '0' + horas : '' + horas;
    var mStr = mins    < 10 ? '0' + mins  : '' + mins;

    return hStr + ':' + mStr;
}

// ─────────────────────────────────────────────
// ASIGNACIONES (MESAS DEL DIA)
// ─────────────────────────────────────────────

// Pide al backend las reservas del dia con su mesa asignada
function cargarAsignaciones(fecha) {
    var url = '/ProyectoFinDeGrado/backend/empleados/listar_asignaciones.php';
    if (fecha) {
        url += '?fecha=' + encodeURIComponent(fecha);
    }

    return fetchAPI(url)
        .then(function (respuesta) {
            if (!respuesta.success) {
                console.error('Error al cargar las asignaciones:', respuesta.message);
                return null;
            }
            return respuesta.reservas;
        })
        .catch(function (err) {
            console.error('Error de conexion al cargar las asignaciones:', err);
            return null;
        });
}

// Renderiza la tabla de asignaciones del dia (version de solo lectura para camarero)
function mostrarAsignaciones(reservas) {
    var tabla    = document.getElementById('tabla-mesas');
    var cuerpo   = document.getElementById('cuerpo-mesas');
    var sinDatos = document.getElementById('sin-mesas');

    if (!cuerpo) return;

    cuerpo.innerHTML = '';

    if (!reservas || reservas.length === 0) {
        if (tabla)    tabla.style.display    = 'none';
        if (sinDatos) sinDatos.style.display = 'block';
        return;
    }

    if (sinDatos) sinDatos.style.display = 'none';

    reservas.forEach(function (r) {
        var claseEstado  = 'estado-' + r.estado;
        var horaInicio   = formatearHora(r.hora_inicio);
        var horaFin      = formatearHora(r.hora_fin);
        var textoMesa    = r.numero_mesa !== null ? r.numero_mesa : 'Sin asignar';

        var fila = document.createElement('tr');
        fila.innerHTML =
            '<td>' + r.nombre + ' ' + r.apellidos + '</td>' +
            '<td>' + horaInicio + ' - ' + horaFin + '</td>' +
            '<td>' + r.num_personas + '</td>' +
            '<td><span class="' + claseEstado + '">' + r.estado + '</span></td>' +
            '<td>' + textoMesa + '</td>';

        cuerpo.appendChild(fila);
    });

    if (tabla) tabla.style.display = 'table';
}

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────

// Convierte "13:00:00" a "13:00" (quita los segundos si los tiene)
function formatearHora(horaString) {
    if (!horaString) return '';
    return horaString.substring(0, 5);
}

// Obtiene la fecha de hoy en formato YYYY-MM-DD
function obtenerFechaHoy() {
    var hoy = new Date();
    var anio = hoy.getFullYear();
    var mes  = String(hoy.getMonth() + 1).padStart(2, '0');
    var dia  = String(hoy.getDate()).padStart(2, '0');
    return anio + '-' + mes + '-' + dia;
}

// Muestra un mensaje de error o exito y lo oculta a los 3 segundos
function mostrarMensaje(idDiv, texto) {
    var div = document.getElementById(idDiv);
    if (!div) return;

    div.textContent   = texto;
    div.style.display = 'block';

    setTimeout(function () {
        div.style.display = 'none';
    }, 3000);
}

// Llama al backend para cerrar la sesion y redirige al login
function cerrarSesion() {
    fetchAPI('/ProyectoFinDeGrado/backend/auth/logout.php', 'POST')
        .then(function () {
            window.location.href = '/ProyectoFinDeGrado/frontend/index.html';
        })
        .catch(function () {
            window.location.href = '/ProyectoFinDeGrado/frontend/index.html';
        });
}
