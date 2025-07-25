document.addEventListener('DOMContentLoaded', () => {
  // Drag & Drop para opciones del menú y publicaciones
  let draggedOption = null;

  document.querySelectorAll('.draggable-option').forEach(option => {
    option.addEventListener('dragstart', (e) => {
      draggedOption = option;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => option.classList.add('dragging'), 0);
    });
    option.addEventListener('dragend', () => {
      draggedOption = null;
      option.classList.remove('dragging');
    });
  });

  // Utilidad para obtener un ID único para cada dropzone
  function getDropzoneId(zone) {
    // Si no tiene ID, asignamos uno por data-index (o generamos uno único)
    if (!zone.dataset.dropzoneId) {
      zone.dataset.dropzoneId = 'dropzone-' + Array.from(document.querySelectorAll('.dropzone')).indexOf(zone);
    }
    return zone.dataset.dropzoneId;
  }

  // Actualizar el contador de invitados de una publicación
  function updatePostCounter(zone) {
    const post = zone.closest('.post-wrapper');
    if (!post) return;

    const counterValue = post.querySelector('.counter-value');
    if (!counterValue) return;

    let total = 0;
    const droppedOptions = zone.querySelectorAll('.dropped-option');
    droppedOptions.forEach(option => {
      const cantidad = parseInt(option.dataset.cantidad, 10) || 0;
      total += cantidad;
    });

    counterValue.textContent = total;
  }

  // Guardar el estado de una dropzone en localStorage
  function saveDropzone(zone) {
    const id = getDropzoneId(zone);
    const row = zone.querySelector('.dropped-options-row');
    if (row && row.children.length > 0) {
      const options = Array.from(row.children).map(opt => ({
        img: opt.querySelector('img')?.src,
        cantidad: opt.dataset.cantidad,
        texto: opt.querySelector('.cantidad')?.textContent || ''
      }));
      localStorage.setItem(id, JSON.stringify(options));
    } else {
      localStorage.removeItem(id);
    }
    updatePostCounter(zone);
  }

  // Restaurar el estado de una dropzone desde localStorage
  function restoreDropzone(zone) {
    const id = getDropzoneId(zone);
    const data = localStorage.getItem(id);
    if (data) {
      let row = zone.querySelector('.dropped-options-row');
      if (!row) {
        row = document.createElement('div');
        row.className = 'dropped-options-row';
        zone.appendChild(row);
      }
      row.innerHTML = '';
      const options = JSON.parse(data);
      options.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'dropped-option';
        div.setAttribute('draggable', 'false');
        div.dataset.cantidad = opt.cantidad;
        div.innerHTML = `<div class="icons-row"><img src="${opt.img}"></div> <span class="cantidad">${opt.texto}</span>`;
        row.appendChild(div);
      });
    }
    updatePostCounter(zone);
  }

  // Drag & Drop y persistencia
  document.querySelectorAll('.dropzone').forEach(zone => {
    restoreDropzone(zone);
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('droppable');
    });
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('droppable');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('droppable');
      if (draggedOption) {
        let row = zone.querySelector('.dropped-options-row');
        if (!row) {
          row = document.createElement('div');
          row.className = 'dropped-options-row';
          zone.appendChild(row);
        }
        const clone = draggedOption.cloneNode(true);
        clone.classList.remove('draggable-option');
        clone.classList.add('dropped-option');
        clone.setAttribute('draggable', 'false');
        row.appendChild(clone);
        saveDropzone(zone);
      }
    });
    // Opcional: podrías agregar botón para eliminar opciones y actualizar localStorage
    zone.addEventListener('click', (e) => {
      if (e.target.classList.contains('dropped-option') || e.target.closest('.dropped-option')) {
        const option = e.target.closest('.dropped-option');
        option.remove();
        saveDropzone(zone);
      }
    });
  });

  // Menú lateral
  const menuBtn = document.getElementById('menu-btn');
  const sideMenu = document.getElementById('side-menu');
  const closeMenu = document.getElementById('close-menu');

  if (menuBtn && sideMenu && closeMenu) {
    menuBtn.addEventListener('click', () => {
      sideMenu.classList.add('open');
    });
    closeMenu.addEventListener('click', () => {
      sideMenu.classList.remove('open');
    });
    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
      if (sideMenu.classList.contains('open') && !sideMenu.contains(e.target) && e.target !== menuBtn) {
        sideMenu.classList.remove('open');
      }
    });
  }


  // Botón para limpiar todos los emojis de todas las publicaciones
  const refreshBtn = document.getElementById('refresh-emojis');
  const confirmModal = document.getElementById('confirm-remove-emojis-modal');
  const confirmAccept = document.getElementById('confirm-remove-emojis-accept');
  const confirmCancel = document.getElementById('confirm-remove-emojis-cancel');

  if (refreshBtn && confirmModal && confirmAccept && confirmCancel) {
    refreshBtn.addEventListener('click', () => {
      confirmModal.classList.add('visible');
    });

    confirmAccept.addEventListener('click', () => {
      document.querySelectorAll('.dropzone').forEach(zone => {
        // Remover visualmente
        const row = zone.querySelector('.dropped-options-row');
        if (row) row.remove();
        // Borrar de localStorage
        const id = zone.dataset.dropzoneId || ('dropzone-' + Array.from(document.querySelectorAll('.dropzone')).indexOf(zone));
        localStorage.removeItem(id);
        updatePostCounter(zone);
      });
      confirmModal.classList.remove('visible');
    });

    confirmCancel.addEventListener('click', () => {
      confirmModal.classList.remove('visible');
    });

    // Cerrar modal si se hace click fuera del contenido
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        confirmModal.classList.remove('visible');
      }
    });
  }

  // --- Lógica de la Pantalla del Ganador ---
  const showWinnerBtn = document.getElementById('show-winner-btn');
  const winnerScreen = document.getElementById('winner-screen');
  const closeWinnerBtn = document.getElementById('close-winner-btn');
  const winnerImage = document.getElementById('winner-image');
  const winnerScore = document.getElementById('winner-score');
  const confettiContainer = document.getElementById('confetti-container');
  const confettiSound = document.getElementById('confetti-sound');
  const winnerSound = document.getElementById('winner-sound');

  if (showWinnerBtn) {
    showWinnerBtn.addEventListener('click', announceWinner);
  }

  if (closeWinnerBtn) {
    closeWinnerBtn.addEventListener('click', hideWinnerScreen);
  }

  function announceWinner() {
    let maxScore = -1;
    let winnerTeam = null;

    document.querySelectorAll('.post-wrapper').forEach(wrapper => {
      // Selector corregido para apuntar directamente al valor del contador
      const counterValue = wrapper.querySelector('.counter-value');
      if (!counterValue) return;

      const scoreText = counterValue.textContent;
      const currentScore = parseInt(scoreText, 10) || 0;
      
      if (currentScore > maxScore) {
        maxScore = currentScore;
        // Selector corregido para obtener el nombre del usuario (equipo)
        const title = wrapper.querySelector('.user-name').textContent.trim();
        // Busca un nombre de imagen personalizado en el data-attribute; si no existe, usa el título.
        const imageName = wrapper.dataset.imageName || title;

        winnerTeam = {
          name: title,
          score: currentScore,
          image: `imagenes/nombres/${imageName}.png`
        };
      }
    });

    if (winnerTeam && winnerTeam.score > 0) {
      winnerImage.src = winnerTeam.image;
      winnerScore.textContent = winnerTeam.score;
      winnerScreen.classList.add('visible');
      
      winnerSound.currentTime = 0;
      winnerSound.play();
      
      confettiSound.currentTime = 0;
      confettiSound.play();
      
      createConfetti();
    } else {
      alert('¡Aún no hay invitados! Arrastra algunos emojis para empezar.');
    }
  }

  function hideWinnerScreen() {
    winnerScreen.classList.remove('visible');
    confettiContainer.innerHTML = ''; // Limpiar confeti
    winnerSound.pause();
    confettiSound.pause();
  }

  function createConfetti() {
    confettiContainer.innerHTML = '';
    const confettiCount = 150;
    const colors = ['#ff00ff', '#00f7ff', '#ffd700', '#00ff00', '#ff5733'];

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti');
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = `${Math.random() * 2}s`;
      confetti.style.width = `${Math.floor(Math.random() * 10) + 5}px`;
      confetti.style.height = confetti.style.width;
      confettiContainer.appendChild(confetti);
    }
  }
});