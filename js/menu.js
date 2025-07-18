document.addEventListener('DOMContentLoaded', () => {
  // Precargar los sonidos para una reproducción más rápida
  const hoverSound = new Audio('sonidos/hover.mp3');
  const clickSound = new Audio('sonidos/click.mp3');

  // Obtener todos los botones del menú y del HUD
  const allButtons = document.querySelectorAll('.menu-button, .hud button');

  // Añadir los eventos a cada botón
  allButtons.forEach(button => {
    // Evento para cuando el ratón pasa por encima
    button.addEventListener('mouseenter', () => {
      hoverSound.currentTime = 0; // Reinicia el sonido si ya se está reproduciendo
      hoverSound.play();
    });

    // Solo añadir el evento de clic con retraso a los botones del menú principal
    if (button.classList.contains('menu-button')) {
      button.addEventListener('click', (event) => {
        // Prevenimos la navegación inmediata
        event.preventDefault();

        // Obtenemos la URL a la que se debe dirigir
        const destination = event.currentTarget.href;

        // Reproducimos el sonido
        clickSound.currentTime = 0;
        clickSound.play();

        // Esperamos un momento antes de navegar para que el sonido se escuche
        setTimeout(() => {
          window.location.href = destination;
        }, 300); // 300 milisegundos de retraso
      });
    } else {
      // Para los demás botones (del HUD), el sonido de clic se manejará en su propio script (asistencia.js)
      // para no interferir con su funcionalidad específica.
    }
  });
});