// admin.js - Logica del panel de administracion

// Usuario que tiene la sesion activa (se rellena en cada pagina al hacer checkSession)
var usuarioEnSesion = null;

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

// Carga los KPIs y el aforo del dia
function cargarDashboard() {
    fetchAPI('/ProyectoFinDeGrado/backend/dashboard/estadisticas.php')
        .then(function (respuesta) {
            if (!respuesta.success) {
                console.error('Error al cargar dashboard:', respuesta.message);
                return;
            }
            mostrarKPIs(respuesta.data);
            mostrarAforoDia(respuesta.data.aforo_hoy);
        })
        .catch(function (err) {
            console.error('Error de conexion en dashboard:', err);
        });
}

// Genera las 4 tarjetas de KPI en fila
function mostrarKPIs(datos) {
    var contenedor = document.getElementById('kpi-contenedor');
    if (!contenedor) return;

    var pendientes   = datos.reservas_por_estado.pendiente  || 0;
    var confirmadas  = datos.reservas_por_estado.confirmada || 0;

    var tarjetas = [
        { titulo: 'Reservas hoy',     valor: datos.reservas_hoy,    color: '#2c6e49' },
        { titulo: 'Esta semana',       valor: datos.reservas_semana, color: '#1a5a8a' },
        { titulo: 'Pendientes',        valor: pendientes,            color: '#e67e22' },
        { titulo: 'Confirmadas',       valor: confirmadas,           color: '#1a6b35' }
    ];

    contenedor.innerHTML = '';

    tarjetas.forEach(function (t) {
        var div = document.createElement('div');
        div.style.cssText = [
            'flex: 1',
            'min-width: 180px',
            'background-color: white',
            'border: 1px solid #cccccc',
            'border-radius: 8px',
            'padding: 20px 24px',
            'text-align: center'
        ].join('; ');

        div.innerHTML =
            '<p style="font-size: 0.85rem; color: #666; margin-bottom: 8px;">' + t.titulo + '</p>' +
            '<p style="font-size: 2rem; font-weight: bold; color: ' + t.color + ';">' + t.valor + '</p>';

        contenedor.appendChild(div);
    });
}

// Rellena la tabla de aforo por horas del dia
function mostrarAforoDia(aforo) {
    var tabla   = document.getElementById('tabla-aforo');
    var cuerpo  = document.getElementById('cuerpo-aforo');
    var sinDatos = document.getElementById('sin-aforo');

    if (!aforo || aforo.length === 0) {
        if (sinDatos) sinDatos.style.display = 'block';
        return;
    }

    cuerpo.innerHTML = '';

    aforo.forEach(function (slot) {
        var disponible  = slot.capacidad_total - slot.ocupado;
        var porcentaje  = slot.capacidad_total > 0
            ? Math.round((slot.ocupado / slot.capacidad_total) * 100)
            : 0;

        var fila = document.createElement('tr');
        fila.innerHTML =
            '<td>' + slot.hora_inicio + '</td>' +
            '<td>' + slot.ocupado + ' / ' + slot.capacidad_total + '</td>' +
            '<td>' + disponible + '</td>' +
            '<td>' + porcentaje + '%</td>';

        cuerpo.appendChild(fila);
    });

    tabla.style.display = 'table';
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

// Rellena el formulario con los datos del plato a editar
function editarPlato(idPlato) {
    fetchAPI('/ProyectoFinDeGrado/backend/carta/listar_platos.php')
        .then(function (respuesta) {
            if (!respuesta.success) return;

            var plato = null;
            respuesta.data.forEach(function (p) {
                if (p.id_plato === idPlato) plato = p;
            });

            if (!plato) return;

            document.getElementById('id-plato-editar').value           = plato.id_plato;
            document.getElementById('campo-nombre-plato').value         = plato.nombre;
            document.getElementById('campo-descripcion-plato').value    = plato.descripcion || '';
            document.getElementById('campo-precio-plato').value         = plato.precio;
            document.getElementById('campo-categoria-plato').value      = plato.id_categoria;
            document.getElementById('campo-activo-plato').value         = plato.activo;

            // mostrar la imagen actual si existe
            var preview = document.getElementById('preview-imagen-plato');
            if (plato.imagen) {
                preview.src          = '/ProyectoFinDeGrado/frontend/' + plato.imagen;
                preview.style.display = 'block';
            } else {
                preview.src          = '';
                preview.style.display = 'none';
            }

            document.getElementById('titulo-formulario-plato').textContent = 'Editar plato';
            document.getElementById('btn-guardar-plato').textContent       = 'Guardar cambios';
            document.getElementById('btn-cancelar-plato').style.display    = 'inline-block';

            document.getElementById('campo-nombre-plato').scrollIntoView({ behavior: 'smooth' });
        });
}

// Resetea el formulario al estado de creacion
function cancelarEdicionPlato() {
    document.getElementById('id-plato-editar').value        = '';
    document.getElementById('campo-nombre-plato').value      = '';
    document.getElementById('campo-descripcion-plato').value = '';
    document.getElementById('campo-precio-plato').value      = '';
    document.getElementById('campo-activo-plato').value      = '1';
    document.getElementById('campo-imagen-plato').value      = '';

    var preview = document.getElementById('preview-imagen-plato');
    preview.src          = '';
    preview.style.display = 'none';

    document.getElementById('titulo-formulario-plato').textContent = 'Nuevo plato';
    document.getElementById('btn-guardar-plato').textContent       = 'Anadir plato';
    document.getElementById('btn-cancelar-plato').style.display    = 'none';
}

// Crea o edita un plato segun si hay id en el campo oculto
// Usa FormData (no JSON) porque puede incluir una imagen como fichero
function guardarPlato() {
    var idPlato     = document.getElementById('id-plato-editar').value;
    var nombre      = document.getElementById('campo-nombre-plato').value.trim();
    var descripcion = document.getElementById('campo-descripcion-plato').value.trim();
    var precio      = document.getElementById('campo-precio-plato').value;
    var idCategoria = document.getElementById('campo-categoria-plato').value;
    var activo      = document.getElementById('campo-activo-plato').value;
    var inputImagen = document.getElementById('campo-imagen-plato');

    if (!nombre || !precio || !idCategoria) {
        mostrarMensaje('mensaje-error-platos', 'Nombre, precio y categoria son obligatorios.');
        return;
    }

    var formData = new FormData();
    formData.append('nombre',       nombre);
    formData.append('descripcion',  descripcion);
    formData.append('precio',       precio);
    formData.append('id_categoria', idCategoria);
    formData.append('activo',       activo);

    if (inputImagen.files.length > 0) {
        formData.append('imagen', inputImagen.files[0]);
    }

    var url;
    if (idPlato) {
        formData.append('id_plato', idPlato);
        url = '/ProyectoFinDeGrado/backend/carta/modificar_plato.php';
    } else {
        url = '/ProyectoFinDeGrado/backend/carta/crear_plato.php';
    }

    fetch(url, { method: 'POST', credentials: 'include', body: formData })
        .then(function (respuesta) { return respuesta.json(); })
        .then(function (respuesta) {
            if (!respuesta.success) {
                mostrarMensaje('mensaje-error-platos', respuesta.message || 'Error al guardar el plato.');
                return;
            }
            mostrarMensaje('mensaje-exito-platos', idPlato ? 'Plato actualizado correctamente.' : 'Plato creado correctamente.');
            cancelarEdicionPlato();
            cargarPlatos();
        })
        .catch(function (err) {
            console.error('Error al guardar plato:', err);
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
