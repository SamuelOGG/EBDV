// Constante para el retardo del sonido de monedas (en milisegundos)
const SOUND_DELAY_MS = 3500; // 1000ms = 1 segundo de retardo

document.addEventListener('DOMContentLoaded', () => {
    // --- Solución sonido doble en pantalla completa ---
    document.addEventListener('fullscreenchange', () => {
        // Detener sonidos de moneda y vaciar la cola
        if (typeof coinSoundQueue !== 'undefined') coinSoundQueue.length = 0;
        if (typeof coinSoundPlaying !== 'undefined') coinSoundPlaying = false;
        // Opcional: Suspender el contexto de audio para evitar dobles
        if (typeof audioContext !== 'undefined' && audioContext.state === 'running') {
            audioContext.suspend();
            setTimeout(() => {
                audioContext.resume();
            }, 300); // Pequeña pausa para evitar solapamiento
        }
    });
    // --- Animación de nubes ---
    const clouds = [
        document.querySelector('.cloud1'),
        document.querySelector('.cloud2'),
        document.querySelector('.cloud3'),
        document.querySelector('.cloud4'),
        document.querySelector('.cloud5'),
        document.querySelector('.cloud6'),
        document.querySelector('.cloud7')
    ];
    // Valores iniciales y velocidad aleatoria para cada nube
    const cloudStates = clouds.map((cloud, i) => ({
        elem: cloud,
        left: parseFloat(getComputedStyle(cloud).left),
        top: parseFloat(getComputedStyle(cloud).top),
        width: parseFloat(getComputedStyle(cloud).width),
        speed: 0.15 + Math.random() * 0.1 + i * 0.03 // Diferente velocidad para cada nube
    }));
    function animateClouds() {
        const vw = window.innerWidth;
        cloudStates.forEach(state => {
            state.left += state.speed;
            if (state.left > vw) {
                state.left = -state.width - 20; // Reinicia fuera de pantalla izquierda
            }
            state.elem.style.left = state.left + 'px';
        });
        requestAnimationFrame(animateClouds);
    }
    // Convertir % inicial a px si es necesario
    cloudStates.forEach(state => {
        if (String(state.left).includes('%')) {
            // Si left está en %, convertir a px
            const percent = parseFloat(state.left);
            state.left = vw * percent / 100;
            state.elem.style.left = state.left + 'px';
        }
    });
    animateClouds();

    // --- Sonidos de la pantalla de ganador ---
    let confetiAudio = document.getElementById('confeti-audio');
    if (!confetiAudio) {
        confetiAudio = document.createElement('audio');
        confetiAudio.id = 'confeti-audio';
        confetiAudio.src = 'sonidos/confeti.mp3';
        confetiAudio.preload = 'auto';
        document.body.appendChild(confetiAudio);
    }
    let ganadorAudio = document.getElementById('ganador-audio');
    if (!ganadorAudio) {
        ganadorAudio = document.createElement('audio');
        ganadorAudio.id = 'ganador-audio';
        ganadorAudio.src = 'sonidos/ganador.mp3';
        ganadorAudio.preload = 'auto';
        document.body.appendChild(ganadorAudio);
    }
    // --- Elementos del DOM ---
    const startButton = document.getElementById('start-button');
    const roadContainer = document.querySelector('.road-container');
    const settingsButton = document.getElementById('settings-button');
    const homeBtn = document.getElementById('home-btn');

    // --- Sonidos para botones ---
    const hoverSound = new Audio('sonidos/hover.mp3');
    const clickSound = new Audio('sonidos/click.mp3');
    [startButton, homeBtn, settingsButton].forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            hoverSound.currentTime = 0;
            hoverSound.play();
        });
        btn.addEventListener('click', () => {
            clickSound.currentTime = 0;
            clickSound.play();
        });
    });
    const coches = [document.getElementById('coche1'), document.getElementById('coche2')];
    const coins = Array.from(document.querySelectorAll('.coin'));
    const settingsModal = document.getElementById('settings-modal');
    const saveSettingsButton = document.getElementById('save-settings');
    const puntosNiñoInput = document.getElementById('puntos-niño');
    const puntosNiñaInput = document.getElementById('puntos-niña');
    const scoreNiñoElement = document.getElementById('score-niño');
    const scoreNiñaElement = document.getElementById('score-niña');
    const timerElement = document.getElementById('timer');
    const winnerModal = document.getElementById('winner-modal');
    const podiumTitle = document.getElementById('podium-title');
    const podiumFirstName = document.getElementById('podium-first-name');
    const podiumFirstScore = document.getElementById('podium-first-score');
    const podiumFirstImg = document.getElementById('podium-first-img');
    const podiumSecondName = document.getElementById('podium-second-name');
    const podiumSecondScore = document.getElementById('podium-second-score');
    const podiumSecondImg = document.getElementById('podium-second-img');
    const restartGameButton = document.getElementById('restart-game');
    const exitToMenuBtn = document.getElementById('exit-to-menu-btn');
    const confettiContainer = document.querySelector('.confetti-container');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownElement = document.getElementById('countdown');

    // --- Configuración del Juego ---
    let gameRunning = false;
    let gameOver = false;
    let scores = { niño: 0, niña: 0 };
    let pointsPerCoin = { niño: 10, niña: 10 };
    let posCoches = [35, 55];
    const limitesCoches = [{ min: 33, max: 37 }, { min: 53, max: 57 }];
    const laneCenters = [20, 75];
    const coinSpeed = 4;
    const spawnInterval = 20;
    let gameTimer;
    let timeLeft;

    // --- Estado de las Monedas ---
    const coinStates = coins.map((coin, index) => ({
        element: coin,
        active: false,
        top: 0,
        scale: 0.1,
        lane: laneCenters[index % laneCenters.length]
    }));

    // --- Cargar, Guardar y Resetear ---
    function loadSettings() {
        const savedPoints = localStorage.getItem('pointsPerCoin');
        if (savedPoints) {
            pointsPerCoin = JSON.parse(savedPoints);
        }
        puntosNiñoInput.value = pointsPerCoin.niño;
        puntosNiñaInput.value = pointsPerCoin.niña;
        setupTimer();
    }

    function saveSettings() {
        pointsPerCoin.niño = parseInt(puntosNiñoInput.value) || 10;
        pointsPerCoin.niña = parseInt(puntosNiñaInput.value) || 10;
        localStorage.setItem('pointsPerCoin', JSON.stringify(pointsPerCoin));
        settingsModal.style.display = 'none';
        resetGame();
    }

    function resetGame() {
        gameRunning = false;
        gameOver = false;
        scores = { niño: 0, niña: 0 };
        posCoches = [35, 55];
        coches[0].style.left = `${posCoches[0]}%`;
        coches[1].style.left = `${posCoches[1]}%`;
        coinStates.forEach(c => { c.active = false; c.element.style.display = 'none'; });
        startButton.innerHTML = '&#9654;';
        winnerModal.style.display = 'none';
        countdownOverlay.style.display = 'none'; // Asegurarse de que el contador esté oculto
        if (roadContainer) roadContainer.classList.remove('road-anim-running');
        toggleCarSound(false); // Asegurarse de que el sonido del motor esté detenido
        // Detener sonidos de ganador y confeti si están sonando
        try {
            const confetiAudio = document.getElementById('confeti-audio');
            const ganadorAudio = document.getElementById('ganador-audio');
            if (confetiAudio) {
                confetiAudio.pause();
                confetiAudio.currentTime = 0;
            }
            if (ganadorAudio) {
                ganadorAudio.pause();
                ganadorAudio.currentTime = 0;
            }
        } catch (e) { console.warn('No se pudo detener algún sonido de ganador/confeti:', e); }
        updateScores();
        setupTimer();
        // Reanudar el contexto de audio si está suspendido (para que el sonido de monedas funcione tras reiniciar)
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('AudioContext reanudado tras reiniciar');
            });
        }
    }

    function updateScores() {
        scoreNiñoElement.textContent = scores.niño;
        scoreNiñaElement.textContent = scores.niña;
    }

    // --- Lógica del Temporizador y Fin de Juego ---
    function setupTimer() {
        clearInterval(gameTimer);
        // --- DURACIÓN DEL JUEGO EN SEGUNDOS ---
        timeLeft = 30; // Cambia este valor para ajustar la duración
        // ------------------------------------
        updateTimerDisplay();
    }

    function startTimer() {
        gameTimer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const seconds = (timeLeft % 60).toString().padStart(2, '0');
        timerElement.textContent = `${minutes}:${seconds}`;
    }

    function endGame() {
        gameRunning = false;
        gameOver = true;
        clearInterval(gameTimer);

        let winner, loser;

        // Determinar ganador basado en la CONFIGURACIÓN de puntos
        const niñoTarget = pointsPerCoin.niño;
        const niñaTarget = pointsPerCoin.niña;

        if (niñoTarget > niñaTarget) {
            winner = { name: '¡Los Niños!', score: niñoTarget, img: 'imagenes/GanadorNiños.png' };
            loser = { name: '¡Las Niñas!', score: niñaTarget, img: 'imagenes/GanadorNiñas.png' };
        } else if (niñaTarget > niñoTarget) {
            winner = { name: '¡Las Niñas!', score: niñaTarget, img: 'imagenes/GanadorNiñas.png' };
            loser = { name: '¡Los Niños!', score: niñoTarget, img: 'imagenes/GanadorNiños.png' };
        } else {
            // En caso de empate en la configuración, declaramos a las niñas ganadoras por defecto.
            winner = { name: '¡Las Niñas!', score: niñaTarget, img: 'imagenes/GanadorNiñas.png' };
            loser = { name: '¡Los Niños!', score: niñoTarget, img: 'imagenes/GanadorNiños.png' };
        }

        showPodium(winner, loser);
    }

    function showPodium(winner, loser) {
    // Detener sonidos de monedas y autos
    try {
        toggleCarSound(false); // Detener autosonido.mp3 (motor)
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.suspend(); // Detener todos los sonidos activos (sumando.mp3)
        }
    } catch (e) { console.warn('No se pudo detener algún sonido:', e); }
    // Reproducir sonidos de ganador y confeti
    try {
        const confetiAudio = document.getElementById('confeti-audio');
        const ganadorAudio = document.getElementById('ganador-audio');
        if (confetiAudio) {
            confetiAudio.currentTime = 0;
            confetiAudio.play();
        }
        if (ganadorAudio) {
            ganadorAudio.currentTime = 0;
            ganadorAudio.play();
        }
    } catch (e) { console.warn('No se pudo reproducir algún sonido de victoria:', e); }
    // Detener sonidos de monedas y autos
    try {
        toggleCarSound(false); // Detener autosonido.mp3 (motor)
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.suspend(); // Detener todos los sonidos activos (sumando.mp3)
        }
    } catch (e) { console.warn('No se pudo detener algún sonido:', e); }
        const firstPlace = document.getElementById('podium-first');
        const secondPlace = document.getElementById('podium-second');

        // Limpiar clases de color anteriores
        firstPlace.classList.remove('podium-style-niños', 'podium-style-niñas');
        secondPlace.classList.remove('podium-style-niños', 'podium-style-niñas');

        // Asignar contenido
        podiumTitle.textContent = `El ganador es: ${winner.name}`;
        podiumFirstName.textContent = winner.name;
        podiumFirstScore.textContent = `Ofrenda: $${winner.score}`;
        podiumFirstImg.src = winner.img;

        podiumSecondName.textContent = loser.name;
        podiumSecondScore.textContent = `Ofrenda: $${loser.score}`;
        podiumSecondImg.src = loser.img;

        // Asignar clases de color dinámicamente
        if (winner.name === '¡Los Niños!') {
            firstPlace.classList.add('podium-style-niños');
            secondPlace.classList.add('podium-style-niñas');
        } else {
            firstPlace.classList.add('podium-style-niñas');
            secondPlace.classList.add('podium-style-niños');
        }

        winnerModal.style.display = 'flex';
        launchConfetti();
    }

    function launchConfetti() {
        confettiContainer.innerHTML = ''; // Limpia confeti anterior
        const confettiCount = 150;
        const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff69b4', '#7fffd4', '#fdda24', '#ff4d4d'];

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            const color = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.setProperty('--color', color);
            confetti.style.left = Math.random() * 100 + 'vw';
            // Empieza un poco por encima para que la caída sea natural
            confetti.style.top = -20 - Math.random() * 20 + 'px'; 
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = 2 + Math.random() * 3 + 's';
            confettiContainer.appendChild(confetti);
        }
    }

    // --- Lógica del Juego Principal ---
    function startRaceCountdown() {
        countdownOverlay.style.display = 'flex';
        let count = 3;

        countdownElement.textContent = count;
        countdownElement.style.animation = 'none';
        void countdownElement.offsetWidth;
        countdownElement.style.animation = 'countdown-zoom 1s ease-in-out';

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownElement.textContent = count;
                countdownElement.style.animation = 'none';
                void countdownElement.offsetWidth;
                countdownElement.style.animation = 'countdown-zoom 1s ease-in-out';
            } else if (count === 0) {
                countdownElement.textContent = '¡GO!';
                countdownElement.style.animation = 'none';
                void countdownElement.offsetWidth;
                countdownElement.style.animation = 'countdown-zoom 1s ease-in-out';
            } else {
                clearInterval(countdownInterval);
                setTimeout(() => {
                    countdownOverlay.style.display = 'none';
                    gameRunning = true;
                    startButton.innerHTML = '&#10074;&#10074;';
                    if (roadContainer) roadContainer.classList.add('road-anim-running');
                    toggleCarSound(true); // Iniciar sonido del motor al comenzar la carrera
                    startTimer();
                    gameLoop();
                }, 500);
            }
        }, 1000);
    }

    function toggleGame() {
        if (gameOver) {
            resetGame();
            return;
        }

        if (!gameRunning) {
            try {
                const enSusMarcasSound = document.getElementById('en-sus-marcas-sound');
                if (enSusMarcasSound) {
                    enSusMarcasSound.currentTime = 0;
                    enSusMarcasSound.play();
                }
            } catch (e) { console.warn("No se pudo reproducir 'En sus marcas':", e); }
            startRaceCountdown();
        } else {
            gameRunning = false;
            startButton.innerHTML = '&#9654;';
            if (roadContainer) roadContainer.classList.remove('road-anim-running');
            clearInterval(gameTimer);
            toggleCarSound(false); // Detener sonido del motor al pausar
        }
    }

    function moveCars(event) {
        if (!gameRunning) return;
        if (event.key === 'a' && posCoches[0] > limitesCoches[0].min) posCoches[0] -= 0.5;
        else if (event.key === 'd' && posCoches[0] < limitesCoches[0].max) posCoches[0] += 0.5;
        if (event.key === 'ArrowLeft' && posCoches[1] > limitesCoches[1].min) posCoches[1] -= 0.5;
        else if (event.key === 'ArrowRight' && posCoches[1] < limitesCoches[1].max) posCoches[1] += 0.5;
        coches[0].style.left = `${posCoches[0]}%`;
        coches[1].style.left = `${posCoches[1]}%`;
    }

    function moveCoins() {
        coinStates.forEach(state => {
            if (state.active) {
                state.top += coinSpeed;
                state.scale = 0.1 + (state.top / window.innerHeight) * 0.9;
                state.element.style.transform = `translateY(${state.top}px) scale(${state.scale})`;
                state.element.style.left = `${state.lane}%`;
                if (state.top > window.innerHeight) {
                    state.active = false;
                    state.element.style.display = 'none';
                }
            }
        });
    }

    function checkCollision() {
        coinStates.forEach(state => {
            if (state.active) {
                const coinRect = state.element.getBoundingClientRect();
                const carIndex = state.lane < 50 ? 0 : 1;
                const carRect = coches[carIndex].getBoundingClientRect();
                if (coinRect.bottom > carRect.top && coinRect.top < carRect.bottom &&
                    coinRect.right > carRect.left && coinRect.left < carRect.right) {
                    state.active = false;
                    state.element.style.display = 'none';
                    if (carIndex === 0) scores.niño += pointsPerCoin.niño;
                    else scores.niña += pointsPerCoin.niña;
                    updateScores();
                    playCoinSound(); // Reproducir sonido de moneda al recolectar
                }
            }
        });
    }

    let spawnCounter = 0;
    function spawnCoin() {
        spawnCounter++;
        if (spawnCounter < spawnInterval) return;
        spawnCounter = 0;
        const inactiveCoin = coinStates.find(c => !c.active);
        if (inactiveCoin) {
            inactiveCoin.active = true;
            inactiveCoin.top = -50;
            inactiveCoin.scale = 0.1;
            inactiveCoin.element.style.display = 'block';
            // Reproducir sonido cuando aparece una nueva moneda
            playCoinSound();
        }
    }

    function animateCars() {
        const time = Date.now() / 1000; // Usar el tiempo para una animación suave

        // Animar coche 1 (Niño)
        const range1 = limitesCoches[0].max - limitesCoches[0].min;
        const center1 = (limitesCoches[0].max + limitesCoches[0].min) / 2;
        const newPos1 = center1 + (range1 / 2) * Math.sin(time * 1.5); // Movimiento suave
        coches[0].style.left = `${newPos1}%`;

        // Animar coche 2 (Niña)
        const range2 = limitesCoches[1].max - limitesCoches[1].min;
        const center2 = (limitesCoches[1].max + limitesCoches[1].min) / 2;
        // Usar una frecuencia ligeramente diferente para que no se muevan idénticos
        const newPos2 = center2 + (range2 / 2) * Math.sin(time * 1.7 + 0.5);
        coches[1].style.left = `${newPos2}%`;
    }

    function gameLoop() {
        if (!gameRunning) return;
        spawnCoin();
        moveCoins();
        checkCollision();
        animateCars(); // Añadir la animación de los coches en cada frame
        requestAnimationFrame(gameLoop);
    }

    // --- Event Listeners ---
    startButton.addEventListener('click', toggleGame);
    settingsButton.addEventListener('click', () => {
        if (gameRunning) toggleGame();
        settingsModal.style.display = 'flex';
    });
    saveSettingsButton.addEventListener('click', saveSettings);
    homeBtn.addEventListener('click', () => {
        window.location.href = 'index.html'; // Redirige al menú principal
    });
    restartGameButton.addEventListener('click', resetGame);
    exitToMenuBtn.addEventListener('click', () => {
        window.location.href = 'index.html'; // Redirige al menú principal
    });
    window.addEventListener('keydown', moveCars);

    // --- Sistema de sonidos ---
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let coinSoundBuffer = null;
    
    // Precargar sonidos
    async function loadSounds() {
        try {
            // Precargar sonido de moneda
            const response = await fetch('sonidos/sumando.mp3');
            const arrayBuffer = await response.arrayBuffer();
            coinSoundBuffer = await audioContext.decodeAudioData(arrayBuffer);
            console.log("Sonido de moneda cargado correctamente");
        } catch (error) {
            console.error("Error al cargar sonidos:", error);
        }
    }
    
    let coinSoundQueue = [];
    let coinSoundPlaying = false;

    function playCoinSound() {
        if (!coinSoundBuffer) {
            console.log("El buffer de sonido no está cargado aún");
            return;
        }
        // Agregar a la cola
        coinSoundQueue.push({});
        processCoinSoundQueue();
    }

    function processCoinSoundQueue() {
        if (coinSoundPlaying || coinSoundQueue.length === 0) return;
        coinSoundPlaying = true;
        setTimeout(() => {
            try {
                const source = audioContext.createBufferSource();
                source.buffer = coinSoundBuffer;
                source.connect(audioContext.destination);
                source.start(0);
                source.onended = () => {
                    coinSoundPlaying = false;
                    coinSoundQueue.shift();
                    processCoinSoundQueue();
                };
                console.log(`Reproduciendo sonido de moneda (con retardo de ${SOUND_DELAY_MS}ms)`);
            } catch (error) {
                console.error("Error al reproducir sonido de moneda:", error);
                coinSoundPlaying = false;
                coinSoundQueue.shift();
                processCoinSoundQueue();
            }
        }, SOUND_DELAY_MS);
    }
    
    // Elementos de audio del DOM (para compatibilidad con móviles)
    const backgroundMusic = document.getElementById('background-music');
    const carSound = document.getElementById('car-sound');
    
    // Configurar volumen por defecto
    backgroundMusic.volume = 0.5;  // 50% de volumen para la música de fondo
    carSound.volume = 0.3;         // 30% de volumen para el sonido del motor
    
    // Intentar reproducir la música al cargar la página
    function startBackgroundMusic() {
        // Los navegadores móviles requieren interacción del usuario para reproducir audio
        const playPromise = backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("La reproducción automática fue prevenida. La música se reproducirá después de la interacción del usuario.");
                // Configurar para reproducir en el primer clic
                const playOnInteraction = () => {
                    backgroundMusic.play();
                    document.removeEventListener('click', playOnInteraction);
                    document.removeEventListener('keydown', playOnInteraction);
                };
                document.addEventListener('click', playOnInteraction);
                document.addEventListener('keydown', playOnInteraction);
            });
        }
    }
    
    // Control del sonido del motor
    function toggleCarSound(play) {
        if (play) {
            const playPromise = carSound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("No se pudo reproducir el sonido del motor:", error);
                });
            }
        } else {
            carSound.pause();
            carSound.currentTime = 0;
        }
    }
    
    // Reproducir sonido de moneda
    function playCoinSound() {
        if (!coinSoundBuffer) {
            console.log("El buffer de sonido no está cargado aún");
            return;
        }
        
        // Usar setTimeout para el retardo configurable
        setTimeout(() => {
            try {
                const source = audioContext.createBufferSource();
                source.buffer = coinSoundBuffer;
                source.connect(audioContext.destination);
                source.start(0);
                console.log(`Reproduciendo sonido de moneda (con retardo de ${SOUND_DELAY_MS}ms)`);
            } catch (error) {
                console.error("Error al reproducir sonido de moneda:", error);
            }
        }, SOUND_DELAY_MS);
    }

    // --- Inicialización ---
    loadSettings();
    updateScores();
    
    // Ajustar volumen (opcional, 0.5 = 50% de volumen)
    backgroundMusic.volume = 0.5;
    
    // Iniciar música y cargar sonidos
    startBackgroundMusic();
    loadSounds();
    
    // Desbloquear audio en móviles al hacer clic
    document.addEventListener('click', function initAudio() {
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('AudioContext desbloqueado');
            });
        }
        document.removeEventListener('click', initAudio);
    });
});