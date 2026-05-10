// utils.js - Funcion para llamar al backend desde cualquier pagina

async function fetchAPI(url, metodo = 'GET', datos = null) {
    var opciones = {
        method: metodo,
        credentials: 'include' // necesario para que PHP mantenga la sesion
    };

    if (datos !== null) {
        opciones.headers = { 'Content-Type': 'application/json' };
        opciones.body = JSON.stringify(datos);
    }

    try {
        var respuesta = await fetch(url, opciones);
        return await respuesta.json();
    } catch (error) {
        return { success: false, message: 'Error de conexion con el servidor' };
    }
}
