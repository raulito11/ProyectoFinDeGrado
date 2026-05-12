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
        // No hay reservas: mostrar mensaje y ocultar tabla
        document.getElementById('sin-reservas').style.display = 'block';
        document.getElementById('tabla-reservas').style.display = 'none';
        return;
    }

    // Hay reservas: mostrar tabla y ocultarel mensaje
    document.getElementById('sin-reservas').style.display = 'none';
    document.getElementById('tabla-reservas').style.display = 'table';

    var cuerpo = document.getElementById('cuerpo-tabla');
    cuerpo.innerHTML = '';

    reservas.forEach(function (reserva) {
        var fila = document.createElement('tr');

        // Determinar la clase CSS segun el estado de la reserva
        var claseEstado = 'estado-' + reserva.estado;

        // El boton de cancelar se deshabilita si la reserva ya esta cancelada
        var btnDeshabilitado = (reserva.estado === 'cancelada') ? 'disabled' : '';

        fila.innerHTML =
            '<td>' + formatearFecha(reserva.fecha) + '</td>' +
            '<td>' + formatearHora(reserva.hora_inicio) + '</td>' +
            '<td>' + formatearHora(reserva.hora_fin) + '</td>' +
            '<td>' + reserva.num_personas + '</td>' +
            '<td><span class="' + claseEstado + '">' + reserva.estado + '</span></td>' +
            '<td>' +
                '<button class="btn btn-rojo" ' + btnDeshabilitado + ' onclick="cancelarReserva(' + reserva.id_reserva + ')">' +
                    'Cancelar' +
                '</button>' +
            '</td>';

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
        var btnConfirmar = document.querySelector('#paso-2 .btn-verde');
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
