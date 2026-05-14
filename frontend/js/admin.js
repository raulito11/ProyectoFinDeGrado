// admin.js - Logica del panel de administracion

// Usuario que tiene la sesion activa (se rellena en cada pagina al hacer checkSession)
var usuarioEnSesion = null;

// ─────────────────────────────────────────────
// DASHBOARD - ESTADÍSTICAS
// ─────────────────────────────────────────────

// Estado del dashboard (filtros, paginación, ordenación)
var dashFiltroDesde  = '';
var dashFiltroHasta  = '';
var dashFiltroEstado = '';
var dashPaginaActual = 1;
var dashTotalPaginas = 1;
var dashOrdenCampo   = 'fecha';
var dashOrdenDir     = 'DESC';

// Punto de entrada: establece fechas por defecto y carga los datos
function iniciarDashboard() {
    var hoy      = new Date();
    var anio     = hoy.getFullYear();
    var mes      = String(hoy.getMonth() + 1).padStart(2, '0');
    var ultimoDia = new Date(anio, hoy.getMonth() + 1, 0).getDate();

    dashFiltroDesde = anio + '-' + mes + '-01';
    dashFiltroHasta = anio + '-' + mes + '-' + String(ultimoDia).padStart(2, '0');

    document.getElementById('filtro-desde').value = dashFiltroDesde;
    document.getElementById('filtro-hasta').value = dashFiltroHasta;

    // Botones de estado: solo uno activo a la vez
    document.querySelectorAll('.btn-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.btn-toggle').forEach(function (b) {
                b.classList.remove('activo');
            });
            btn.classList.add('activo');
            dashFiltroEstado = btn.getAttribute('data-estado');
        });
    });

    cargarKPIsDashboard();
    cargarTablaReservasDashboard(1);
}

// Lee los filtros del formulario, valida y recarga todo
function aplicarFiltrosDashboard() {
    var desde = document.getElementById('filtro-desde').value;
    var hasta = document.getElementById('filtro-hasta').value;

    if (!desde || !hasta) {
        alert('Las dos fechas son obligatorias.');
        return;
    }
    if (desde > hasta) {
        alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
        return;
    }

    dashFiltroDesde  = desde;
    dashFiltroHasta  = hasta;
    dashPaginaActual = 1;

    cargarKPIsDashboard();
    cargarTablaReservasDashboard(1);
}

// Llama a kpis.php y actualiza todas las tarjetas KPI
function cargarKPIsDashboard() {
    document.getElementById('dash-cargando-kpis').style.display = 'block';

    var params = 'fecha_desde=' + encodeURIComponent(dashFiltroDesde) +
                 '&fecha_hasta=' + encodeURIComponent(dashFiltroHasta);
    if (dashFiltroEstado) {
        params += '&estado=' + encodeURIComponent(dashFiltroEstado);
    }

    fetchAPI('/ProyectoFinDeGrado/backend/dashboard/kpis.php?' + params)
        .then(function (res) {
            document.getElementById('dash-cargando-kpis').style.display = 'none';
            if (!res.success) {
                console.error('Error al cargar KPIs:', res.message);
                return;
            }
            rellenarKPIs(res.data);
        })
        .catch(function (err) {
            document.getElementById('dash-cargando-kpis').style.display = 'none';
            console.error('Error de conexión en KPIs:', err);
        });
}

// Escribe los valores recibidos en los elementos de las tarjetas
function rellenarKPIs(datos) {
    var r = datos.reservas;
    var c = datos.clientes;
    var o = datos.ocupacion;

    document.getElementById('kpi-total').textContent              = r.total;
    document.getElementById('kpi-confirmadas').textContent        = r.confirmadas;
    document.getElementById('kpi-pendientes').textContent         = r.pendientes;
    document.getElementById('kpi-canceladas').textContent         = r.canceladas;
    document.getElementById('kpi-tasa').textContent               = r.tasa_cancelacion + '%';

    document.getElementById('kpi-clientes-unicos').textContent    = c.unicos;
    document.getElementById('kpi-clientes-nuevos').textContent    = c.nuevos;
    document.getElementById('kpi-clientes-recurrentes').textContent = c.recurrentes;

    document.getElementById('kpi-reservas-hoy').textContent       = o.reservas_hoy_activas;
    document.getElementById('kpi-ratio-ocupacion').textContent    = o.ratio_ocupacion + '%';
    document.getElementById('kpi-ocupacion-detalle').textContent  = o.cap_ocupada_hoy + ' / ' + o.cap_total_hoy + ' personas';
}

// Llama a reservas_dashboard.php y renderiza la tabla paginada
function cargarTablaReservasDashboard(pagina) {
    document.getElementById('dash-cargando-tabla').style.display  = 'block';
    document.getElementById('tabla-dash').style.display           = 'none';
    document.getElementById('dash-sin-resultados').style.display  = 'none';
    document.getElementById('dash-sin-resultados').textContent    = 'No hay reservas para los filtros seleccionados.';
    document.getElementById('dash-paginacion').style.display      = 'none';

    dashPaginaActual = pagina;

    var params = 'fecha_desde=' + encodeURIComponent(dashFiltroDesde) +
                 '&fecha_hasta=' + encodeURIComponent(dashFiltroHasta) +
                 '&pagina='      + pagina +
                 '&orden_campo=' + dashOrdenCampo +
                 '&orden_dir='   + dashOrdenDir;
    if (dashFiltroEstado) {
        params += '&estado=' + encodeURIComponent(dashFiltroEstado);
    }

    fetchAPI('/ProyectoFinDeGrado/backend/dashboard/reservas_dashboard.php?' + params)
        .then(function (res) {
            document.getElementById('dash-cargando-tabla').style.display = 'none';
            if (!res.success) {
                document.getElementById('dash-sin-resultados').textContent = 'Error al cargar las reservas: ' + (res.message || 'error desconocido');
                document.getElementById('dash-sin-resultados').style.display = 'block';
                return;
            }
            renderizarTablaDashboard(res.data);
        })
        .catch(function (err) {
            document.getElementById('dash-cargando-tabla').style.display = 'none';
            document.getElementById('dash-sin-resultados').textContent = 'Error de conexión al cargar las reservas.';
            document.getElementById('dash-sin-resultados').style.display = 'block';
            console.error('Error de conexión en tabla:', err);
        });
}

// Dibuja filas, paginación e indicadores de orden en la tabla
function renderizarTablaDashboard(datos) {
    var cuerpo   = document.getElementById('cuerpo-dash-tabla');
    var tabla    = document.getElementById('tabla-dash');
    var sinDatos = document.getElementById('dash-sin-resultados');
    var pagDiv   = document.getElementById('dash-paginacion');
    var infoSpan = document.getElementById('dash-tabla-info');

    cuerpo.innerHTML = '';
    dashTotalPaginas = datos.total_paginas;

    if (!datos.reservas || datos.reservas.length === 0) {
        sinDatos.style.display = 'block';
        infoSpan.textContent   = '';
        return;
    }

    datos.reservas.forEach(function (r) {
        var badgeEstado = '<span class="badge badge-' + r.estado + '">' + r.estado + '</span>';
        var badgeTipo   = r.es_nuevo
            ? '<span class="badge badge-nuevo">Nuevo</span>'
            : '<span class="badge badge-recurrente">Recurrente</span>';

        var fila = document.createElement('tr');
        fila.innerHTML =
            '<td>#' + r.id_reserva + '</td>' +
            '<td>' + r.nombre + ' ' + r.apellidos + '</td>' +
            '<td>' + r.fecha + '</td>' +
            '<td>' + r.hora_inicio + '</td>' +
            '<td>' + r.num_personas + '</td>' +
            '<td>' + badgeEstado + '</td>' +
            '<td>' + badgeTipo + '</td>';
        cuerpo.appendChild(fila);
    });

    tabla.style.display = 'table';
    infoSpan.textContent = datos.total_filas + ' reservas · pág. ' + datos.pagina_actual + ' de ' + datos.total_paginas;

    // Controles de paginación
    document.getElementById('btn-pag-ant').disabled = datos.pagina_actual <= 1;
    document.getElementById('btn-pag-sig').disabled = datos.pagina_actual >= datos.total_paginas;
    document.getElementById('dash-pag-info').textContent = 'Página ' + datos.pagina_actual + ' de ' + datos.total_paginas;
    pagDiv.style.display = datos.total_paginas > 1 ? 'flex' : 'none';

    // Indicadores visuales de ordenación en las cabeceras
    document.querySelectorAll('th.ordenable').forEach(function (th) {
        th.className = 'ordenable';
        if (th.getAttribute('data-campo') === dashOrdenCampo) {
            th.classList.add(dashOrdenDir === 'ASC' ? 'orden-asc' : 'orden-desc');
        }
    });
}

// Alterna el sentido si la columna ya está activa, o cambia de columna
function dashCambiarOrden(campo) {
    if (dashOrdenCampo === campo) {
        dashOrdenDir = dashOrdenDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
        dashOrdenCampo = campo;
        dashOrdenDir   = 'ASC';
    }
    cargarTablaReservasDashboard(1);
}

// Avanza o retrocede en la paginación
function dashCambiarPagina(delta) {
    var nueva = dashPaginaActual + delta;
    if (nueva < 1 || nueva > dashTotalPaginas) return;
    cargarTablaReservasDashboard(nueva);
}

// ─────────────────────────────────────────────
// RESERVAS
// ─────────────────────────────────────────────

// Carga la lista de reservas aplicando filtros opcionales
function cargarReservas(fecha, estado) {
    var url = '/ProyectoFinDeGrado/backend/reservas/listar_reservas.php';
    var params = [];

    if (fecha)  params.push('fecha='  + encodeURIComponent(fecha));
    if (estado) params.push('estado=' + encodeURIComponent(estado));
    if (params.length > 0) url += '?' + params.join('&');

    fetchAPI(url)
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-reservas', respuesta.message || 'Error al cargar las reservas.');
                return;
            }
            mostrarTablaReservas(respuesta.data);
        })
        .catch(function (err) {
            console.error('Error de conexion al cargar reservas:', err);
        });
}

// Lee los filtros del formulario y lanza la carga
function filtrarReservas() {
    var fecha  = document.getElementById('filtro-fecha').value;
    var estado = document.getElementById('filtro-estado').value;
    cargarReservas(fecha, estado);
}

// Dibuja la tabla con las reservas recibidas
function mostrarTablaReservas(reservas) {
    var tabla     = document.getElementById('tabla-reservas');
    var cuerpo    = document.getElementById('cuerpo-reservas');
    var sinDatos  = document.getElementById('sin-reservas');

    cuerpo.innerHTML = '';

    if (!reservas || reservas.length === 0) {
        tabla.style.display    = 'none';
        sinDatos.style.display = 'block';
        return;
    }

    sinDatos.style.display = 'none';

    reservas.forEach(function (r) {
        var claseEstado = 'estado-' + r.estado;
        var hora = r.hora_inicio ? r.hora_inicio.substring(0, 5) : '';

        // Construir los botones de accion segun el estado actual
        var botones = '';
        if (r.estado === 'pendiente') {
            botones +=
                '<button class="btn btn-verde" style="margin-right: 6px;" ' +
                'onclick="cambiarEstadoReserva(' + r.id_reserva + ', \'confirmada\')">Confirmar</button>';
        }
        if (r.estado === 'pendiente' || r.estado === 'confirmada') {
            botones +=
                '<button class="btn btn-rojo" ' +
                'onclick="cambiarEstadoReserva(' + r.id_reserva + ', \'cancelada\')">Cancelar</button>';
        }

        var fila = document.createElement('tr');
        fila.innerHTML =
            '<td>' + r.fecha + '</td>' +
            '<td>' + hora + '</td>' +
            '<td>' + r.num_personas + '</td>' +
            '<td>' + r.nombre_cliente + '</td>' +
            '<td>' + r.email_cliente + '</td>' +
            '<td><span class="' + claseEstado + '">' + r.estado + '</span></td>' +
            '<td>' + botones + '</td>';

        cuerpo.appendChild(fila);
    });

    tabla.style.display = 'table';
}

// Envia la peticion de cambio de estado al backend y recarga la tabla
function cambiarEstadoReserva(idReserva, nuevoEstado) {
    fetchAPI('/ProyectoFinDeGrado/backend/reservas/modificar_reserva.php', 'POST', {
        id_reserva: idReserva,
        estado: nuevoEstado
    })
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-reservas', respuesta.message || 'No se pudo cambiar el estado.');
                return;
            }
            mostrarMensaje('mensaje-exito-reservas', 'Estado actualizado correctamente.');
            filtrarReservas();
        })
        .catch(function (err) {
            console.error('Error al cambiar estado de reserva:', err);
        });
}

// ─────────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────────

// Roles disponibles (id => nombre). Se poblan al cargar usuarios.
var rolesDisponibles = [];

// Carga la lista de usuarios y rellena la tabla y el select de roles
function cargarUsuarios() {
    fetchAPI('/ProyectoFinDeGrado/backend/usuarios/listar_usuarios.php')
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-usuarios', respuesta.message || 'Error al cargar usuarios.');
                return;
            }
            poblarSelectRoles(respuesta.data);
            mostrarTablaUsuarios(respuesta.data);
        })
        .catch(function (err) {
            console.error('Error de conexion al cargar usuarios:', err);
        });
}

// Extrae los roles unicos de la lista y rellena el select del formulario
function poblarSelectRoles(usuarios) {
    var select = document.getElementById('campo-rol');
    if (!select) return;

    // Recoger roles sin duplicados usando el id_rol y nombre_rol de cada usuario
    var rolesVistos = {};
    usuarios.forEach(function (u) {
        if (!rolesVistos[u.id_rol]) {
            rolesVistos[u.id_rol] = u.nombre_rol;
        }
    });

    // Si no hubiera usuarios aun, usar los roles fijos conocidos del sistema
    if (Object.keys(rolesVistos).length === 0) {
        rolesVistos = { 1: 'admin', 2: 'camarero', 3: 'jefe_sala', 4: 'cliente' };
    }

    rolesDisponibles = rolesVistos;

    select.innerHTML = '';
    Object.keys(rolesVistos).forEach(function (id) {
        var option = document.createElement('option');
        option.value       = id;
        option.textContent = rolesVistos[id];
        select.appendChild(option);
    });
}

// Dibuja la tabla con los usuarios
function mostrarTablaUsuarios(usuarios) {
    var tabla    = document.getElementById('tabla-usuarios');
    var cuerpo   = document.getElementById('cuerpo-usuarios');
    var sinDatos = document.getElementById('sin-usuarios');

    cuerpo.innerHTML = '';

    if (!usuarios || usuarios.length === 0) {
        tabla.style.display    = 'none';
        sinDatos.style.display = 'block';
        return;
    }

    sinDatos.style.display = 'none';

    usuarios.forEach(function (u) {
        // El admin no puede eliminarse a si mismo
        var esMismoUsuario = usuarioEnSesion && usuarioEnSesion.id === u.id_usuario;
        var attrEliminar   = esMismoUsuario ? 'disabled title="No puedes eliminarte a ti mismo"' : '';

        var fila = document.createElement('tr');
        fila.innerHTML =
            '<td>' + u.nombre + '</td>' +
            '<td>' + u.apellidos + '</td>' +
            '<td>' + u.email + '</td>' +
            '<td>' + (u.telefono || '-') + '</td>' +
            '<td>' + u.nombre_rol + '</td>' +
            '<td>' +
                '<button class="btn btn-gris" style="margin-right: 6px;" ' +
                    'onclick="editarUsuario(' + u.id_usuario + ')">Editar</button>' +
                '<button class="btn btn-rojo" ' + attrEliminar + ' ' +
                    'onclick="eliminarUsuario(' + u.id_usuario + ')">Eliminar</button>' +
            '</td>';

        cuerpo.appendChild(fila);
    });

    tabla.style.display = 'table';
}

// Guarda en el formulario los datos del usuario a editar
function editarUsuario(idUsuario) {
    fetchAPI('/ProyectoFinDeGrado/backend/usuarios/listar_usuarios.php')
        .then(function (respuesta) {
            if (!respuesta.success) return;

            var usuario = null;
            respuesta.data.forEach(function (u) {
                if (u.id_usuario === idUsuario) usuario = u;
            });

            if (!usuario) return;

            // Rellenar el formulario con los datos del usuario
            document.getElementById('id-usuario-editar').value  = usuario.id_usuario;
            document.getElementById('campo-nombre').value        = usuario.nombre;
            document.getElementById('campo-apellidos').value     = usuario.apellidos;
            document.getElementById('campo-email').value         = usuario.email;
            document.getElementById('campo-password').value      = '';
            document.getElementById('campo-telefono').value      = usuario.telefono || '';
            document.getElementById('campo-rol').value           = usuario.id_rol;

            // Cambiar el titulo y el boton
            document.getElementById('titulo-formulario-usuario').textContent = 'Editar usuario';
            document.getElementById('btn-guardar-usuario').textContent       = 'Guardar cambios';
            document.getElementById('btn-cancelar-usuario').style.display    = 'inline-block';

            // Hacer scroll hasta el formulario
            document.getElementById('campo-nombre').scrollIntoView({ behavior: 'smooth' });
        });
}

// Vuelve el formulario al estado de creacion
function cancelarEdicionUsuario() {
    document.getElementById('id-usuario-editar').value   = '';
    document.getElementById('campo-nombre').value         = '';
    document.getElementById('campo-apellidos').value      = '';
    document.getElementById('campo-email').value          = '';
    document.getElementById('campo-password').value       = '';
    document.getElementById('campo-telefono').value       = '';

    document.getElementById('titulo-formulario-usuario').textContent = 'Nuevo usuario';
    document.getElementById('btn-guardar-usuario').textContent       = 'Crear usuario';
    document.getElementById('btn-cancelar-usuario').style.display    = 'none';
}

// Crea un usuario nuevo o guarda los cambios de uno existente
function guardarUsuario() {
    var idUsuario = document.getElementById('id-usuario-editar').value;
    var nombre    = document.getElementById('campo-nombre').value.trim();
    var apellidos = document.getElementById('campo-apellidos').value.trim();
    var email     = document.getElementById('campo-email').value.trim();
    var password  = document.getElementById('campo-password').value;
    var telefono  = document.getElementById('campo-telefono').value.trim();
    var idRol     = document.getElementById('campo-rol').value;

    // Validacion basica
    if (!nombre || !apellidos || !email || !idRol) {
        mostrarMensaje('mensaje-error-usuarios', 'Nombre, apellidos, email y rol son obligatorios.');
        return;
    }

    if (!idUsuario && !password) {
        mostrarMensaje('mensaje-error-usuarios', 'La contrasena es obligatoria para crear un usuario.');
        return;
    }

    var datos = {
        nombre:    nombre,
        apellidos: apellidos,
        email:     email,
        telefono:  telefono,
        id_rol:    parseInt(idRol)
    };

    if (password) datos.password = password;

    var url;
    if (idUsuario) {
        // Modo edicion
        datos.id_usuario = parseInt(idUsuario);
        url = '/ProyectoFinDeGrado/backend/usuarios/modificar_usuario.php';
    } else {
        // Modo creacion
        url = '/ProyectoFinDeGrado/backend/usuarios/crear_usuario.php';
    }

    fetchAPI(url, 'POST', datos)
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-usuarios', respuesta.message || 'Error al guardar el usuario.');
                return;
            }
            mostrarMensaje('mensaje-exito-usuarios', idUsuario ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
            cancelarEdicionUsuario();
            cargarUsuarios();
        })
        .catch(function (err) {
            console.error('Error al guardar usuario:', err);
        });
}

// Elimina un usuario tras confirmacion del admin
function eliminarUsuario(idUsuario) {
    if (!confirm('¿Seguro que quieres eliminar este usuario? Esta accion no se puede deshacer.')) return;

    fetchAPI('/ProyectoFinDeGrado/backend/usuarios/eliminar_usuario.php', 'POST', {
        id_usuario: idUsuario
    })
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-usuarios', respuesta.message || 'Error al eliminar el usuario.');
                return;
            }
            mostrarMensaje('mensaje-exito-usuarios', 'Usuario eliminado correctamente.');
            cargarUsuarios();
        })
        .catch(function (err) {
            console.error('Error al eliminar usuario:', err);
        });
}

// ─────────────────────────────────────────────
// CARTA - CATEGORIAS
// ─────────────────────────────────────────────

// Carga las categorias y rellena la tabla
function cargarCategorias() {
    fetchAPI('/ProyectoFinDeGrado/backend/carta/listar_categorias.php')
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-categorias', respuesta.message || 'Error al cargar categorias.');
                return;
            }
            mostrarTablaCategorias(respuesta.data);
            poblarSelectCategorias(respuesta.data);
        })
        .catch(function (err) {
            console.error('Error de conexion al cargar categorias:', err);
        });
}

// Dibuja la tabla de categorias
function mostrarTablaCategorias(categorias) {
    var tabla    = document.getElementById('tabla-categorias');
    var cuerpo   = document.getElementById('cuerpo-categorias');
    var sinDatos = document.getElementById('sin-categorias');

    if (!tabla || !cuerpo) return;

    cuerpo.innerHTML = '';

    if (!categorias || categorias.length === 0) {
        tabla.style.display    = 'none';
        sinDatos.style.display = 'block';
        return;
    }

    sinDatos.style.display = 'none';

    categorias.forEach(function (c) {
        var fila = document.createElement('tr');
        fila.innerHTML =
            '<td>' + c.nombre + '</td>' +
            '<td>' + (c.descripcion || '-') + '</td>' +
            '<td>' + (c.activo ? 'Si' : 'No') + '</td>';
        cuerpo.appendChild(fila);
    });

    tabla.style.display = 'table';
}

// Rellena el select de categorias en el formulario de platos
function poblarSelectCategorias(categorias) {
    var select = document.getElementById('campo-categoria-plato');
    if (!select) return;

    select.innerHTML = '';
    categorias.forEach(function (c) {
        var option = document.createElement('option');
        option.value       = c.id_categoria;
        option.textContent = c.nombre;
        select.appendChild(option);
    });
}

// Envia el formulario para crear una nueva categoria
function crearCategoria() {
    var nombre      = document.getElementById('campo-nombre-categoria').value.trim();
    var descripcion = document.getElementById('campo-descripcion-categoria').value.trim();

    if (!nombre) {
        mostrarMensaje('mensaje-error-categorias', 'El nombre de la categoria es obligatorio.');
        return;
    }

    fetchAPI('/ProyectoFinDeGrado/backend/carta/crear_categoria.php', 'POST', {
        nombre:      nombre,
        descripcion: descripcion
    })
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-categorias', respuesta.message || 'Error al crear la categoria.');
                return;
            }
            mostrarMensaje('mensaje-exito-categorias', 'Categoria creada correctamente.');
            document.getElementById('campo-nombre-categoria').value      = '';
            document.getElementById('campo-descripcion-categoria').value = '';
            cargarCategorias();
        })
        .catch(function (err) {
            console.error('Error al crear categoria:', err);
        });
}

// ─────────────────────────────────────────────
// CARTA - PLATOS
// ─────────────────────────────────────────────

// Carga todos los platos y rellena la tabla
function cargarPlatos() {
    fetchAPI('/ProyectoFinDeGrado/backend/carta/listar_platos.php')
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-platos', respuesta.message || 'Error al cargar los platos.');
                return;
            }
            mostrarTablaPlatos(respuesta.data);
        })
        .catch(function (err) {
            console.error('Error de conexion al cargar platos:', err);
        });
}

// Dibuja la tabla de platos
function mostrarTablaPlatos(platos) {
    var tabla    = document.getElementById('tabla-platos');
    var cuerpo   = document.getElementById('cuerpo-platos');
    var sinDatos = document.getElementById('sin-platos');

    if (!tabla || !cuerpo) return;

    cuerpo.innerHTML = '';

    if (!platos || platos.length === 0) {
        tabla.style.display    = 'none';
        sinDatos.style.display = 'block';
        return;
    }

    sinDatos.style.display = 'none';

    platos.forEach(function (p) {
        var miniatura = p.imagen
            ? '<img src="/ProyectoFinDeGrado/frontend/' + p.imagen + '" alt="' + p.nombre + '" style="height: 48px; width: 64px; object-fit: cover; border-radius: 4px;">'
            : '<span style="color: #aaa; font-size: 0.85rem;">Sin imagen</span>';

        var fila = document.createElement('tr');
        fila.innerHTML =
            '<td>' + miniatura + '</td>' +
            '<td>' + p.nombre + '</td>' +
            '<td>' + p.nombre_categoria + '</td>' +
            '<td>' + parseFloat(p.precio).toFixed(2) + ' EUR</td>' +
            '<td>' + (p.activo ? 'Si' : 'No') + '</td>' +
            '<td>' +
                '<button class="btn btn-gris" style="margin-right: 6px;" ' +
                    'onclick="irAEditarPlato(' + p.id_plato + ')">Editar</button>' +
                '<button class="btn btn-rojo" ' +
                    'onclick="eliminarPlato(' + p.id_plato + ')">Eliminar</button>' +
            '</td>';
        cuerpo.appendChild(fila);
    });

    tabla.style.display = 'table';
}

// Guarda el id en sessionStorage y navega a la pagina de edicion
function irAEditarPlato(idPlato) {
    sessionStorage.setItem('idPlatoEditar', idPlato);
    window.location.href = 'nuevo_plato.html';
}

// Elimina un plato tras confirmacion
function eliminarPlato(idPlato) {
    if (!confirm('¿Seguro que quieres eliminar este plato?')) return;

    fetchAPI('/ProyectoFinDeGrado/backend/carta/eliminar_plato.php', 'POST', {
        id_plato: idPlato
    })
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-platos', respuesta.message || 'Error al eliminar el plato.');
                return;
            }
            mostrarMensaje('mensaje-exito-platos', 'Plato eliminado correctamente.');
            cargarPlatos();
        })
        .catch(function (err) {
            console.error('Error al eliminar plato:', err);
        });
}

// ─────────────────────────────────────────────
// HORARIOS
// ─────────────────────────────────────────────

// Carga los slots de horario y rellena la tabla
function cargarHorarios() {
    fetchAPI('/ProyectoFinDeGrado/backend/horarios/obtener_horarios.php')
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-horarios', respuesta.message || 'Error al cargar los horarios.');
                return;
            }
            mostrarTablaHorarios(respuesta.data);
        })
        .catch(function (err) {
            console.error('Error de conexion al cargar horarios:', err);
        });
}

// Dibuja la tabla de horarios con el boton de activar/desactivar
function mostrarTablaHorarios(horarios) {
    var tabla    = document.getElementById('tabla-horarios');
    var cuerpo   = document.getElementById('cuerpo-horarios');
    var sinDatos = document.getElementById('sin-horarios');

    cuerpo.innerHTML = '';

    if (!horarios || horarios.length === 0) {
        tabla.style.display    = 'none';
        sinDatos.style.display = 'block';
        return;
    }

    sinDatos.style.display = 'none';

    horarios.forEach(function (h) {
        var estadoTexto  = h.activo ? 'Activo'      : 'Inactivo';
        var btnTexto     = h.activo ? 'Desactivar'  : 'Activar';
        var btnClase     = h.activo ? 'btn-rojo'     : 'btn-verde';

        var fila = document.createElement('tr');
        fila.innerHTML =
            '<td>' + h.hora_inicio + '</td>' +
            '<td>' + estadoTexto + '</td>' +
            '<td>' +
                '<button class="btn ' + btnClase + '" ' +
                    'onclick="toggleHorario(' + h.id_horario + ', ' + h.activo + ')">' +
                    btnTexto +
                '</button>' +
            '</td>';
        cuerpo.appendChild(fila);
    });

    tabla.style.display = 'table';
}

// Cambia el estado activo/inactivo de un slot de horario
function toggleHorario(idHorario, activoActual) {
    var nuevoActivo = activoActual ? 0 : 1;

    fetchAPI('/ProyectoFinDeGrado/backend/horarios/modificar_horarios.php', 'POST', {
        id_horario: idHorario,
        activo:     nuevoActivo
    })
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-horarios', respuesta.message || 'Error al modificar el horario.');
                return;
            }
            mostrarMensaje('mensaje-exito-horarios', 'Horario actualizado correctamente.');
            cargarHorarios();
        })
        .catch(function (err) {
            console.error('Error al modificar horario:', err);
        });
}

// ─────────────────────────────────────────────
// CIERRES
// ─────────────────────────────────────────────

// Carga los dias cerrados y rellena la tabla
function cargarCierres() {
    fetchAPI('/ProyectoFinDeGrado/backend/cierres/listar_cierres.php')
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-cierres', respuesta.message || 'Error al cargar los cierres.');
                return;
            }
            mostrarTablaCierres(respuesta.data);
        })
        .catch(function (err) {
            console.error('Error de conexion al cargar cierres:', err);
        });
}

// Dibuja la tabla de dias cerrados
function mostrarTablaCierres(cierres) {
    var tabla    = document.getElementById('tabla-cierres');
    var cuerpo   = document.getElementById('cuerpo-cierres');
    var sinDatos = document.getElementById('sin-cierres');

    cuerpo.innerHTML = '';

    if (!cierres || cierres.length === 0) {
        tabla.style.display    = 'none';
        sinDatos.style.display = 'block';
        return;
    }

    sinDatos.style.display = 'none';

    cierres.forEach(function (c) {
        var fila = document.createElement('tr');
        fila.innerHTML =
            '<td>' + c.fecha + '</td>' +
            '<td>' + (c.motivo || '-') + '</td>' +
            '<td>' +
                '<button class="btn btn-rojo" ' +
                    'onclick="eliminarCierre(' + c.id_cierre + ')">Eliminar</button>' +
            '</td>';
        cuerpo.appendChild(fila);
    });

    tabla.style.display = 'table';
}

// Crea un nuevo dia de cierre
function crearCierre() {
    var fecha  = document.getElementById('campo-fecha-cierre').value;
    var motivo = document.getElementById('campo-motivo-cierre').value.trim();

    if (!fecha) {
        mostrarMensaje('mensaje-error-cierres', 'La fecha es obligatoria.');
        return;
    }

    fetchAPI('/ProyectoFinDeGrado/backend/cierres/crear_cierre.php', 'POST', {
        fecha:  fecha,
        motivo: motivo
    })
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-cierres', respuesta.message || 'Error al crear el cierre.');
                return;
            }
            var msg = 'Dia de cierre anadido correctamente.';
            if (respuesta.reservas_canceladas > 0) {
                msg += ' Se han cancelado ' + respuesta.reservas_canceladas + ' reserva(s) existente(s).';
            }
            mostrarMensaje('mensaje-exito-cierres', msg);
            document.getElementById('campo-fecha-cierre').value  = '';
            document.getElementById('campo-motivo-cierre').value = '';
            cargarCierres();
        })
        .catch(function (err) {
            console.error('Error al crear cierre:', err);
        });
}

// Elimina un dia de cierre tras confirmacion
function eliminarCierre(idCierre) {
    if (!confirm('¿Seguro que quieres eliminar este dia de cierre?')) return;

    fetchAPI('/ProyectoFinDeGrado/backend/cierres/eliminar_cierre.php', 'POST', {
        id_cierre: idCierre
    })
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-cierres', respuesta.message || 'Error al eliminar el cierre.');
                return;
            }
            mostrarMensaje('mensaje-exito-cierres', 'Dia de cierre eliminado correctamente.');
            cargarCierres();
        })
        .catch(function (err) {
            console.error('Error al eliminar cierre:', err);
        });
}

// ─────────────────────────────────────────────
// UTILIDAD: mostrar mensajes de error o exito
// ─────────────────────────────────────────────

// Muestra un mensaje en el div indicado y lo oculta a los 3 segundos
function mostrarMensaje(idDiv, texto) {
    var div = document.getElementById(idDiv);
    if (!div) return;

    div.textContent      = texto;
    div.style.display    = 'block';

    setTimeout(function () {
        div.style.display = 'none';
    }, 3000);
}
