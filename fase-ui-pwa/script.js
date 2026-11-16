$(document).ready(function () {

    if ($('body').attr('data-hidratado') === 'true') return;

    const state = {
        currentService: '', currentPricePerHour: 0, currentStation: '',
        clockInterval: null, timerInterval: null,
        reservaModal: null, bitacoraModal: null, hidratado: false
    };

    function updateClock() { $('#liveClock').text(new Date().toLocaleTimeString('es-ES')); }
    function startClock() { if (state.clockInterval === null) { state.clockInterval = setInterval(updateClock, 1000); updateClock(); } }
    function stopClock() { if (state.clockInterval !== null) { clearInterval(state.clockInterval); state.clockInterval = null; } }

    const catalogData = {
        'pc':      [{ name: 'League of Legends', icon: 'bi-controller' }, { name: 'Valorant', icon: 'bi-crosshair' }, { name: 'GTA V', icon: 'bi-car-front' }, { name: 'Minecraft', icon: 'bi-box' }, { name: 'CS2', icon: 'bi-bullseye' }, { name: 'Fortnite', icon: 'bi-joystick' }],
        'ps5':     [{ name: 'EA FC 24', icon: 'bi-dribbble' }, { name: 'Spider-Man 2', icon: 'bi-person-bounding-box' }, { name: 'God of War', icon: 'bi-hammer' }, { name: 'Mortal Kombat 1', icon: 'bi-fire' }],
        'xbox':    [{ name: 'Halo 3', icon: 'bi-rocket' }, { name: 'Gears of War', icon: 'bi-skull' }, { name: 'PES 2013', icon: 'bi-dribbble' }, { name: 'GTA San Andreas', icon: 'bi-car-front' }],
        'bebidas': [{ name: 'Coca Cola', icon: 'bi-cup' }, { name: 'Pepsi', icon: 'bi-cup-straw' }, { name: 'Papas Lays', icon: 'bi-bag' }, { name: 'Chocolate', icon: 'bi-cookie' }]
    };

    function getReservaModal() { if (!state.reservaModal) state.reservaModal = new bootstrap.Modal(document.getElementById('reservaModal')); return state.reservaModal; }
    function getBitacoraModal() { if (!state.bitacoraModal) state.bitacoraModal = new bootstrap.Modal(document.getElementById('bitacoraModal')); return state.bitacoraModal; }

    // MENÚ PRINCIPAL
    $('#mainMenu').off('click.hidratacion', '.giant-btn').on('click.hidratacion', '.giant-btn', function () {
        const $btn = $(this);
        state.currentService = $btn.data('target');
        state.currentPricePerHour = { pc: 15, ps5: 12, xbox: 8, bebidas: 0 }[state.currentService] || 0;

        $('#mainMenu').fadeOut('fast', function () {
            $('#mainMenu').hide();
            $('#catalogSection').css('display', 'flex').hide().fadeIn('fast');
            $('#catalogTitle').text(state.currentService.toUpperCase());

            if (state.currentService === 'bebidas') {
                $('#stationView').hide(); $('#reservasView').hide(); $('#gameView').css('display', 'flex');
                loadGames('bebidas');
            } else {
                $('#stationView').css('display', 'block'); $('#reservasView').hide(); $('#gameView').hide();
                generateStations(state.currentService);
            }
        });
    });

    // GENERAR ESTACIONES
    function generateStations(service) {
        const $grid = $('#stationGrid').empty();
        const prefix = service.toUpperCase();
        for (let i = 1; i <= 10; i++) {
            const isBusy = Math.random() < 0.3;
            $grid.append(`
                <div class="station-card ${isBusy ? 'busy' : 'available'}" data-station="${prefix}-${i}">
                    <i class="bi bi-pc-display"></i><h4>${prefix}-${i}</h4><span>${isBusy ? 'Ocupada' : 'Libre'}</span>
                </div>
            `);
        }
    }

    $('#stationGrid').off('click.hidratacion', '.station-card.available').on('click.hidratacion', '.station-card.available', function () {
        state.currentStation = $(this).data('station');
        $('#stationView').fadeOut('fast', function () {
            $('#gameView').css('display', 'flex').hide().fadeIn('fast');
            loadGames(state.currentService);
        });
    });

    // CARGAR JUEGOS CON LAZY LOADING
    function loadGames(service) {
        const $grid = $('#gameGrid').empty();
        (catalogData[service] || []).forEach(game => {
            $grid.append(`
                <div class="game-card" data-name="${game.name.toLowerCase()}">
                    <img src="https://picsum.photos/seed/${game.name.replace(/\s/g, '')}/100/100" loading="lazy" width="50" height="50" alt="${game.name}">
                    <span>${game.name}</span>
                </div>
            `);
        });
        
        if (service !== 'bebidas') {
            $('#actionPanel').show();
            $('#currentStationName').text(state.currentStation);
            $('#startPrice').text(state.currentPricePerHour);
        } else { $('#actionPanel').hide(); }
    }

    // VOLVER
    $('#btnBack').off('click.hidratacion').on('click.hidratacion', function () {
        if ($('#reservasView').is(':visible') || state.currentService === 'bebidas' || ($('#stationView').is(':visible') && $('#mainMenu').is(':hidden'))) {
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

    // MODAL RESERVAS
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

    $('#btnConfirm').off('click.hidratacion').on('click.hidratacion', function () {
        stopReservaTimer();
        const action = $('#modalActionType').text(); const hrs = $('#hrsInput').val(); const total = $('#totalPay').text();
        if (state.reservaModal) state.reservaModal.hide();
        $('#toastAlert').html('<i class="bi bi-check-circle-fill text-success me-2"></i> ¡Transacción procesada!').slideDown('fast').delay(3000).fadeOut('fast');
        addLog(action.toUpperCase(), `${state.currentStation} por ${hrs} hrs. Total: ${total} BOB`);
        $(`.station-card[data-station="${state.currentStation}"]`).removeClass('available').addClass('busy').find('span').text('Ocupada');
    });

    $('#reservaModal').off('hidden.bs.modal.hidratacion').on('hidden.bs.modal.hidratacion', function () { stopReservaTimer(); });

    // BITÁCORA Y ENGRANAJE
    function addLog(tipo, mensaje) {
        const hora = new Date().toLocaleTimeString();
        // 🛡️ Anti-XSS
        const $div = $('<div>');
        $div.append($('<span>').addClass('text-warning').text(`[${hora}] `));
        $div.append($('<span>').addClass('text-info').text(`${tipo}: `));
        $div.append(document.createTextNode(mensaje)); 
        $('#logOutput').append($div);
        const $log = $('#logOutput'); $log.scrollTop($log[0].scrollHeight);
    }

    $('#btnSettings').off('click.hidratacion').on('click.hidratacion', function (e) { e.stopPropagation(); $('#settingsMenu').slideToggle('fast'); });
    $('#menuBitacora').off('click.hidratacion').on('click.hidratacion', function (e) {
        e.preventDefault(); $('#settingsMenu').slideUp('fast');
        setTimeout(function () { getBitacoraModal().show(); }, 300);
    });

    $(document).off('click.settings.hidratacion').on('click.settings.hidratacion', function (e) {
        if (!$(e.target).closest('.brand-box').length && !$(e.target).closest('#settingsMenu').length) {
            $('#settingsMenu').slideUp('fast');
        }
    });

    $('#gameSearch').off('keyup.hidratacion').on('keyup.hidratacion', function () {
        const val = $(this).val().toLowerCase();
        $('#gameGrid .game-card').each(function () {
            $(this).data('name').includes(val) ? $(this).show() : $(this).hide();
        });
    });

    // MÓDULO RESERVAS ANTI-XSS
    $('#menuReservas').off('click.hidratacion').on('click.hidratacion', function (e) {
        e.preventDefault(); $('#settingsMenu').slideUp('fast');
        $('#mainMenu, #stationView, #gameView').hide();
        $('#catalogSection').css('display', 'flex').hide().fadeIn('fast');
        $('#catalogTitle').text('Módulo de Reservas');
        $('#reservasView').css('display', 'flex').hide().fadeIn('fast');
    });

    $('#formReserva').off('submit.hidratacion').on('submit.hidratacion', function (e) {
        e.preventDefault();
        let nombre = $('#clienteNombre').val().trim(); let sala = $('#salaSelect').val();
        if (!nombre) return;
        // 🛡️ XSS
        let $li = $('<li>').addClass('list-group-item bg-dark text-white border-success d-flex flex-column mb-2');
        let $strong = $('<strong>').text(nombre + ' - ').css('color', 'var(--primary-green)');
        let $span = $('<span>').text(sala);
        $li.append($strong, $span); $('#listaReservas').append($li); this.reset();
    });

    $(window).off('beforeunload.hidratacion pagehide.hidratacion').on('beforeunload.hidratacion pagehide.hidratacion', function () {
        stopClock(); stopReservaTimer(); $(document).off('click.settings.hidratacion');
    });

    startClock(); state.hidratado = true; $('body').attr('data-hidratado', 'true');
});
