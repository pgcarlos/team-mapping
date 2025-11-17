// --------------------------------------------------
// GUARDAR NOMBRE DEL USUARIO
// --------------------------------------------------

function guardarNombre(event) {
    const nombre = document.getElementById("nombreUsuario").value.trim();

    if (nombre.length < 2) {
        alert("Por favor ingresa tu nombre antes de continuar.");
        event.preventDefault();
        return false;
    }

    // Guardamos el nombre de forma "persistente"
    localStorage.setItem("nombre_usuario", nombre);
}



// --------------------------------------------------
// FUNCIÓN AUXILIAR: Formatear fecha/hora
// --------------------------------------------------

function formatearFechaHora(isoString) {
    const d = new Date(isoString);
    if (isNaN(d)) return "";

    const pad = n => (n < 10 ? "0" + n : n);

    const dia = pad(d.getDate());
    const mes = pad(d.getMonth() + 1);
    const anio = d.getFullYear();
    const horas = pad(d.getHours());
    const minutos = pad(d.getMinutes());

    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
}



// --------------------------------------------------
// ANÁLISIS POR 5 PREGUNTAS + GLOBAL
// --------------------------------------------------

function analizarRespuestas() {
    const r1 = document.getElementById("respuesta1").value.trim().toLowerCase();
    const r2 = document.getElementById("respuesta2").value.trim().toLowerCase();
    const r3 = document.getElementById("respuesta3").value.trim().toLowerCase();
    const r4 = document.getElementById("respuesta4").value.trim().toLowerCase();
    const r5 = document.getElementById("respuesta5").value.trim().toLowerCase();

    const textoCompleto = (r1 + " " + r2 + " " + r3 + " " + r4 + " " + r5).trim();

    if (textoCompleto.length < 20) {
        alert("Por favor escribe respuestas más completas para poder analizarlas.");
        return;
    }

    const reglas = {
        "Liderazgo": [
            "lider", "equipo", "guiar", "motivar", "decisión", "responsabilidad",
            "dirigir", "afrontar", "necesario", "supervisar", "manejar", "despedir",
            "situación", "coordinar", "orientar"
        ],
        "Comunicación": [
            "comunicar", "explicar", "escuchar", "empatía", "dialogar",
            "transmitir", "claridad", "comprender", "entender", "expresar",
            "feedback", "retroalimentación", "conversación"
        ],
        "Resolución de problemas": [
            "resolver", "problema", "analizar", "solución", "estrategia",
            "evaluar", "investigar", "identificar", "mejorar", "ajustar",
            "abordar", "alternativa", "opciones"
        ]
    };

    function analizarTexto(texto) {
        let puntuaciones = {
            "Liderazgo": 0,
            "Comunicación": 0,
            "Resolución de problemas": 0
        };

        const palabras = texto.split(/\s+/);

        for (const habilidad in reglas) {
            reglas[habilidad].forEach(keyword => {
                palabras.forEach(p => {
                    if (p.includes(keyword)) {
                        puntuaciones[habilidad]++;
                    }
                });
            });
        }

        const suma = Object.values(puntuaciones).reduce((a, b) => a + b, 0);
        let dominante = "Sin clasificación";

        if (suma > 0) {
            dominante = Object.keys(puntuaciones).reduce((a, b) =>
                puntuaciones[a] > puntuaciones[b] ? a : b
            );
        }

        return { dominante, puntuaciones };
    }

    const analisis = {
        p1: analizarTexto(r1),
        p2: analizarTexto(r2),
        p3: analizarTexto(r3),
        p4: analizarTexto(r4),
        p5: analizarTexto(r5),
        global: analizarTexto(textoCompleto)
    };

    localStorage.setItem("analisis_completo", JSON.stringify(analisis));

    // Guardar fecha/hora del análisis
    localStorage.setItem("fecha_analisis", new Date().toISOString());

    window.location.href = "resultados.html";
}



// --------------------------------------------------
// ON LOAD: rellenar nombre + mostrar resultados
// --------------------------------------------------

window.addEventListener("load", () => {
    const nombre = localStorage.getItem("nombre_usuario") || "";

    // Si estamos en index, rellenar el input si ya había nombre guardado
    const nombreInput = document.getElementById("nombreUsuario");
    if (nombreInput && nombre.length > 0) {
        nombreInput.value = nombre;
    }

    // Si no existen estos elementos, no estamos en resultados.html
    const titulo = document.getElementById("habilidad-dominante");
    const explicacion = document.getElementById("explicacion");
    const lista = document.getElementById("lista-puntuaciones");
    const saludo = document.getElementById("saludo-personalizado");

    if (!titulo || !lista) {
        // No estamos en resultados.html, terminamos aquí
        return;
    }

    const dataStr = localStorage.getItem("analisis_completo");
    if (!dataStr) return;

    const data = JSON.parse(dataStr);
    const global = data.global;

    // --------- Saludo personalizado ---------
    if (saludo) {
        saludo.innerText =
            nombre.length > 0
                ? `Hola ${nombre}, esta es la clasificación preliminar basada en tus respuestas:`
                : "Clasificación preliminar basada en tus respuestas:";
    }

    // --------- Fecha y hora del análisis ---------
    const fechaElem = document.getElementById("analysis-date");
    const fechaIso = localStorage.getItem("fecha_analisis");
    if (fechaElem && fechaIso) {
        const textoFecha = formatearFechaHora(fechaIso);
        if (textoFecha) {
            fechaElem.innerText = `Último análisis realizado el ${textoFecha}`;
        }
    }

    // --------- Habilidad dominante ---------
    if (global.dominante === "Sin clasificación") {
        titulo.innerText = "No se detectaron indicadores suficientes";
        explicacion.innerText = "Intenta responder con más detalle para obtener un análisis más preciso.";
    } else {
        titulo.innerText = "Habilidad dominante: " + global.dominante;

        const mensajes = {
            "Liderazgo": "Se detectaron palabras asociadas a liderazgo.",
            "Comunicación": "Se identificaron términos asociados a comunicación.",
            "Resolución de problemas": "Tu texto incluye indicadores de análisis y solución."
        };

        explicacion.innerText = mensajes[global.dominante];
    }

    // --------- Porcentajes + barras de progreso ---------
    lista.innerHTML = "";
    const total = Object.values(global.puntuaciones).reduce((a, b) => a + b, 0) || 1;

    for (const habilidad in global.puntuaciones) {
        const valor = global.puntuaciones[habilidad];
        const porcentaje = ((valor / total) * 100).toFixed(1);

        lista.innerHTML += `
            <li class="score-item">
                <div class="score-header">
                    <span class="score-label">${habilidad}</span>
                    <span class="score-value">${porcentaje}% (${valor} coincidencias)</span>
                </div>
                <div class="score-bar">
                    <div class="score-bar-fill" data-target="${porcentaje}"></div>
                </div>
            </li>
        `;
    }

    // Animar las barras después de haberlas insertado
    const barras = document.querySelectorAll(".score-bar-fill");
    barras.forEach(barra => {
        const target = barra.getAttribute("data-target") || "0";
        barra.style.width = "0%";
        setTimeout(() => {
            barra.style.width = target + "%";
        }, 50);
    });

    // --------- Análisis por pregunta ---------
    document.getElementById("p1-resumen").innerText =
        "Habilidad detectada: " + data.p1.dominante;

    document.getElementById("p2-resumen").innerText =
        "Habilidad detectada: " + data.p2.dominante;

    document.getElementById("p3-resumen").innerText =
        "Habilidad detectada: " + data.p3.dominante;

    document.getElementById("p4-resumen").innerText =
        "Habilidad detectada: " + data.p4.dominante;

    document.getElementById("p5-resumen").innerText =
        "Habilidad detectada: " + data.p5.dominante;
});
