$(document).ready(function () {

  if ($('body').attr('data-hidratado') === 'true') return;

  // Dependencias expuestas por js/tarjeta.js
  const { catalogData, stationIcons, marcarOcupada, isBusy } = window.MajoraCard;

  const state = {
    currentService: '', currentPricePerHour: 0, currentStation: '',
    clockInterval: null, timerInterval: null,
    reservaModal: null, bitacoraModal: null
  };

  // ===================== RELOJ =====================
  function updateClock() { $('#liveClock').text(new Date().toLocaleTimeString('es-ES')); }
  function startClock() { if (state.clockInterval === null) { state.clockInterval = setInterval(updateClock, 1000); updateClock(); } }
  function stopClock() { if (state.clockInterval !== null) { clearInterval(state.clockInterval); state.clockInterval = null; } }

  function getReservaModal() { if (!state.reservaModal) state.reservaModal = new bootstrap.Modal(document.getElementById('reservaModal')); return state.reservaModal; }
  function getBitacoraModal() { if (!state.bitacoraModal) state.bitacoraModal = new bootstrap.Modal(document.getElementById('bitacoraModal')); return state.bitacoraModal; }

  // ===================== PARTE 2: SIMULACIÓN DE VISTA =====================
  $('#btnSimularVista').off('click.hidratacion').on('click.hidratacion', function () {
    document.querySelectorAll('.catalogo-grid').forEach(g => g.classList.toggle('sim-movil'));
  });

  // ===================== HELPER: CREAR TARJETA =====================
  function crearTarjeta({ id, titulo, estado, icono, precio, busy }) {
    const cls = busy ? 'card-item--busy' : 'card-item--available';
    const estadoTxt = busy ? 'Ocupada' : estado;
    const precioHtml = precio != null
      ? `<span class="card-item__precio">${precio} Bs</span>`
      : '<span></span>';
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

  // ===================== MENÚ PRINCIPAL =====================
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

  // ===================== GENERAR ESTACIONES (icono correcto + persistencia) =====================
  function generateStations(service) {
    const $grid = $('#stationGrid').empty();
    const prefix = service.toUpperCase();
    const icono = stationIcons[prefix] || 'bi-pc-display';

    for (let i = 1; i <= 10; i++) {
      const id = `${prefix}-${i}`;
      const busy = isBusy(id);   // <-- lee estado guardado en localStorage
      $grid.append(crearTarjeta({
        id, titulo: id, estado: 'Disponible', icono, precio: null, busy
      }));
    }
  }

  // Click en estación disponible (ignora el botón simular)
  $('#stationGrid').off('click.hidratacion', '.card-item--available').on('click.hidratacion', '.card-item--available', function (e) {
    if (e.target.closest('.card-item__btn-simular')) return;
    state.currentStation = $(this).data('station');
    $('#stationView').fadeOut('fast', function () {
      $('#gameView').css('display', 'flex').hide().fadeIn('fast');
      loadGames(state.currentService);
    });
  });

  // ===================== CARGAR JUEGOS / PRODUCTOS =====================
  function loadGames(service) {
    const $grid = $('#gameGrid').empty();
    const items = catalogData[service] || [];

    items.forEach(item => {
      // Bebidas: productos con precio; Juegos: tarjeta con icono
      if (service === 'bebidas') {
        $grid.append(`
          <article class="card-item card-item--available" data-name="${item.name.toLowerCase()}">
            <i class="bi ${item.icon} card-item__icono"></i>
            <h4 class="card-item__titulo">${item.name}</h4>
            <div class="card-item__pie">
              <span class="card-item__precio">${item.price} Bs</span>
              <button type="button" class="card-item__btn-simular">Simular</button>
            </div>
          </article>`);
      } else {
        $grid.append(`
          <article class="card-item card-item--available" data-name="${item.name.toLowerCase()}">
            <img src="https://picsum.photos/seed/${item.name.replace(/\s/g, '')}/100/100"
                 loading="lazy" width="50" height="50" alt="${item.name}"
                 style="border-radius:5px;margin-bottom:4px;object-fit:cover;">
            <h4 class="card-item__titulo">${item.name}</h4>
            <div class="card-item__pie">
              <span></span>
              <button type="button" class="card-item__btn-simular">Simular</button>
            </div>
          </article>`);
      }
    });

    if (service !== 'bebidas') {
      $('#actionPanel').show();
      $('#currentStationName').text(state.currentStation);
      $('#startPrice').text(state.currentPricePerHour);
    } else {
      $('#actionPanel').hide();
    }
  }

  // ===================== VOLVER =====================
  $('#btnBack').off('click.hidratacion').on('click.hidratacion', function () {
    if ($('#reservasView').is(':visible') || state.currentService === 'bebidas' ||
        ($('#stationView').is(':visible') && $('#mainMenu').is(':hidden'))) {
      $('#catalogSection').fadeOut('fast', function () {
        $('#catalogSection').hide();
        $('#mainMenu').fadeIn('fast').css('display', 'flex');
      });
    } else {
      if ($('#gameView').is(':visible')) {
        $('#gameView').fadeOut('fast', () => $('#stationView').fadeIn('fast').css('display', 'block'));
      } else {
        $('#stationView').fadeOut('fast', () => {
          $('#catalogSection').hide();
          $('#mainMenu').fadeIn('fast').css('display', 'flex');
        });
      }
    }
  });

  // ===================== MODAL RESERVA / EMPEZAR =====================
  function calcularTotalReserva() {
    let hrs = parseInt($('#hrsInput').val(), 10);
    if (isNaN(hrs) || hrs < 1) { hrs = 1; $('#hrsInput').val(1); }
    $('#totalPay').text(hrs * state.currentPricePerHour);
  }
  function stopReservaTimer() { if (state.timerInterval !== null) { clearInterval(state.timerInterval); state.timerInterval = null; } }
  function startReservaTimer() {
    stopReservaTimer();
    let timeLeft = 300;
    $('#timerDisplay').text('05:00');
    state.timerInterval = setInterval(function () {
      timeLeft--;
      const m = Math.floor(timeLeft / 60); const s = timeLeft % 60;
      $('#timerDisplay').text(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      if (timeLeft <= 0) {
        stopReservaTimer(); getReservaModal().hide();
        $('#toastAlert').html('<i class="bi bi-exclamation-triangle-fill text-warning me-2"></i> Tiempo expirado.').slideDown('fast').delay(3000).fadeOut('fast');
      }
    }, 1000);
  }

  $('#btnReservar').off('click.hidratacion').on('click.hidratacion', function () {
    $('#modalActionType').text('Reserva');
    $('#modalConsoleName').text(`${state.currentStation} - ${state.currentService.toUpperCase()}`);
    $('#hrsInput').val(1); calcularTotalReserva(); $('#timerContainer').show();
    getReservaModal().show(); startReservaTimer();
  });

  $('#btnEmpezar').off('click.hidratacion').on('click.hidratacion', function () {
    $('#modalActionType').text('Empezar');
    $('#modalConsoleName').text(`${state.currentStation} - ${state.currentService.toUpperCase()}`);
    $('#hrsInput').val(1); calcularTotalReserva(); $('#timerContainer').hide(); stopReservaTimer();
    getReservaModal().show();
  });

  $('#hrsInput').off('input.hidratacion').on('input.hidratacion', calcularTotalReserva);

  // ===================== CONFIRMAR (persistencia real) =====================
  $('#btnConfirm').off('click.hidratacion').on('click.hidratacion', function () {
    stopReservaTimer();
    const action = $('#modalActionType').text();
    const hrs = $('#hrsInput').val();
    const total = $('#totalPay').text();
    if (state.reservaModal) state.reservaModal.hide();

    $('#toastAlert').html('<i class="bi bi-check-circle-fill text-success me-2"></i> ¡Transacción procesada!').slideDown('fast').delay(3000).fadeOut('fast');
    addLog(action.toUpperCase(), `${state.currentStation} por ${hrs} hrs. Total: ${total} BOB`);

    // 🔒 Persistencia: guarda en localStorage y marca la tarjeta visualmente
    marcarOcupada(state.currentStation);
    $(`.card-item[data-station="${state.currentStation}"]`)
      .removeClass('card-item--available')
      .addClass('card-item--busy')
      .find('.card-item__estado').text('Ocupada');
  });

  $('#reservaModal').off('hidden.bs.modal.hidratacion').on('hidden.bs.modal.hidratacion', function () { stopReservaTimer(); });

  // ===================== BITÁCORA =====================
  function addLog(tipo, mensaje) {
    const hora = new Date().toLocaleTimeString();
    // 🛡️ Anti-XSS: todo con .text() / createTextNode
    const $div = $('<div>');
    $div.append($('<span>').addClass('text-warning').text(`[${hora}] `));
    $div.append($('<span>').addClass('text-info').text(`${tipo}: `));
    $div.append(document.createTextNode(mensaje));
    $('#logOutput').append($div);
    const $log = $('#logOutput'); $log.scrollTop($log[0].scrollHeight);
  }

  // ===================== MENÚ ENGRANAJE =====================
  $('#btnSettings').off('click.hidratacion').on('click.hidratacion', function (e) {
    e.stopPropagation(); $('#settingsMenu').slideToggle('fast');
  });

  $('#menuBitacora').off('click.hidratacion').on('click.hidratacion', function (e) {
    e.preventDefault(); $('#settingsMenu').slideUp('fast');
    setTimeout(function () { getBitacoraModal().show(); }, 300);
  });

  $(document).off('click.settings.hidratacion').on('click.settings.hidratacion', function (e) {
    if (!$(e.target).closest('.brand-box').length && !$(e.target).closest('#settingsMenu').length) {
      $('#settingsMenu').slideUp('fast');
    }
  });

  // ===================== BÚSQUEDA =====================
  $('#gameSearch').off('keyup.hidratacion').on('keyup.hidratacion', function () {
    const val = $(this).val().toLowerCase();
    $('#gameGrid .card-item').each(function () {
      const name = $(this).data('name') || '';
      name.includes(val) ? $(this).show() : $(this).hide();
    });
  });

  // ===================== MÓDULO RESERVAS (Anti-XSS) =====================
  $('#menuReservas').off('click.hidratacion').on('click.hidratacion', function (e) {
    e.preventDefault(); $('#settingsMenu').slideUp('fast');
    $('#mainMenu, #stationView, #gameView').hide();
    $('#catalogSection').css('display', 'flex').hide().fadeIn('fast');
    $('#catalogTitle').text('Módulo de Reservas');
    $('#reservasView').css('display', 'flex').hide().fadeIn('fast');
  });

  $('#formReserva').off('submit.hidratacion').on('submit.hidratacion', function (e) {
    e.preventDefault();
    const nombre = $('#clienteNombre').val().trim();
    const sala = $('#salaSelect').val();
    if (!nombre) return;

    const $li = $('<li>').addClass('list-group-item bg-dark text-white border-success d-flex flex-column mb-2');
    const $strong = $('<strong>').text(nombre + ' - ').css('color', 'var(--primary-green)');
    const $span = $('<span>').text(sala);
    $li.append($strong, $span);
    $('#listaReservas').append($li);
    this.reset();
  });

  // ===================== CLEANUP =====================
  $(window).off('beforeunload.hidratacion pagehide.hidratacion').on('beforeunload.hidratacion pagehide.hidratacion', function () {
    stopClock(); stopReservaTimer(); $(document).off('click.settings.hidratacion');
  });

  // ===================== ARRANQUE =====================
  startClock();
  $('body').attr('data-hidratado', 'true');
});
