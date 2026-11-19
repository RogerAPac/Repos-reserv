$(document).ready(function () {

  if ($('body').attr('data-hidratado') === 'true') return;

  const { catalogData, stationIcons, marcarOcupada, isBusy } = window.MajoraCard;

  const state = {
    currentService: '', currentPricePerHour: 0, currentStation: '',
    clockInterval: null, timerInterval: null,
    reservaModal: null, bitacoraModal: null
  };

  // ---- Reloj ----
  function updateClock() { $('#liveClock').text(new Date().toLocaleTimeString('es-ES')); }
  function startClock() { if (state.clockInterval === null) { state.clockInterval = setInterval(updateClock, 1000); updateClock(); } }
  function stopClock() { if (state.clockInterval !== null) { clearInterval(state.clockInterval); state.clockInterval = null; } }

  function getReservaModal() { if (!state.reservaModal) state.reservaModal = new bootstrap.Modal(document.getElementById('reservaModal')); return state.reservaModal; }
  function getBitacoraModal() { if (!state.bitacoraModal) state.bitacoraModal = new bootstrap.Modal(document.getElementById('bitacoraModal')); return state.bitacoraModal; }

  // ---- Parte 2: Simulación de vista móvil/escritorio ----
  $('#btnSimularVista').off('click.hidratacion').on('click.hidratacion', function () {
    document.querySelectorAll('.catalogo-grid').forEach(g => g.classList.toggle('sim-movil'));
  });

  // ---- Helper: crear tarjeta (reutilizable) ----
  function crearTarjeta({ id, titulo, estado, icono, precio, busy }) {
    const cls = busy ? 'card-item--busy' : 'card-item--available';
    const estadoTxt = busy ? 'Ocupada' : estado;
    const precioHtml = precio != null ? `<span class="card-item__precio">${precio} Bs</span>` : '<span></span>';
    return `
      <article class="card-item ${cls}" data-id="${id}" data-station="${id}">
        <i class="bi ${icono} card-item__icono"></i>
        <h4 class="card-item__titulo">${titulo}</h4>
        <p class="card-item__estado">${estadoTxt}</p>
        <div class="card-item__pie">
          ${precioHtml}
          <button type="button" class="card-item__btn-simular">Simular</button>
        </div>
      </article>`;
  }

  // ---- MENÚ PRINCIPAL ----
  $('#mainMenu').off('click.hidratacion', '.giant-btn').on('click.hidratacion', '.giant-btn', function () {
    const $btn = $(this);
    state.currentService = $btn.data('target');
    state.currentPricePerHour = { pc: 15, ps5: 12, xbox: 8, bebidas: 0 }[state.currentService] || 0;

    $('#mainMenu').fadeOut('fast', function () {
      $('#mainMenu').hide();
      $('#catalogSection').css('display', 'flex').hide().fadeIn('fast');
      $('#catalogTitle').text(state.currentService.toUpperCase());

      if (state.currentService === 'bebidas') {
        $('#stationView').hide(); $('#reservasView').hide();
        $('#gameView').css('display', 'flex');
        loadGames('bebidas');
      } else {
        $('#stationView').css('display', 'block'); $('#reservasView').hide(); $('#gameView').hide();
        generateStations(state.currentService);
      }
    });
  });

  // ---- GENERAR ESTACIONES (icono correcto + estado persistente) ----
  function generateStations(service) {
    const $grid = $('#stationGrid').empty();
    const prefix = service.toUpperCase();
    const icono = stationIcons[prefix] || 'bi-pc-display';

    for (let i = 1; i <= 10; i++) {
      const id = `${prefix}-${i}`;
      const busy = isBusy(id);   // <-- estado guardado en localStorage
      $grid.append(crearTarjeta({
        id,
        titulo: id,
        estado: 'Disponible',
        icono,
        precio: null,
        busy
      }));
    }
  }

  // Click en estación disponible
  $('#stationGrid').off('click.hidratacion', '.card-item--available').on('click.hidratacion', '.card-item--available', function (e) {
    if (e.target.closest('.card-item__btn-simular')) return; // no navegar al simular
    state.currentStation = $(this).data('station');
    $('#stationView').fadeOut('fast', function () {
      $('#gameView').css('display', 'flex').hide().fadeIn('fast');
      loadGames(state.currentService);
    });
  });

  // ---- CARGAR JUEGOS / PRODUCTOS ----
  function loadGames(service) {
    const $grid = $('#gameGrid').empty
