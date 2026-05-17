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

    var mapaEstado = { confirmada: 'badge-ok', pendiente: 'badge-warn', cancelada: 'badge-err' };
    datos.reservas.forEach(function (r) {
        var clsEstado   = mapaEstado[r.estado] || 'badge-mute';
        var badgeEstado = '<span class="badge ' + clsEstado + '"><span class="dot"></span>' + r.estado + '</span>';
        var badgeTipo   = r.es_nuevo
            ? '<span class="badge badge-clay">Nuevo</span>'
            : '<span class="badge badge-mute">Recurrente</span>';

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

        var mapaEst = { confirmada: 'badge-ok', pendiente: 'badge-warn', cancelada: 'badge-err' };
        var clsBadge = mapaEst[r.estado] || 'badge-mute';
        var badgeReserva = '<span class="badge ' + clsBadge + '"><span class="dot"></span>' + r.estado + '</span>';

        var botones = '<div class="row gap-1" style="justify-content:flex-end;">';
        if (r.estado === 'pendiente') {
            botones +=
                '<button class="btn btn-olive btn-sm" ' +
                'onclick="cambiarEstadoReserva(' + r.id_reserva + ', \'confirmada\')">Confirmar</button>';
        }
        if (r.estado === 'pendiente' || r.estado === 'confirmada') {
            botones +=
                '<button class="btn btn-danger btn-sm" ' +
                'onclick="cambiarEstadoReserva(' + r.id_reserva + ', \'cancelada\')">Cancelar</button>';
        }
        botones += '</div>';

        var fila = document.createElement('tr');
        fila.innerHTML =
            '<td>' + r.fecha + '</td>' +
            '<td class="num">' + hora + '</td>' +
            '<td class="num">' + r.num_personas + '</td>' +
            '<td style="font-weight:500;">' + r.nombre_cliente + '</td>' +
            '<td style="color:var(--ink-3);">' + r.email_cliente + '</td>' +
            '<td>' + badgeReserva + '</td>' +
            '<td style="text-align:right;">' + botones + '</td>';

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
            '<td style="font-weight:500;">' + u.nombre + '</td>' +
            '<td>' + u.apellidos + '</td>' +
            '<td style="color:var(--ink-3);">' + u.email + '</td>' +
            '<td class="num">' + (u.telefono || '—') + '</td>' +
            '<td><span class="badge badge-mute">' + u.nombre_rol + '</span></td>' +
            '<td style="text-align:right;">' +
                '<div class="row gap-1" style="justify-content:flex-end;">' +
                '<button class="btn btn-secondary btn-sm" ' +
                    'onclick="editarUsuario(' + u.id_usuario + ')">Editar</button>' +
                '<button class="btn btn-danger btn-sm" ' + attrEliminar + ' ' +
                    'onclick="eliminarUsuario(' + u.id_usuario + ')">Eliminar</button>' +
                '</div>' +
            '</td>';

        cuerpo.appendChild(fila);
    });

    tabla.style.display = 'table';
}

// Guarda el id en sessionStorage y navega a la pagina de edicion
function editarUsuario(idUsuario) {
    sessionStorage.setItem('idUsuarioEditar', idUsuario);
    window.location.href = 'crear_usuario.html';
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

// Orden de ids de categorias tal como aparecen en la tabla (se rellena al cargar)
var ordenCategorias = [];

// Carga las categorias y rellena la tabla; llama al callback opcional al terminar
function cargarCategorias(callback) {
    fetchAPI('/ProyectoFinDeGrado/backend/carta/listar_categorias.php')
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-categorias', respuesta.message || 'Error al cargar categorias.');
                return;
            }
            ordenCategorias = respuesta.data.map(function (c) { return parseInt(c.id_categoria); });
            mostrarTablaCategorias(respuesta.data);
            poblarSelectCategorias(respuesta.data);
            if (callback) callback();
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
            '<td>' + (c.descripcion || '-') + '</td>';
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

    // Ordenar por posicion de categoria igual que en la tabla de arriba
    platos.sort(function (a, b) {
        var posA = ordenCategorias.indexOf(parseInt(a.id_categoria));
        var posB = ordenCategorias.indexOf(parseInt(b.id_categoria));
        if (posA === -1) posA = 9999;
        if (posB === -1) posB = 9999;
        return posA - posB;
    });

    platos.forEach(function (p) {
        var miniatura = p.imagen
            ? '<img src="' + p.imagen + '" alt="' + p.nombre + '" style="height:48px;width:64px;object-fit:cover;border-radius:var(--r-md);">'
            : '<div class="ph-img" style="width:64px;height:48px;font-size:8px;">img</div>';

        var fila = document.createElement('tr');
        fila.innerHTML =
            '<td>' + miniatura + '</td>' +
            '<td style="font-weight:500;">' + p.nombre + '</td>' +
            '<td><span class="mono" style="font-size:11px;color:var(--terracota);">' + p.nombre_categoria + '</span></td>' +
            '<td class="num" style="font-weight:600;">' + parseFloat(p.precio).toFixed(2) + ' €</td>' +
            '<td>' + (p.activo == 1
                ? '<span class="badge badge-ok">Sí</span>'
                : '<span class="badge badge-mute">No</span>') + '</td>' +
            '<td>' + (p.destacado == 1
                ? '<span class="badge badge-clay">Destacado</span>'
                : '<span class="badge badge-mute">No</span>') + '</td>' +
            '<td style="text-align:right;">' +
                '<div class="row gap-1" style="justify-content:flex-end;">' +
                '<button class="btn btn-secondary btn-sm" ' +
                    'onclick="irAEditarPlato(' + p.id_plato + ')">Editar</button>' +
                '<button class="btn btn-danger btn-sm" ' +
                    'onclick="eliminarPlato(' + p.id_plato + ')">Eliminar</button>' +
                '</div>' +
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

// Elimina una categoria tras confirmacion
function eliminarCategoria(idCategoria) {
    if (!confirm('¿Seguro que quieres eliminar esta categoría? No se puede eliminar si tiene platos asociados.')) return;

    fetchAPI('/ProyectoFinDeGrado/backend/carta/eliminar_categoria.php', 'POST', {
        id_categoria: idCategoria
    })
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-categorias', respuesta.message || 'Error al eliminar la categoría.');
                return;
            }
            mostrarMensaje('mensaje-exito-categorias', 'Categoría eliminada correctamente.');
            cargarCategorias();
        })
        .catch(function (err) {
            console.error('Error al eliminar categoría:', err);
        });
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
            '<td class="num" style="font-weight:600;">' + c.fecha + '</td>' +
            '<td style="color:var(--ink-2);">' + (c.motivo || '—') + '</td>' +
            '<td style="text-align:right;">' +
                '<button class="btn btn-danger btn-sm" ' +
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
// HORARIOS DE TRABAJADORES
// ─────────────────────────────────────────────

var htrabSemanaActual = '';

function calcularLunesDeSemana(fecha) {
    var d = fecha ? new Date(fecha + 'T00:00:00') : new Date();
    var diaSemana = d.getDay();
    var diff = diaSemana === 0 ? -6 : 1 - diaSemana;
    d.setDate(d.getDate() + diff);
    var anio = d.getFullYear();
    var mes  = String(d.getMonth() + 1).padStart(2, '0');
    var dia  = String(d.getDate()).padStart(2, '0');
    return anio + '-' + mes + '-' + dia;
}

function formatearFechaCorta(fechaStr) {
    var p = fechaStr.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
}

function sumarDiasFecha(fechaStr, dias) {
    var d = new Date(fechaStr + 'T00:00:00');
    d.setDate(d.getDate() + dias);
    var anio = d.getFullYear();
    var mes  = String(d.getMonth() + 1).padStart(2, '0');
    var dia  = String(d.getDate()).padStart(2, '0');
    return anio + '-' + mes + '-' + dia;
}

function iniciarSeccionHtrab() {
    htrabSemanaActual = calcularLunesDeSemana();
    actualizarLabelSemanaHtrab();
    cargarHorariosTrabajoSemana();
}

function cambiarSemanaHtrab(direccion) {
    htrabSemanaActual = sumarDiasFecha(htrabSemanaActual, direccion * 7);
    actualizarLabelSemanaHtrab();
    cargarHorariosTrabajoSemana();
}

function actualizarLabelSemanaHtrab() {
    var lunes   = htrabSemanaActual;
    var domingo = sumarDiasFecha(lunes, 6);
    var label   = document.getElementById('htrab-semana-label');
    if (!label) return;

    var meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
                 'septiembre','octubre','noviembre','diciembre'];
    var pL  = lunes.split('-');
    var pD  = domingo.split('-');
    var texto;
    if (pL[1] === pD[1] && pL[0] === pD[0]) {
        texto = 'Semana del ' + parseInt(pL[2]) + ' al ' + parseInt(pD[2]) +
                ' de ' + meses[parseInt(pD[1]) - 1] + ' de ' + pD[0];
    } else {
        texto = 'Semana del ' + parseInt(pL[2]) + ' de ' + meses[parseInt(pL[1]) - 1] +
                ' al '  + parseInt(pD[2]) + ' de ' + meses[parseInt(pD[1]) - 1] + ' de ' + pD[0];
    }
    label.textContent = texto;
}

function cargarHorariosTrabajoSemana() {
    var url = '/ProyectoFinDeGrado/backend/empleados/obtener_horario_semana_admin.php?semana_inicio=' + htrabSemanaActual;
    fetchAPI(url)
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-htrab', respuesta.message || 'Error al cargar los horarios.');
                return;
            }
            mostrarTablaHtrab(respuesta.data);
        })
        .catch(function (err) {
            console.error('Error al cargar horarios:', err);
        });
}

// Cambia el color de la celda según el valor del select
function colorarCeldaSelect(select) {
    var celda = select.parentElement;
    celda.className = select.value === 'trabajo' ? 'celda-dia dia-trabajo' : 'celda-dia dia-libre';
}

// Dibuja la tabla con todos los empleados y un select por cada día
function mostrarTablaHtrab(empleados) {
    var tabla    = document.getElementById('tabla-htrab');
    var cabecera = document.getElementById('cabecera-htrab');
    var cuerpo   = document.getElementById('cuerpo-htrab');
    var sinDatos = document.getElementById('sin-htrab');

    if (!cuerpo) return;
    cuerpo.innerHTML = '';

    if (!empleados || empleados.length === 0) {
        if (tabla)    tabla.style.display    = 'none';
        if (sinDatos) sinDatos.style.display = 'block';
        return;
    }

    if (sinDatos) sinDatos.style.display = 'none';

    // Cabecera dinámica con letra del día y fecha corta
    var letrasDia = ['L','M','X','J','V','S','D'];
    var cabHtml   = '<tr><th>Empleado</th>';
    if (empleados[0] && empleados[0].dias) {
        empleados[0].dias.forEach(function (dia, i) {
            var p  = dia.fecha.split('-');
            cabHtml += '<th>' + letrasDia[i] + '<small>' + parseInt(p[2]) + '/' + parseInt(p[1]) + '</small></th>';
        });
    }
    cabHtml += '</tr>';
    if (cabecera) cabecera.innerHTML = cabHtml;

    // Filas de empleados
    empleados.forEach(function (emp) {
        var fila    = document.createElement('tr');
        var badgeRol = emp.rol === 'jefe_sala'
            ? '<span class="badge badge-ok"><span class="dot"></span>Jefe de sala</span>'
            : '<span class="badge badge-mute">Camarero</span>';

        var celdas = '<td><strong>' + emp.nombre + ' ' + emp.apellidos + '</strong><br>' + badgeRol + '</td>';

        emp.dias.forEach(function (dia) {
            var clase = dia.estado === 'trabajo' ? 'celda-dia dia-trabajo' : 'celda-dia dia-libre';
            celdas += '<td class="' + clase + '">';
            celdas += '<select data-empleado="' + emp.id_usuario + '" data-fecha="' + dia.fecha + '" onchange="colorarCeldaSelect(this)">';
            celdas += '<option value="trabajo"' + (dia.estado === 'trabajo' ? ' selected' : '') + '>Trabajo</option>';
            celdas += '<option value="libre"'   + (dia.estado === 'libre'   ? ' selected' : '') + '>Libre</option>';
            celdas += '</select></td>';
        });

        fila.innerHTML = celdas;
        cuerpo.appendChild(fila);
    });

    if (tabla) tabla.style.display = 'table';
}

// Recoge todos los selects y envía el horario completo al backend
function guardarSemanaHtrab() {
    var selects  = document.querySelectorAll('#cuerpo-htrab select');
    var horarios = [];

    selects.forEach(function (sel) {
        horarios.push({
            empleado_id: parseInt(sel.dataset.empleado),
            fecha:       sel.dataset.fecha,
            estado:      sel.value,
        });
    });

    if (horarios.length === 0) {
        mostrarMensaje('mensaje-error-htrab', 'No hay datos para guardar.');
        return;
    }

    fetchAPI('/ProyectoFinDeGrado/backend/empleados/guardar_horario_semana.php', 'POST', { horarios: horarios })
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-htrab', respuesta.message || 'Error al guardar el horario.');
                return;
            }
            mostrarMensaje('mensaje-exito-htrab', 'Horario guardado correctamente.');
        })
        .catch(function (err) {
            console.error('Error al guardar el horario:', err);
        });
}

// ─────────────────────────────────────────────
// CLIENTES
// ─────────────────────────────────────────────

// Carga la lista de clientes, aplicando el filtro de fechas si está relleno
function cargarClientes() {
    var desde = document.getElementById('filtro-clientes-desde')
        ? document.getElementById('filtro-clientes-desde').value
        : '';
    var hasta = document.getElementById('filtro-clientes-hasta')
        ? document.getElementById('filtro-clientes-hasta').value
        : '';

    var url = '/ProyectoFinDeGrado/backend/clientes/listar_clientes.php';
    if (desde && hasta) {
        url += '?desde=' + encodeURIComponent(desde) + '&hasta=' + encodeURIComponent(hasta);
    }

    fetch(url)
        .then(function (res) { return res.json(); })
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-clientes', respuesta.message || 'Error al cargar los clientes.');
                return;
            }
            mostrarTablaClientes(respuesta.data);
        })
        .catch(function () {
            mostrarMensaje('mensaje-error-clientes', 'No se pudo conectar con el servidor.');
        });
}

// Renderiza la tabla de clientes y actualiza el contador
function mostrarTablaClientes(clientes) {
    var tabla   = document.getElementById('tabla-clientes');
    var cuerpo  = document.getElementById('cuerpo-clientes');
    var sinMsg  = document.getElementById('sin-clientes');
    var totalEl = document.getElementById('total-clientes');

    if (!tabla || !cuerpo) return;

    cuerpo.innerHTML = '';

    if (clientes.length === 0) {
        tabla.style.display  = 'none';
        sinMsg.style.display = 'block';
        if (totalEl) totalEl.textContent = 'Mostrando 0 clientes';
        return;
    }

    sinMsg.style.display = 'none';
    tabla.style.display  = 'table';

    if (totalEl) {
        totalEl.textContent = 'Mostrando ' + clientes.length + ' cliente' + (clientes.length === 1 ? '' : 's');
    }

    clientes.forEach(function (cliente) {
        var fecha = cliente.created_at
            ? new Date(cliente.created_at).toLocaleDateString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric'
              })
            : '—';

        var fila = '<tr>' +
            '<td>' + (cliente.nombre    || '—') + '</td>' +
            '<td>' + (cliente.apellidos || '—') + '</td>' +
            '<td>' + (cliente.email     || '—') + '</td>' +
            '<td>' + (cliente.telefono  || '—') + '</td>' +
            '<td>' + fecha + '</td>' +
            '</tr>';
        cuerpo.innerHTML += fila;
    });
}

// Limpia el filtro de fechas y recarga todos los clientes
function limpiarFiltroClientes() {
    var inputDesde = document.getElementById('filtro-clientes-desde');
    var inputHasta = document.getElementById('filtro-clientes-hasta');
    if (inputDesde) inputDesde.value = '';
    if (inputHasta) inputHasta.value = '';
    cargarClientes();
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
