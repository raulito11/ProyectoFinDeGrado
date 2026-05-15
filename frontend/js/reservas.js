// reservas.js - Logica del panel cliente: ver reservas y crear nuevas

// ─────────────────────────────────────────────
// DASHBOARD: funciones para ver y cancelar reservas
// ─────────────────────────────────────────────

// Carga las reservas del usuario desde el backend y las muestra en la tabla
async function cargarReservas() {
    var respuesta = await fetchAPI('/ProyectoFinDeGrado/backend/reservas/obtener_reservas.php');

    if (!respuesta.success) {
        console.error('Error al cargar reservas:', respuesta.message);
        return;
    }

    var reservas = respuesta.reservas;

    if (reservas.length === 0) {
        document.getElementById('sin-reservas').style.display = 'block';
        document.getElementById('tabla-reservas').style.display = 'none';
        return;
    }

    document.getElementById('sin-reservas').style.display = 'none';
    document.getElementById('tabla-reservas').style.display = 'table';

    // Mini-KPIs (solo si el contenedor existe)
    var kpisDiv = document.getElementById('kpis-reservas');
    if (kpisDiv) {
        var confirmadas = reservas.filter(function(r){ return r.estado === 'confirmada'; }).length;
        var pendientes  = reservas.filter(function(r){ return r.estado === 'pendiente';  }).length;
        var proximas    = reservas.filter(function(r){ return r.estado !== 'cancelada' && r.fecha >= new Date().toISOString().split('T')[0]; }).length;
        kpisDiv.innerHTML =
            '<div class="kpi-card card"><div class="eyebrow">Próximas</div><div class="kpi-value" style="color:var(--olivo);">' + proximas + '</div></div>' +
            '<div class="kpi-card card"><div class="eyebrow">Confirmadas</div><div class="kpi-value" style="color:var(--ok);">' + confirmadas + '</div></div>' +
            '<div class="kpi-card card"><div class="eyebrow">Pendientes</div><div class="kpi-value" style="color:oklch(0.45 0.10 70);">' + pendientes + '</div></div>' +
            '<div class="kpi-card card"><div class="eyebrow">Total</div><div class="kpi-value">' + reservas.length + '</div></div>';
    }

    var mapaEstado = { confirmada: 'badge-ok', pendiente: 'badge-warn', cancelada: 'badge-err' };
    var cuerpo = document.getElementById('cuerpo-tabla');
    cuerpo.innerHTML = '';

    reservas.forEach(function (reserva) {
        var fila = document.createElement('tr');
        var clsBadge = mapaEstado[reserva.estado] || 'badge-mute';
        var badge = '<span class="badge ' + clsBadge + '"><span class="dot"></span>' + reserva.estado + '</span>';

        var accion = reserva.estado !== 'cancelada'
            ? '<div class="row gap-2" style="justify-content:flex-end;">' +
              '<button class="btn btn-ghost btn-sm">Detalles</button>' +
              '<button class="btn btn-danger btn-sm" onclick="cancelarReserva(' + reserva.id_reserva + ')">Cancelar</button>' +
              '</div>'
            : '<span class="cell-mute" style="font-size:12px;">—</span>';

        fila.innerHTML =
            '<td>' +
                '<div style="font-weight:600;">#' + reserva.id_reserva + '</div>' +
            '</td>' +
            '<td>' +
                '<div style="font-weight:500;">' + formatearFecha(reserva.fecha) + '</div>' +
            '</td>' +
            '<td class="num">' + formatearHora(reserva.hora_inicio) + ' — ' + formatearHora(reserva.hora_fin) + '</td>' +
            '<td class="num">' + reserva.num_personas + '</td>' +
            '<td>' + badge + '</td>' +
            '<td style="text-align:right;">' + accion + '</td>';

        cuerpo.appendChild(fila);
    });
}

// Pide confirmacion y cancela una reserva por su id
async function cancelarReserva(idReserva) {
    var confirmar = confirm('¿Seguro que quieres cancelar esta reserva?');
    if (!confirmar) return;

    var respuesta = await fetchAPI('/ProyectoFinDeGrado/backend/reservas/cancelar_reserva.php', 'POST', {
        id_reserva: idReserva
    });

    if (respuesta.success) {
        // Recargar la tabla sin recargar la pagina
        cargarReservas();
    } else {
        alert('No se pudo cancelar la reserva: ' + respuesta.message);
    }
}

// Convierte "2026-05-15" a "15/05/2026"
function formatearFecha(fechaISO) {
    var partes = fechaISO.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
}

// Convierte "13:00:00" a "13:00" (quita los segundos)
function formatearHora(horaCompleta) {
    return horaCompleta.substring(0, 5);
}


// ─────────────────────────────────────────────
// NUEVA RESERVA: variables compartidas entre los dos pasos
// ─────────────────────────────────────────────

// Guardamos aqui los datos del paso 1 para usarlos en el paso 2
var datosReserva = {
    fecha: '',
    hora_inicio: '',
    num_personas: 0
};


// ─────────────────────────────────────────────
// NUEVA RESERVA: funciones del flujo en dos pasos
// ─────────────────────────────────────────────

// Paso 1: Valida los campos, llama al backend para comprobar disponibilidad
// Si hay plaza, muestra el resumen del paso 2
async function comprobarDisponibilidad() {
    var fecha       = document.getElementById('fecha').value;
    var hora        = document.getElementById('hora').value;
    var numPersonas = parseInt(document.getElementById('num-personas').value, 10);

    var mensajeError = document.getElementById('mensaje-paso1-error');
    var mensajeExito = document.getElementById('mensaje-paso1-exito');

    // Ocultar mensajes anteriores
    mensajeError.style.display = 'none';
    mensajeExito.style.display = 'none';

    // Validar que todos los campos esten rellenos
    if (!fecha) {
        mensajeError.textContent = 'Por favor, selecciona una fecha.';
        mensajeError.style.display = 'block';
        return;
    }
    if (!hora) {
        mensajeError.textContent = 'Por favor, selecciona una hora.';
        mensajeError.style.display = 'block';
        return;
    }
    if (!numPersonas || numPersonas < 1 || numPersonas > 20) {
        mensajeError.textContent = 'El numero de personas debe estar entre 1 y 20.';
        mensajeError.style.display = 'block';
        return;
    }

    // Llamar al backend para verificar disponibilidad
    var respuesta = await fetchAPI('/ProyectoFinDeGrado/backend/reservas/verificar_disponibilidad.php', 'POST', {
        fecha: fecha,
        hora_inicio: hora,
        num_personas: numPersonas
    });

    if (respuesta.disponible) {
        // Guardar los datos para usarlos en el paso 2
        datosReserva.fecha       = fecha;
        datosReserva.hora_inicio = hora;
        datosReserva.num_personas = numPersonas;

        // Rellenar el resumen del paso 2
        document.getElementById('resumen-fecha').textContent    = formatearFecha(fecha);
        document.getElementById('resumen-hora').textContent     = formatearHora(hora);
        document.getElementById('resumen-personas').textContent = numPersonas;

        // Limpiar mensajes del paso 2 por si se habia intentado antes
        document.getElementById('mensaje-paso2-error').style.display = 'none';
        document.getElementById('mensaje-paso2-exito').style.display = 'none';

        // Mostrar el paso 2
        document.getElementById('paso-2').style.display = 'block';

        // Hacer scroll suave hasta el paso 2
        document.getElementById('paso-2').scrollIntoView({ behavior: 'smooth' });

    } else {
        // No hay disponibilidad: mostrar el mensaje del backend
        mensajeError.textContent = respuesta.message || 'No hay disponibilidad para esa fecha y hora.';
        mensajeError.style.display = 'block';
    }
}

// Paso 2: Confirma la reserva con los datos guardados en datosReserva
// Si tiene exito, redirige al dashboard tras 2 segundos
async function confirmarReserva() {
    var mensajeError = document.getElementById('mensaje-paso2-error');
    var mensajeExito = document.getElementById('mensaje-paso2-exito');

    // Ocultar mensajes anteriores
    mensajeError.style.display = 'none';
    mensajeExito.style.display = 'none';

    var respuesta = await fetchAPI('/ProyectoFinDeGrado/backend/reservas/crear_reserva.php', 'POST', {
        fecha: datosReserva.fecha,
        hora_inicio: datosReserva.hora_inicio,
        num_personas: datosReserva.num_personas
    });

    if (respuesta.success) {
        mensajeExito.textContent = 'Reserva confirmada correctamente. Redirigiendo...';
        mensajeExito.style.display = 'block';

        // Deshabilitar el boton para evitar doble envio
        var btnConfirmar = document.querySelector('#paso-2 .btn-primary');
        if (btnConfirmar) btnConfirmar.disabled = true;

        // Redirigir al dashboard tras 2 segundos
        setTimeout(function () {
            window.location.href = 'mis_reservas.html';
        }, 2000);

    } else {
        mensajeError.textContent = respuesta.message || 'No se pudo crear la reserva. Intentalo de nuevo.';
        mensajeError.style.display = 'block';
    }
}

// Volver al paso 1: oculta el paso 2 y limpia sus mensajes
function volverPaso1() {
    document.getElementById('paso-2').style.display = 'none';
    document.getElementById('mensaje-paso2-error').style.display = 'none';
    document.getElementById('mensaje-paso2-exito').style.display = 'none';
}


// ─────────────────────────────────────────────
// CALENDARIO: variables globales del mes visible
// ─────────────────────────────────────────────

var _calAnio   = new Date().getFullYear();
var _calMes    = new Date().getMonth() + 1; // 1-12
var _calCierres = []; // fechas cerradas del mes en formato "YYYY-MM-DD"

var _NOMBRES_MESES = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre'
];

// Inicializa el calendario: conecta botones y carga el mes actual
function inicializarCalendario() {
    document.getElementById('btn-mes-anterior').onclick = function () {
        _calMes--;
        if (_calMes < 1) { _calMes = 12; _calAnio--; }
        _cargarYRenderizarMes();
    };
    document.getElementById('btn-mes-siguiente').onclick = function () {
        _calMes++;
        if (_calMes > 12) { _calMes = 1; _calAnio++; }
        _cargarYRenderizarMes();
    };
    _cargarYRenderizarMes();
}

// Descarga las fechas cerradas del mes y luego renderiza el calendario
function _cargarYRenderizarMes() {
    var url = '/ProyectoFinDeGrado/backend/reservas/obtener_cierres_mes.php'
            + '?anio=' + _calAnio + '&mes=' + _calMes;

    fetchAPI(url, 'GET').then(function (resp) {
        _calCierres = (resp.success && Array.isArray(resp.cierres)) ? resp.cierres : [];
        _renderizarCalendario();
    }).catch(function () {
        _calCierres = [];
        _renderizarCalendario();
    });
}

// Pinta el grid del calendario para el mes y año actuales
function _renderizarCalendario() {
    var anio = _calAnio;
    var mes  = _calMes;

    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    document.getElementById('calendario-titulo').textContent =
        _NOMBRES_MESES[mes - 1] + ' ' + anio;

    var grid = document.getElementById('calendario-grid');
    grid.innerHTML = '';

    // Día de la semana del primer día (0=Dom … 6=Sáb) → ajustamos a lunes=0
    var primerDia = new Date(anio, mes - 1, 1).getDay();
    var offset = (primerDia === 0) ? 6 : primerDia - 1;

    // Celdas vacías para alinear con el día de inicio
    for (var i = 0; i < offset; i++) {
        var vacio = document.createElement('div');
        grid.appendChild(vacio);
    }

    var diasEnMes        = new Date(anio, mes, 0).getDate();
    var fechaSeleccionada = document.getElementById('fecha').value;

    for (var d = 1; d <= diasEnMes; d++) {
        var fechaStr = anio + '-'
                     + String(mes).padStart(2, '0') + '-'
                     + String(d).padStart(2, '0');

        var fechaDia    = new Date(anio, mes - 1, d);
        var esPasado    = fechaDia < hoy;
        var esCerrado   = _calCierres.indexOf(fechaStr) !== -1;
        var esSeleccionado = fechaStr === fechaSeleccionada;

        var celda = document.createElement('div');
        celda.className = 'cal-dia';
        celda.textContent = d;

        if (esSeleccionado && !esPasado && !esCerrado) {
            celda.classList.add('cal-dia-seleccionado');
        } else if (esCerrado) {
            celda.classList.add('cal-dia-cerrado');
            celda.title = 'Día cerrado';
        } else if (esPasado) {
            celda.classList.add('cal-dia-pasado');
        } else {
            // Día disponible: registrar clic
            (function (f) {
                celda.onclick = function () { _seleccionarFecha(f); };
            })(fechaStr);
        }

        grid.appendChild(celda);
    }
}

// Guarda la fecha elegida en el input oculto y actualiza el texto de confirmación
function _seleccionarFecha(fechaStr) {
    document.getElementById('fecha').value = fechaStr;

    var texto = document.getElementById('fecha-seleccionada-texto');
    if (texto) {
        texto.textContent = 'Fecha seleccionada: ' + formatearFecha(fechaStr);
    }

    // Repintar para mostrar el nuevo día destacado
    _renderizarCalendario();
}
