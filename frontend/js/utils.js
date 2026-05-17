// utils.js - Funcion para llamar al backend desde cualquier pagina

// El frontend llama a /api/* y Vercel lo proxea a Railway.
// Asi la cookie de sesion es de primera parte (mismo dominio que el frontend)
// y el navegador la acepta sin restricciones de SameSite.
var API_BASE = '/api';

async function fetchAPI(url, metodo = 'GET', datos = null) {
    // Redirigir llamadas al backend de Railway en producción
    if (API_BASE && url.startsWith('/ProyectoFinDeGrado/backend')) {
        url = API_BASE + url.replace('/ProyectoFinDeGrado/backend', '');
    }

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
