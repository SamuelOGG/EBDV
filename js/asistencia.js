// Manejador de música de fondo
function setupBackgroundMusic() {
  const backgroundMusic = document.getElementById('musica-fondo');
  if (!backgroundMusic) return;

  // Configurar el volumen a un nivel razonable
  backgroundMusic.volume = 0.5;
  
  // Intentar cargar el tiempo guardado
  const savedTime = localStorage.getItem('musica-fondo-time');
  if (savedTime && !isNaN(savedTime)) {
    backgroundMusic.currentTime = parseFloat(savedTime);
  }

  // Función para iniciar la música
  const iniciarMusica = () => {
    if (backgroundMusic.paused) {
      // Usar una promesa para manejar mejor el autoplay
      const playPromise = backgroundMusic.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Reproducción automática bloqueada. Esperando interacción del usuario...");
        });
      }
    }
  };

  // Intentar iniciar la música de inmediato
  iniciarMusica();

  // Configurar eventos para iniciar con interacción del usuario
  const startEvents = ['click', 'touchstart', 'keydown', 'mousedown'];
  const handleFirstInteraction = () => {
    iniciarMusica();
    // Remover todos los listeners después de la primera interacción exitosa
    startEvents.forEach(event => {
      document.removeEventListener(event, handleFirstInteraction);
    });
  };

  // Agregar listeners para la primera interacción
  startEvents.forEach(event => {
    document.addEventListener(event, handleFirstInteraction, { once: true });
  });

  // Guardar el tiempo de reproducción periódicamente
  setInterval(() => {
    if (!backgroundMusic.paused) {
      localStorage.setItem('musica-fondo-time', backgroundMusic.currentTime.toFixed(2));
    }
  }, 3000);

  // Manejar el evento de terminación de la canción para reiniciarla
  backgroundMusic.addEventListener('ended', () => {
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
  });
}

// Iniciar la configuración de la música cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', setupBackgroundMusic);

function volver() {
    window.location.href = "index.html";
  }
  
  function toggleMenu() {
    const menu = document.getElementById('menu-lateral');
    menu.classList.toggle('oculto');
  }
  
  // === Variables globales ===
  const sumandoSound = new Audio('../sonidos/sumando.mp3');
  let isPanning = false;
  let startX, startY;
  let offsetX = 0;
  let offsetY = 0;
  let scale = 0.5; // 🔍 Zoom inicial más lejano
  
  const ciudad = document.getElementById('ciudad');
  const scrollArea = document.querySelector('.ciudad-scroll');
  
  // 🧭 Centrar la ciudad al iniciar
  window.addEventListener('load', () => {
    const ciudadWidth = ciudad.clientWidth;
    const ciudadHeight = ciudad.clientHeight;
    const viewWidth = scrollArea.clientWidth;
    const viewHeight = scrollArea.clientHeight;
  
    offsetX = (viewWidth - ciudadWidth * scale) / 2;
    offsetY = (viewHeight - ciudadHeight * scale) / 2;
  
    applyTransform();
  });
  
  // === Movimiento tipo "pan" con clic derecho ===
  scrollArea.addEventListener('mousedown', function (e) {
    if (e.button === 2) {
      isPanning = true;
      scrollArea.style.cursor = "grabbing";
      startX = e.clientX - offsetX;
      startY = e.clientY - offsetY;
    }
  });
  
  scrollArea.addEventListener('mousemove', function (e) {
    if (!isPanning) return;
    e.preventDefault();
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    applyTransform();
  });
  
  scrollArea.addEventListener('mouseup', () => {
    isPanning = false;
    scrollArea.style.cursor = "grab";
  });
  
  scrollArea.addEventListener('mouseleave', () => {
    isPanning = false;
    scrollArea.style.cursor = "grab";
  });
  
  // === Zoom con scroll ===
  scrollArea.addEventListener('wheel', function (e) {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const oldScale = scale;
  
    if (e.deltaY < 0) {
      scale += zoomIntensity;
    } else {
      scale -= zoomIntensity;
    }
  
    // Calcular el mínimo scale para que la ciudad siempre cubra el viewport
    const minScaleX = scrollArea.clientWidth / ciudad.clientWidth;
    const minScaleY = scrollArea.clientHeight / ciudad.clientHeight;
    const minScale = Math.max(minScaleX, minScaleY); // Para cubrir todo el área
  
    scale = Math.max(minScale, Math.min(4, scale));
  
    // Zoom centrado
    const rect = scrollArea.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
  
    offsetX = (offsetX - mouseX) * (scale / oldScale) + mouseX;
    offsetY = (offsetY - mouseY) * (scale / oldScale) + mouseY;
  
    applyTransform();
  }, { passive: false });
  
  // === Aplicar transformación y límites
  function applyTransform() {
    const maxOffsetX = 0;
    const maxOffsetY = 0;
    const minOffsetX = scrollArea.clientWidth - ciudad.clientWidth * scale;
    const minOffsetY = scrollArea.clientHeight - ciudad.clientHeight * scale;
  
    offsetX = Math.min(maxOffsetX, Math.max(minOffsetX, offsetX));
    offsetY = Math.min(maxOffsetY, Math.max(minOffsetY, offsetY));
  
    ciudad.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }
  
  const nombres = [
    "angelitos",
    "corderitos",
    "amigos",
    "ciudadanos",
    "discipulos",
    "generacion",
    "mensajeros",
    "joyitas"
  ];
  
  nombres.forEach(nombre => {
    const img = document.createElement("img");
    img.src = `../imagenes/nombres/${nombre}.png`;
    img.className = "nombre-flotante";
    img.draggable = true;
    img.id = `nombre-${nombre}`;
  
    // Cargar posición guardada
    const pos = JSON.parse(localStorage.getItem(`pos-${nombre}`));
    if (pos) {
      img.style.left = pos.left;
      img.style.top = pos.top;
    } else {
      img.style.left = "100px";
      img.style.top = "100px";
    }
  
    ciudad.appendChild(img);
  });
  
  let nombresBloqueados = false;

  // --- Lógica de bloqueo de nombres ---
  const lockBtn = document.getElementById('lock-btn');

  lockBtn.addEventListener('click', () => {
    nombresBloqueados = !nombresBloqueados; // Invierte el estado

    if (nombresBloqueados) {
      lockBtn.innerHTML = '🔒'; // Cambia a candado cerrado
      lockBtn.title = 'Desbloquear Nombres';
      document.body.classList.add('nombres-bloqueados');
    } else {
      lockBtn.innerHTML = '🔓'; // Cambia a candado abierto
      lockBtn.title = 'Bloquear Nombres';
      document.body.classList.remove('nombres-bloqueados');
    }
  });

  
  // Mejor drag & drop individual para nombres flotantes
  function enableNombreDrag(nombreImg) {
    nombreImg.addEventListener('mousedown', function (e) {
      // El bloqueo solo afecta a los nombres, no a los grupos
      if (nombresBloqueados && !this.classList.contains('grupo-en-mapa')) return;
      if (e.button !== 0) return; // solo clic izquierdo
      e.preventDefault();
      const el = this;
      // Obtener la escala y el offset actuales
      const ciudadRect = ciudad.getBoundingClientRect();
      const scrollRect = scrollArea.getBoundingClientRect();
      // Calcula la escala actual a partir del style.transform
      let currentScale = scale;
      // Posición actual del nombre respecto a la ciudad (en px, sin escala)
      let startLeft = parseFloat(el.style.left) || 0;
      let startTop = parseFloat(el.style.top) || 0;
      // Posición inicial del mouse respecto al viewport
      let startMouseX = e.clientX;
      let startMouseY = e.clientY;
      let dragging = true;
  
      function moveAt(pageX, pageY) {
        // Diferencia del mouse
        let dx = (pageX - startMouseX) / currentScale;
        let dy = (pageY - startMouseY) / currentScale;
        // Nueva posición respecto a la ciudad
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;
        // Limita para que no se salga de la ciudad
        newLeft = Math.max(0, Math.min(newLeft, ciudad.clientWidth - el.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, ciudad.clientHeight - el.offsetHeight));
        el.style.left = newLeft + 'px';
        el.style.top = newTop + 'px';
      }
  
      function onMouseMove(e) {
        if (!dragging) return;
        moveAt(e.pageX, e.pageY);
      }
  
      // Maneja mouseup en cualquier parte del documento
      function onMouseUp(e) {
        dragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        el.onmouseup = null;
        // Guarda la posición y tipo para edificios o grupos
        let id = el.getAttribute('data-id') || el.id.replace("nombre-", "");
        let datos = {
          left: el.style.left,
          top: el.style.top
        };
        // Si es grupo del menú, guarda también tipo y rotación
        if (el.classList.contains('grupo-en-mapa')) {
          datos.rot = parseFloat(el.getAttribute('data-rot')) || 0;
          datos.ninas = el.querySelectorAll('img[src$="Niña.png"]').length;
          datos.ninos = el.querySelectorAll('img[src$="Niño.png"]').length;
        }
        localStorage.setItem(`pos-${id}`, JSON.stringify(datos));
      }
  
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
    nombreImg.ondragstart = () => false; // previene arrastre nativo
  }
  
  // === Grupos y menú lateral dinámico ===
  const menuLateral = document.getElementById('menu-lateral');
  const grupos = [
    { ninas: 10, ninos: 0, rep: 1 },
    { ninas: 0, ninos: 10, rep: 1 },
    { ninas: 5, ninos: 0, rep: 1 },
    { ninas: 0, ninos: 5, rep: 1 },
    { ninas: 3, ninos: 0, rep: 1 },
    { ninas: 0, ninos: 3, rep: 1 },
    { ninas: 2, ninos: 0, rep: 1 },
    { ninas: 0, ninos: 2, rep: 1 },
    { ninas: 1, ninos: 0, rep: 1 },
    { ninas: 0, ninos: 1, rep: 1 }
  ];
  function crearGrupoDrag(id, ninas, ninos) {
    // 1. Contenedor principal de la fila del menú
    const menuItem = document.createElement('div');
    menuItem.className = 'grupo-menu-item';

    // 2. El grupo de íconos que será arrastrable
    const grupoDraggable = document.createElement('div');
    grupoDraggable.className = 'grupo-flotante';
    grupoDraggable.setAttribute('data-id', id);
    grupoDraggable.setAttribute('draggable', 'true');

    const rotacionWrapper = document.createElement('div');
    rotacionWrapper.className = 'rotacion-wrapper';

    let content = '';
    for (let i = 0; i < ninas; i++) content += `<img src="../imagenes/Niña.png" alt="Niña" class="mini-nino">`;
    for (let i = 0; i < ninos; i++) content += `<img src="../imagenes/Niño.png" alt="Niño" class="mini-nino">`;
    rotacionWrapper.innerHTML = content;
    grupoDraggable.appendChild(rotacionWrapper);

    // 3. El contador numérico
    const contador = document.createElement('div');
    contador.className = 'contador-grupo';
    contador.textContent = `x${ninas + ninos}`;

    // 4. Ensamblar todo
    menuItem.appendChild(grupoDraggable);
    menuItem.appendChild(contador);

    // La función que habilita el arrastre se llamará sobre el grupo de íconos
    enableGrupoMenuDrag(grupoDraggable);

    return menuItem; // Devolvemos la fila completa para añadirla al menú
  }

  function enableGrupoMenuDrag(grupoDiv) {
    grupoDiv.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('text/plain', grupoDiv.getAttribute('data-id'));
      window._grupoDragInfo = grupoDiv.outerHTML;
    });
  }
  
  // Renderiza los grupos en el menú
  (function renderGruposMenu() {
    const contenedorGrupos = document.querySelector('#menu-lateral .grupos-disponibles');
    let id = 1;
    grupos.forEach(g => {
      for (let r = 0; r < g.rep; r++) {
        const menuItem = crearGrupoDrag('grupo-'+id, g.ninas, g.ninos);
        contenedorGrupos.appendChild(menuItem);
        id++;
      }
    });
  })();
  
  // Permitir soltar grupos en la ciudad
  const ciudadContainer = document.getElementById('ciudad');
  ciudadContainer.addEventListener('dragover', function(e) {
    e.preventDefault();
  });
  ciudadContainer.addEventListener('drop', function(e) {
    e.preventDefault();
    let html = window._grupoDragInfo;
    if (!html) return;
  
    // Detecta si el drop está sobre un edificio (nombre-flotante)
    const ciudadRect = ciudadContainer.getBoundingClientRect();
    const x = (e.clientX - ciudadRect.left) / scale;
    const y = (e.clientY - ciudadRect.top) / scale;
    let edificioTarget = null;
    document.querySelectorAll('.nombre-flotante:not(.grupo-en-mapa)').forEach(edif => {
      const rect = edif.getBoundingClientRect();
      if (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom
      ) {
        edificioTarget = edif;
      }
    });
  
    // Si es sobre edificio, animar entrada de niños
    if (edificioTarget) {
      // Clona imágenes y anímalas hacia el centro del edificio
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const grupoDiv = temp.firstChild;
  
      const imgs = Array.from(grupoDiv.querySelectorAll('img'));
      const ciudadScrollRect = document.querySelector('.ciudad-scroll').getBoundingClientRect();
      const centroEdificio = {
        x: edificioTarget.offsetLeft + edificioTarget.offsetWidth/2,
        y: edificioTarget.offsetTop + edificioTarget.offsetHeight/2
      };
      imgs.forEach((img, idx) => {
        const animImg = img.cloneNode();
        animImg.style.position = 'fixed';
        animImg.style.left = (e.clientX - ciudadScrollRect.left + idx*4) + 'px';
        animImg.style.top = (e.clientY - ciudadScrollRect.top + idx*4) + 'px';
        animImg.style.width = '32px';
        animImg.style.height = '32px';
        animImg.style.zIndex = 9999;
        animImg.style.transition = 'all 0.7s cubic-bezier(.37,1.39,.68,.97)';
        document.body.appendChild(animImg);
        setTimeout(() => {
          animImg.style.left = (ciudadScrollRect.left + centroEdificio.x - 16 + Math.random()*24-12) + 'px';
          animImg.style.top = (ciudadScrollRect.top + centroEdificio.y - 16 + Math.random()*24-12) + 'px';
          animImg.style.opacity = '0.2';
          animImg.style.transform = 'scale(0.6)';
        }, 10);
        setTimeout(() => {
          animImg.remove();
        }, 710);
      });
      // Espera animación, luego agrega el grupo invisible al edificio y actualiza contador
      setTimeout(() => {
        // Suma los niños/niñas de este grupo solo al edificio correspondiente
        if(!window._contadoresEdificio) window._contadoresEdificio = {};
        const idEdificio = edificioTarget.id || edificioTarget.getAttribute('data-id') || edificioTarget.src || edificioTarget;
        if(!window._contadoresEdificio[idEdificio]) window._contadoresEdificio[idEdificio] = {ninas:0, ninos:0};
        const temp2 = document.createElement('div');
        temp2.innerHTML = html;
        const grupoDiv2 = temp2.firstChild;
        const ninas = grupoDiv2.querySelectorAll('img[src$="Niña.png"]').length;
        const ninos = grupoDiv2.querySelectorAll('img[src$="Niño.png"]').length;
        window._contadoresEdificio[idEdificio].ninas += ninas;
        window._contadoresEdificio[idEdificio].ninos += ninos;
        sumandoSound.currentTime = 0;
        sumandoSound.play();
        actualizarContadores();
      }, 720);
      window._grupoDragInfo = null;
      return;
    }
  
    // Si no es sobre edificio, comportamiento normal
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const grupoDiv = temp.firstChild;
    grupoDiv.style.position = 'absolute';
    grupoDiv.style.left = x + 'px';
    grupoDiv.style.top = y + 'px';
    grupoDiv.classList.add('nombre-flotante');
    grupoDiv.classList.add('grupo-en-mapa');
    grupoDiv.classList.remove('grupo-flotante');
    grupoDiv.setAttribute('draggable', 'false');
    grupoDiv.setAttribute('data-id', 'grupo-' + Date.now());
    grupoDiv.setAttribute('data-rot', '0'); // ángulo inicial
    grupoDiv.style.transform = `rotate(0deg) scale(1.15)`;
    ciudadContainer.appendChild(grupoDiv);
    enableNombreDrag(grupoDiv);
    // Guardar posición, rotación y tipo
    localStorage.setItem('pos-' + grupoDiv.getAttribute('data-id'), JSON.stringify({
      left: grupoDiv.style.left,
      top: grupoDiv.style.top,
      rot: 0,
      ninas: grupoDiv.querySelectorAll('img[src$="Niña.png"]').length,
      ninos: grupoDiv.querySelectorAll('img[src$="Niño.png"]').length
    }));
    window._grupoDragInfo = null;
    actualizarContadores();
  });
  
  // --- Selección y rotación de grupos en el mapa ---
  let grupoSeleccionado = null;
  const rotarBtn = document.getElementById('rotar-btn');
  console.log('rotarBtn:', rotarBtn);
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente cargado');
  });
  
  // Al hacer clic en un grupo del mapa, lo selecciona (si no está en modo borrar)
  document.getElementById('ciudad').addEventListener('click', function(e) {
    if (modoBorrar) return;
    const grupo = e.target.closest('.grupo-en-mapa');
    if (grupo && this.contains(grupo)) {
      if (grupoSeleccionado) grupoSeleccionado.classList.remove('seleccionado-rotar');
      grupoSeleccionado = grupo;
      grupo.classList.add('seleccionado-rotar');
    } else {
      if (grupoSeleccionado) grupoSeleccionado.classList.remove('seleccionado-rotar');
      grupoSeleccionado = null;
    }
  });
  
  // Al hacer clic en el botón de rotar, rota el grupo seleccionado
  rotarBtn.addEventListener('click', function() {
    if (!grupoSeleccionado) {
      console.log("No hay grupo seleccionado");
      return;
    }
    console.log("Rotando grupo:", grupoSeleccionado);
    const rotacionWrapper = grupoSeleccionado.querySelector('.rotacion-wrapper');

    if (rotacionWrapper) {
      let angulo = parseFloat(grupoSeleccionado.getAttribute('data-rot')) || 0;
      angulo = (angulo + 10) % 360; // Rotación en incrementos más pequeños para mayor precisión
      grupoSeleccionado.setAttribute('data-rot', angulo);

      // Obtener la escala del elemento padre (manejado por interact.js)
      const transformPadre = grupoSeleccionado.style.transform;
      const matchEscala = transformPadre.match(/scale\(([^)]+)\)/);
      const escala = matchEscala ? matchEscala[0] : 'scale(1)'; // Usar scale(1) como fallback

      // Aplicar rotación y escala al wrapper para que no haya conflictos
      rotacionWrapper.style.transform = `rotate(${angulo}deg) ${escala}`;
    }
    // Guardar también la rotación junto con la posición
    const id = grupoSeleccionado.getAttribute('data-id');
    if (id) {
      localStorage.setItem('pos-' + id, JSON.stringify({
        left: grupoSeleccionado.style.left,
        top: grupoSeleccionado.style.top,
        rot: angulo,
        ninas: grupoSeleccionado.querySelectorAll('img[src$="Niña.png"]').length,
        ninos: grupoSeleccionado.querySelectorAll('img[src$="Niño.png"]').length
      }));
    }
  });
  
  // --- Modo borrar para grupos del mapa ---
  let modoBorrar = false;
  const borrarBtn = document.getElementById('borrar-btn');
  borrarBtn.addEventListener('click', () => {
    modoBorrar = !modoBorrar;
    borrarBtn.style.background = modoBorrar ? '#ff0033' : '';
    borrarBtn.style.color = modoBorrar ? 'white' : '';
    borrarBtn.title = modoBorrar ? 'Haz clic en un grupo para borrarlo' : 'Borrar grupo o niño(a) del mapa';
    // Deselecciona cualquier grupo al activar modo borrar
    if (grupoSeleccionado) grupoSeleccionado.classList.remove('seleccionado-rotar');
    grupoSeleccionado = null;
  });
  
  // Delegación: si está en modo borrar y se da clic a un grupo del mapa, lo elimina
  document.getElementById('ciudad').addEventListener('click', function(e) {
    if (!modoBorrar) return;
    const grupo = e.target.closest('.grupo-en-mapa');
    if (grupo && this.contains(grupo)) {
      // Elimina del DOM y del localStorage
      const id = grupo.getAttribute('data-id');
      if (id) localStorage.removeItem('pos-' + id);
      grupo.remove();
      actualizarContadores(); // Actualiza contadores después de borrar
    }
  });
  
  // --- Restaurar grupos del menú colocados en el mapa desde localStorage ---
  window.addEventListener('DOMContentLoaded', () => {
    // (Opcional) Limpia contadores temporales
    window._contadoresEdificio = {};
    actualizarContadores();
  });
  
  // --- Sistema de Sonidos ---
  function reproducirSonido(id) {
    const sonido = document.getElementById(id);
    if (sonido) {
      sonido.currentTime = 0;
      sonido.play().catch(e => console.error("Error al reproducir sonido:", e));
    }
  }
  
  // Asigna sonido de clic a todos los botones del HUD y flotantes
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.hud button, #toggle-contador-btn').forEach(boton => {
      boton.addEventListener('click', () => reproducirSonido('sonido-click'));
    });
  
    // Lógica botones pantalla ganador
    const pantallaGanador = document.getElementById('pantalla-ganador');
    document.getElementById('cerrar-ganador-btn').addEventListener('click', () => {
      reproducirSonido('sonido-click');
      pantallaGanador.classList.add('oculto');
      document.getElementById('confeti-contenedor').innerHTML = '';
    });
    document.getElementById('salir-menu-btn').addEventListener('click', () => {
      reproducirSonido('sonido-click');
      window.location.href = 'index.html';
    });
  });
  
  // --- Animación del Ganador ---
  document.getElementById('play-animacion-btn').addEventListener('click', () => {
    let ganador = null;
    let maxTotal = -1;
  
    if (window._contadoresEdificio) {
      Object.keys(window._contadoresEdificio).forEach(idEdificio => {
        const datos = window._contadoresEdificio[idEdificio];
        const total = datos.ninas + datos.ninos;
        if (total > maxTotal) {
          maxTotal = total;
          const edificioEl = document.querySelector(`[data-id='${idEdificio}']`) || document.getElementById(idEdificio);
          ganador = {
            imagenSrc: edificioEl ? edificioEl.src : '',
            total: total
          };
        }
      });
    }
  
    if (ganador && ganador.total > 0) {
      reproducirSonido('sonido-ganador');
      const pantalla = document.getElementById('pantalla-ganador');
      const nombreContenedor = document.getElementById('nombre-edificio-ganador');
      nombreContenedor.innerHTML = ''; // Limpiar contenido previo
      if (ganador.imagenSrc) {
        const imgGanador = document.createElement('img');
        imgGanador.src = ganador.imagenSrc;
        nombreContenedor.appendChild(imgGanador);
      }
      pantalla.classList.remove('oculto');
  
      const contadorEl = document.getElementById('contador-animado');
      let i = 0;
      const intervalo = setInterval(() => {
        contadorEl.textContent = i;
        if (i >= ganador.total) {
          clearInterval(intervalo);
          lanzarConfeti();
  
        }
        i++;
      }, 100);
    }
  });
  
  function lanzarConfeti() {
    // Reproducir sonido de confeti
    const confetiSound = document.getElementById('sonido-confeti');
    if (confetiSound) {
      confetiSound.currentTime = 0; // Reiniciar el sonido si ya está reproduciéndose
      confetiSound.play().catch(e => console.log("No se pudo reproducir el sonido de confeti:", e));
    }
    
    // Crear confeti
    const contenedor = document.getElementById('confeti-contenedor');
    for (let i = 0; i < 100; i++) {
      const confeti = document.createElement('div');
      confeti.style.position = 'absolute';
      confeti.style.width = `${Math.random() * 10 + 5}px`;
      confeti.style.height = confeti.style.width;
      confeti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
      confeti.style.left = `${Math.random() * 100}%`;
      confeti.style.top = `${-20}px`;
      confeti.style.animation = `caer ${Math.random() * 3 + 2}s linear forwards`;
      contenedor.appendChild(confeti);
    }
  }
  
  // Keyframes para la animación de caída
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `@keyframes caer { to { top: 105%; transform: rotate(${Math.random() * 720}deg); } }`;
  document.head.appendChild(styleSheet);
  
  // Aplica el nuevo drag & drop a todos los nombres flotantes
  setTimeout(() => {
    document.querySelectorAll('.nombre-flotante').forEach(enableNombreDrag);
    actualizarContadores();
    // Inicializa estado visible
    const cont = document.getElementById('contador-global');
    if(cont) cont.classList.add('contador-visible');
    const btn = document.getElementById('toggle-contador-btn');
    if(btn && cont) {
      btn.onclick = function() {
        if(cont.classList.contains('contador-visible')) {
          cont.classList.remove('contador-visible');
          cont.classList.add('contador-oculto');
        } else {
          cont.classList.remove('contador-oculto');
          cont.classList.add('contador-visible');
        }
      };
    }
  }, 0);
  
  // --- CONTADORES DE NIÑOS/NIÑAS POR EDIFICIO Y GLOBAL ---
  function actualizarContadores() {
    // Limpia contadores previos
    document.querySelectorAll('.contador-edificio').forEach(e => e.remove());
  
    // Prepara totales globales
    let totalNinas = 0, totalNinos = 0;
  
    // Si existen contadores temporales (por drops del menú), úsalos
    if (window._contadoresEdificio) {
      document.querySelectorAll('.nombre-flotante:not(.grupo-en-mapa)').forEach(edificio => {
        const idEdificio = edificio.id || edificio.getAttribute('data-id') || edificio.src || edificio;
        const datos = window._contadoresEdificio[idEdificio] || {ninas:0, ninos:0};
        totalNinas += datos.ninas;
        totalNinos += datos.ninos;
        // Crea y posiciona contador visual
        if (datos.ninas > 0 || datos.ninos > 0) {
          const contador = document.createElement('div');
          contador.className = 'contador-edificio';
          contador.style.position = 'absolute';
          contador.style.left = (edificio.offsetLeft + edificio.offsetWidth/2 - 60) + 'px';
          contador.style.top = (edificio.offsetTop - 66) + 'px';
          contador.style.width = '120px';
          contador.style.textAlign = 'center';
          contador.style.fontSize = '14px';
          contador.style.background = 'rgba(0,0,0,0.82)';
          contador.style.color = '#ffe066';
          contador.style.borderRadius = '10px';
          contador.style.border = '2px solid #ffe066';
          contador.style.padding = '7px 0 4px 0';
          contador.style.fontFamily = "'Press Start 2P', cursive";
          contador.style.boxShadow = '0 2px 16px #000a';
          contador.style.letterSpacing = '1px';
          contador.style.zIndex = 30;
          contador.innerHTML = `👧 <span class="nina-cnt">${datos.ninas}</span> &nbsp; 👦 <span class="nino-cnt">${datos.ninos}</span> <br><b>TOTAL: ${datos.ninas+datos.ninos}</b>`;
          edificio.parentNode.appendChild(contador);
  
          // Botones de restar al hacer clic
          contador.onclick = function(e) {
            e.stopPropagation();
            if (contador.querySelector('.btn-restar-nina') || contador.querySelector('.btn-restar-nino')) return;
            // Botón restar niña
            if (datos.ninas > 0) {
              const btnNina = document.createElement('button');
              btnNina.textContent = '-';
              btnNina.className = 'btn-restar-nina';
              btnNina.style.marginLeft = '4px';
              btnNina.style.background = '#ffbebe';
              btnNina.style.border = '1px solid #d33';
              btnNina.style.color = '#d33';
              btnNina.style.borderRadius = '4px';
              btnNina.style.cursor = 'pointer';
              btnNina.style.fontWeight = 'bold';
              btnNina.onclick = function(ev) {
                ev.stopPropagation();
                if(window._contadoresEdificio && window._contadoresEdificio[idEdificio] && window._contadoresEdificio[idEdificio].ninas > 0) {
                  window._contadoresEdificio[idEdificio].ninas--;
                  actualizarContadores();
                }
              };
              contador.querySelector('.nina-cnt').insertAdjacentElement('afterend', btnNina);
            }
            // Botón restar niño
            if (datos.ninos > 0) {
              const btnNino = document.createElement('button');
              btnNino.textContent = '-';
              btnNino.className = 'btn-restar-nino';
              btnNino.style.marginLeft = '4px';
              btnNino.style.background = '#bee7ff';
              btnNino.style.border = '1px solid #339';
              btnNino.style.color = '#339';
              btnNino.style.borderRadius = '4px';
              btnNino.style.cursor = 'pointer';
              btnNino.style.fontWeight = 'bold';
              btnNino.onclick = function(ev) {
                ev.stopPropagation();
                if(window._contadoresEdificio && window._contadoresEdificio[idEdificio] && window._contadoresEdificio[idEdificio].ninos > 0) {
                  window._contadoresEdificio[idEdificio].ninos--;
                  actualizarContadores();
                }
              };
              contador.querySelector('.nino-cnt').insertAdjacentElement('afterend', btnNino);
            }
            // Cierra los botones al hacer clic fuera
            document.addEventListener('mousedown', function cerrarBtns(ev) {
              if (!contador.contains(ev.target)) {
                contador.querySelectorAll('.btn-restar-nina, .btn-restar-nino').forEach(btn => btn.remove());
                document.removeEventListener('mousedown', cerrarBtns);
              }
            });
          };
        }
      });
    } else {
      // Modo clásico: por superposición visual
      document.querySelectorAll('.nombre-flotante:not(.grupo-en-mapa)').forEach(edificio => {
        const rectEdificio = edificio.getBoundingClientRect();
        let ninas = 0, ninos = 0;
        document.querySelectorAll('.grupo-en-mapa').forEach(grupo => {
          const rectGrupo = grupo.getBoundingClientRect();
          if (
            rectGrupo.left < rectEdificio.right &&
            rectGrupo.right > rectEdificio.left &&
            rectGrupo.top < rectEdificio.bottom &&
            rectGrupo.bottom > rectEdificio.top
          ) {
            ninas += grupo.querySelectorAll('img[src$="Niña.png"]').length;
            ninos += grupo.querySelectorAll('img[src$="Niño.png"]').length;
          }
        });
        totalNinas += ninas;
        totalNinos += ninos;
        if (ninas > 0 || ninos > 0) {
          const contador = document.createElement('div');
          contador.className = 'contador-edificio';
          contador.style.position = 'absolute';
          contador.style.left = (edificio.offsetLeft + edificio.offsetWidth/2 - 60) + 'px';
          contador.style.top = (edificio.offsetTop - 66) + 'px';
          contador.style.width = '120px';
          contador.style.textAlign = 'center';
          contador.style.fontSize = '15px';
          contador.style.background = 'rgba(0,0,0,0.85)';
          contador.style.color = '#fff';
          contador.style.borderRadius = '10px';
          contador.style.border = '2px solid #ffe066';
          contador.style.padding = '4px 0 2px 0';
          contador.style.zIndex = 30;
          contador.innerHTML = `👧 ${ninas} &nbsp; 👦 ${ninos} <br><b>TOTAL: ${ninas+ninos}</b>`;
          edificio.parentNode.appendChild(contador);
        }
      });
    }
  
    // Actualiza el contador global
    const global = document.getElementById('contador-global');
    global.innerHTML = ` Niñas: <b>${totalNinas}</b> &nbsp;&nbsp; Niños: <b>${totalNinos}</b><br><b>Total: ${totalNinas+totalNinos}</b>`;
  }
  
  // Llama actualizarContadores en eventos importantes
  ['mouseup','touchend'].forEach(ev=>{
    document.addEventListener(ev, ()=>setTimeout(actualizarContadores, 50));
  });

  window.addEventListener('DOMContentLoaded', ()=>setTimeout(actualizarContadores,200));