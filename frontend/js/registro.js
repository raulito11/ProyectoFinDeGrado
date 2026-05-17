// registro.js - Formulario de registro publico

document.addEventListener('DOMContentLoaded', function () {
    var formulario = document.getElementById('form-registro');
    if (formulario) {
        formulario.addEventListener('submit', function (e) {
            e.preventDefault();
            registrarUsuario();
        });
    }
});

function registrarUsuario() {
    var nombre    = document.getElementById('nombre').value.trim();
    var apellidos = document.getElementById('apellidos').value.trim();
    var email     = document.getElementById('email').value.trim();
    var telefono  = document.getElementById('telefono').value.trim();
    var password  = document.getElementById('password').value;

    var mensajeError  = document.getElementById('mensaje-error');
    var mensajeExito  = document.getElementById('mensaje-exito');

    mensajeError.style.display = 'none';
    mensajeExito.style.display = 'none';

    if (!nombre || !apellidos || !email || !telefono || !password) {
        mensajeError.textContent = 'Por favor, rellena todos los campos.';
        mensajeError.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        mensajeError.textContent = 'La contrasena debe tener al menos 6 caracteres.';
        mensajeError.style.display = 'block';
        return;
    }

    fetchAPI('/ProyectoFinDeGrado/backend/auth/registro.php', 'POST', {
        nombre: nombre,
        apellidos: apellidos,
        email: email,
        telefono: telefono,
        password: password
    }).then(function (respuesta) {
        if (respuesta.success) {
            window.location.href = '/index.html';
        } else {
            mensajeError.textContent = respuesta.message;
            mensajeError.style.display = 'block';
        }
    });
}
