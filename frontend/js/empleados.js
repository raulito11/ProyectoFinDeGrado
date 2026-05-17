// empleados.js - Logica compartida para camarero y jefe de sala

// ─────────────────────────────────────────────
// MI HORARIO SEMANAL
// ─────────────────────────────────────────────

// Semana que está viendo el empleado (lunes en YYYY-MM-DD)
var miSemanaActual = '';

// Calcula el lunes de la semana de una fecha dada (o de hoy si no se pasa nada)
function calcularLunesEmpl(fecha) {
    var d = fecha ? new Date(fecha + 'T00:00:00') : new Date();
    var dia = d.getDay();
    var diff = dia === 0 ? -6 : 1 - dia;
    d.setDate(d.getDate() + diff);
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
}

// Suma N días a una fecha YYYY-MM-DD
function sumarDiasEmpl(fechaStr, dias) {
    var d = new Date(fechaStr + 'T00:00:00');
    d.setDate(d.getDate() + dias);
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
}

// Inicializa la sección de horario del empleado con la semana actual
function iniciarMiHorario() {
    miSemanaActual = calcularLunesEmpl();
    actualizarLabelSemanaEmpl();
    cargarMiHorarioSemana();
}

// Navega a la semana anterior o siguiente
function cambiarSemanaEmpl(direccion) {
    miSemanaActual = sumarDiasEmpl(miSemanaActual, direccion * 7);
    actualizarLabelSemanaEmpl();
    cargarMiHorarioSemana();
}

// Actualiza la etiqueta con el rango de la semana
function actualizarLabelSemanaEmpl() {
    var label = document.getElementById('label-semana');
    if (!label) return;
    var domingo = sumarDiasEmpl(miSemanaActual, 6);
    label.textContent = formatearRangoSemana(miSemanaActual, domingo);
}

// Pide al backend el horario de la semana indicada
function cargarMiHorarioSemana() {
    var url = '/ProyectoFinDeGrado/backend/empleados/obtener_mi_horario.php?semana_inicio=' + miSemanaActual;
    return fetchAPI(url)
        .then(function (respuesta) {
            if (!respuesta.success) {
                console.error('Error al cargar el horario:', respuesta.message);
                return null;
            }
            mostrarMiHorarioSemana(respuesta);
        })
        .catch(function (err) {
            console.error('Error de conexión al cargar el horario:', err);
        });
}

// Formatea el rango de la semana en español: "15 al 21 de mayo de 2026"
function formatearRangoSemana(fechaInicio, fechaFin) {
    var meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
                 'septiembre','octubre','noviembre','diciembre'];
    var pI = fechaInicio.split('-');
    var pF = fechaFin.split('-');
    if (pI[1] === pF[1] && pI[0] === pF[0]) {
        return 'Semana del ' + parseInt(pI[2]) + ' al ' + parseInt(pF[2]) +
               ' de ' + meses[parseInt(pF[1]) - 1] + ' de ' + pF[0];
    }
    return 'Semana del ' + parseInt(pI[2]) + ' de ' + meses[parseInt(pI[1]) - 1] +
           ' al ' + parseInt(pF[2]) + ' de ' + meses[parseInt(pF[1]) - 1] + ' de ' + pF[0];
}

// Renderiza la tabla de horario semanal (solo lectura) con verde/gris según estado
function mostrarMiHorarioSemana(datos) {
    var cuerpo   = document.getElementById('cuerpo-horario');
    var sinDatos = document.getElementById('sin-horario');
    var labelSem = document.getElementById('label-semana');

    if (!cuerpo) return;
    cuerpo.innerHTML = '';

    // Sin datos o no publicado aún
    if (!datos || !datos.publicado) {
        if (sinDatos) {
            sinDatos.textContent   = 'El horario de esta semana aún no está disponible.';
            sinDatos.style.display = 'block';
        }
        return;
    }

    if (sinDatos) sinDatos.style.display = 'none';

    var hoy = obtenerFechaHoy();

    datos.dias.forEach(function (dia) {
        var fila = document.createElement('tr');

        if (dia.fecha === hoy) fila.classList.add('fila-hoy');

        if (dia.estado === 'libre') {
            fila.classList.add('fila-descanso');
            fila.innerHTML =
                '<td><strong>' + dia.dia_semana + '</strong></td>' +
                '<td>' + dia.fecha + '</td>' +
                '<td class="celda-descanso">Libre</td>';
        } else {
            fila.innerHTML =
                '<td><strong>' + dia.dia_semana + '</strong></td>' +
                '<td>' + dia.fecha + '</td>' +
                '<td><span class="badge badge-ok"><span class="dot"></span>Trabajo</span></td>';
        }

        cuerpo.appendChild(fila);
    });
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
            window.location.href = '/index.html';
        })
        .catch(function () {
            window.location.href = '/index.html';
        });
}
