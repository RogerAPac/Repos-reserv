$(document).ready(function () {

    // ============================================================
    // 0. HIDRATACIÓN IDEMPOTENTE (patrón de la guía)
    // ============================================================
    if ($('body').attr('data-hidratado') === 'true') {
        console.log('[HIDRATACIÓN] El DOM ya estaba hidratado. Abortando.');
        return;
    }

    // ============================================================
    // 1. ESTADO GLOBAL
    // ============================================================
    const state = {
        currentService: '',
        currentPricePerHour: 0,
        currentStation: '',
        clockInterval: null,
        timerInterval: null,
        reservaModal: null,       
        bitacoraModal: null,      
        hidratado: false
    };

    // ============================================================
    // 2. RELOJ (Con limpieza de intervalos)
    // ============================================================
    function updateClock() {
        $('#liveClock').text(new Date().toLocaleTimeString('es-ES'));
    }

    function startClock() {
        if (state.clockInterval !== null) return;
        state.clockInterval = setInterval(updateClock, 1000);
        updateClock();
    }

    function stopClock() {
        if (state.clockInterval !== null) {
            clearInterval(state.clockInterval);
            state.clockInterval = null;
        }
    }

    // ============================================================
    // 3. DATOS DEL CATÁLOGO
    // ============================================================
    const catalogData = {
        'pc':      [{ name: 'League of Legends', icon: 'fa-gamepad' }, { name: 'Valorant', icon: 'fa-crosshairs' }, { name: 'GTA V', icon: 'fa-car' }, { name: 'Minecraft', icon: 'fa-cube' }, { name: 'CS2', icon: 'fa-gun' }, { name: 'Fortnite', icon: 'fa-parachute-box' }],
        'ps5':     [{ name: 'EA FC 24', icon: 'fa-futbol' }, { name: 'Spider-Man 2', icon: 'fa-spider' }, { name: 'God of War', icon: 'fa-axe' }, { name: 'Mortal Kombat 1', icon: 'fa-dragon' }],
        'xbox':    [{ name: 'Halo 3', icon: 'fa-rocket' }, { name: 'Gears of War', icon: 'fa-skull' }, { name: 'PES 2013', icon: 'fa-futbol' }, { name: 'GTA San Andreas', icon: 'fa-car' }],
        'bebidas': [{ name: 'Coca Cola', icon: 'fa-glass-whiskey' }, { name: 'Pepsi', icon: 'fa-glass-whiskey' }, { name: 'Papas Lays', icon: 'fa-cookie' }, { name: 'Chocolate', icon: 'fa-candy-cane' }]
    };

    // ============================================================
    // 4. FACTORIES DE MODALES (Instancia única, sin huérfanas)
    // ============================================================
    function getReservaModal() {
        if (!state.reservaModal) {
            state.reservaModal = new bootstrap.Modal(document.getElementById('reservaModal'));
        }
        return state.reservaModal;
    }

    function getBitacoraModal() {
        if (!state.bitacoraModal) {
            state.bitacoraModal = new bootstrap.Modal(document.getElementById('bitacoraModal'));
        }
        return state.bitacoraModal;
    }

    // ============================================================
    // 5. SELECCIÓN DE MENÚ PRINCIPAL
    // ============================================================
    $('#mainMenu')
        .off('click.hidratacion', '.giant-btn')
        .on('click.hidratacion', '.giant-btn', function () {
            const $btn = $(this);
            state.currentService = $btn.data('target');

            const precios = { pc: 15, ps5: 12, xbox: 8, bebidas: 0 };
            state.currentPricePerHour = precios[state.currentService] || 0;

            $('#mainMenu').fadeOut('fast', function () {
                $('#mainMenu').hide();
                $('#catalogSection').css('display', 'flex').hide().fadeIn('fast');
                
                // Actualizar título del catálogo
                $('#catalogTitle').text(state.currentService.toUpperCase());

                if (state.currentService === 'bebidas') {
                    $('#stationView').hide();
                    $('#reservasView').hide();
                    $('#gameView').css('display', 'flex');
                    loadGames('bebidas');
                } else {
                    $('#stationView').css('display', 'block');
                    $('#reservasView').hide();
                    $('#gameView').hide();
                    generateStations(state.currentService);
                }
            });
        });

    // ============================================================
    // 6. GENERAR ESTACIONES
    // ============================================================
    function generateStations(service) {
        const $grid = $('#stationGrid').empty();
        const prefix = service.toUpperCase();

        for (let i = 1; i <= 10; i++) {
            const isBusy = Math.random() < 0.3;
            const statusClass = isBusy ? 'busy' : 'available';
            const statusText  = isBusy ? 'Ocupada' : 'Libre';

            $grid.append(`
                <div class="station-card ${statusClass}" data-station="${prefix}-${i}">
                    <i class="fas fa-desktop"></i>
                    <h4>${prefix}-${i}</h4>
                    <span>${statusText}</span>
                </div>
            `);
        }
    }

    $('#stationGrid')
        .off('click.hidratacion', '.station-card.available')
        .on('click.hidratacion', '.station-card.available', function () {
            state.currentStation = $(this).data('station');

            $('#stationView').fadeOut('fast', function () {
                $('#gameView').css('display', 'flex').hide().fadeIn('fast');
                loadGames(state.currentService);
            });
        });

    // ============================================================
    // 7. CARGAR JUEGOS
    // ============================================================
    function loadGames(service) {
        const $grid = $('#gameGrid').empty();
        const juegos = catalogData[service] || [];

        juegos.forEach(game => {
            $grid.append(`
                <div class="game-card" data-name="${game.name.toLowerCase()}">
                    <i class="fas ${game.icon}"></i>
                    <span>${game.name}</span>
                </div>
            `);
        });

        if (service !== 'bebidas') {
            $('#actionPanel').show();
            $('#currentStationName').text(state.currentStation);
            $('#startPrice').text(state.currentPricePerHour);
        } else {
            $('#actionPanel').hide();
        }
    }

    // ============================================================
    // 8. BOTÓN VOLVER
    // ============================================================
    $('#btnBack')
        .off('click.hidratacion')
        .on('click.hidratacion', function () {
            if ($('#reservasView').is(':visible')) {
                // Si estamos en reservas, volvemos al menú principal
                $('#reservasView').fadeOut('fast', function () {
                    $('#catalogSection').hide();
                    $('#mainMenu').fadeIn('fast').css('display', 'flex');
                });
            } else if (state.currentService === 'bebidas' || ($('#stationView').is(':visible') && $('#mainMenu').is(':hidden'))) {
                $('#catalogSection').fadeOut('fast', function () {
                    $('#catalogSection').hide();
                    $('#mainMenu').fadeIn('fast').css('display', 'flex');
                });
            } else {
                if ($('#gameView').is(':visible')) {
                    $('#gameView').fadeOut('fast', () =>
                        $('#stationView').fadeIn('fast').css('display', 'block')
                    );
                } else {
                    $('#stationView').fadeOut('fast', () => {
                        $('#catalogSection').hide();
                        $('#mainMenu').fadeIn('fast').css('display', 'flex');
                    });
                }
            }
        });

    // ============================================================
    // 9. LÓGICA DE RESERVAS Y TEMPORIZADOR
    // ============================================================
    function calcularTotalReserva() {
        let hrs = parseInt($('#hrsInput').val(), 10);
        if (isNaN(hrs) || hrs < 1) {
            hrs = 1;
            $('#hrsInput').val(1);
        }
        $('#totalPay').text(hrs * state.currentPricePerHour);
    }

    function stopReservaTimer() {
        if (state.timerInterval !== null) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
    }

    function startReservaTimer() {
        stopReservaTimer();
        let timeLeft = 300;
        $('#timerDisplay').text('05:00');

        state.timerInterval = setInterval(function () {
            timeLeft--;
            const m = Math.floor(timeLeft / 60);
            const s = timeLeft % 60;
            $('#timerDisplay').text(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);

            if (timeLeft <= 0) {
                stopReservaTimer();
                getReservaModal().hide();
                $('#toastAlert')
                    .html('<i class="fas fa-exclamation-circle text-warning me-2"></i> Tiempo de reserva expirado.')
                    .slideDown('fast').delay(3000).fadeOut('fast');
            }
        }, 1000);
    }

    // Abrir Modal Reservar
    $('#btnReservar')
        .off('click.hidratacion')
        .on('click.hidratacion', function () {
            $('#modalActionType').text('Reserva');
            $('#modalConsoleName').text(`${state.currentStation} - ${state.currentService.toUpperCase()}`);
            $('#hrsInput').val(1);
            calcularTotalReserva();
            $('#timerContainer').show();

            getReservaModal().show();
            startReservaTimer();
        });

    // Abrir Modal Empezar Ahora
    $('#btnEmpezar')
        .off('click.hidratacion')
        .on('click.hidratacion', function () {
            $('#modalActionType').text('Empezar');
            $('#modalConsoleName').text(`${state.currentStation} - ${state.currentService.toUpperCase()}`);
            $('#hrsInput').val(1);
            calcularTotalReserva();
            $('#timerContainer').hide();
            stopReservaTimer();

            getReservaModal().show();
        });

    // Calcular total al cambiar horas
    $('#hrsInput')
        .off('input.hidratacion change.hidratacion')
        .on('input.hidratacion change.hidratacion', calcularTotalReserva);

    // Confirmar Pago
    $('#btnConfirm')
        .off('click.hidratacion')
        .on('click.hidratacion', function () {
            stopReservaTimer();

            const action = $('#modalActionType').text();
            const hrs = $('#hrsInput').val();
            const total = $('#totalPay').text();

            if (state.reservaModal) state.reservaModal.hide();

            $('#toastAlert')
                .html('<i class="fas fa-check-circle text-success me-2"></i> ¡Transacción procesada!')
                .slideDown('fast').delay(3000).fadeOut('fast');

            addLog(
                action.toUpperCase(),
                `${state.currentStation} por ${hrs} hrs. Total: ${total} BOB`
            );

            $(`.station-card[data-station="${state.currentStation}"]`)
                .removeClass('available').addClass('busy')
                .find('span').text('Ocupada');
        });

    // Limpiar timer si se cierra el modal
    $('#reservaModal')
        .off('hidden.bs.modal.hidratacion')
        .on('hidden.bs.modal.hidratacion', function () {
            stopReservaTimer();
        });

    // ============================================================
    // 10. BITÁCORA Y MENÚ ENGRANAJE
    // ============================================================
    function addLog(tipo, mensaje) {
        const hora = new Date().toLocaleTimeString();
        // 🛡️ Sanitización XSS: Usar .text() para el mensaje evita inyecciones
        const $div = $('<div>');
        const $spanHora = $('<span>').addClass('text-warning').text(`[${hora}] `);
        const $spanTipo = $('<span>').addClass('text-info').text(`${tipo}: `);
        
        $div.append($spanHora, $spanTipo, document.createTextNode(mensaje));
        
        $('#logOutput').append($div);
        const $log = $('#logOutput');
        $log.scrollTop($log[0].scrollHeight);
    }

    $('#btnSettings')
        .off('click.hidratacion')
        .on('click.hidratacion', function (e) {
            e.stopPropagation();
            $('#settingsMenu').slideToggle('fast');
        });

    $('#menuBitacora')
        .off('click.hidratacion')
        .on('click.hidratacion', function (e) {
            e.preventDefault();
            $('#settingsMenu').slideUp('fast');
            setTimeout(function () {
                getBitacoraModal().show();
            }, 300);
        });

    // Cierre del menú al clicar fuera (namespace)
    $(document)
        .off('click.settings.hidratacion')
        .on('click.settings.hidratacion', function (e) {
            if (
                !$(e.target).closest('.brand-box').length &&
                !$(e.target).closest('#settingsMenu').length
            ) {
                $('#settingsMenu').slideUp('fast');
            }
        });

    // ============================================================
    // 11. BUSCADOR DE JUEGOS
    // ============================================================
    $('#gameSearch')
        .off('keyup.hidratacion input.hidratacion')
        .on('keyup.hidratacion input.hidratacion', function () {
            const val = $(this).val().toLowerCase();
            $('#gameGrid .game-card').each(function () {
                $(this).data('name').includes(val)
                    ? $(this).show()
                    : $(this).hide();
            });
        });

    // ============================================================
    // 12. MÓDULO DE RESERVAS (CON PREVENCIÓN XSS)
    // ============================================================
    $('#menuReservas')
        .off('click.hidratacion')
        .on('click.hidratacion', function (e) {
            e.preventDefault();
            $('#settingsMenu').slideUp('fast');
            
            $('#mainMenu, #stationView, #gameView').hide();
            $('#catalogSection').css('display', 'flex').hide().fadeIn('fast');
            $('#catalogTitle').text('Módulo de Reservas');
            $('#reservasView').css('display', 'flex').hide().fadeIn('fast');
        });

    $('#formReserva')
        .off('submit.hidratacion')
        .on('submit.hidratacion', function (e) {
            e.preventDefault();
            let nombre = $('#clienteNombre').val().trim();
            let sala = $('#salaSelect').val();
            
            if (!nombre) return;

            // 🛡️ PREVENCIÓN XSS: Usar .text() en lugar de HTML crudo
            let $li = $('<li>').addClass('list-group-item bg-dark text-white border-success d-flex flex-column mb-2');
            let $strong = $('<strong>').text(nombre + ' - ').css('color', 'var(--primary-green)');
            let $span = $('<span>').text(sala);

            $li.append($strong, $span);
            $('#listaReservas').append($li);
            
            this.reset();
        });

    // ============================================================
    // 13. LIMPIEZA Y ARRANQUE
    // ============================================================
    $(window)
        .off('beforeunload.hidratacion pagehide.hidratacion')
        .on('beforeunload.hidratacion pagehide.hidratacion', function () {
            stopClock();
            stopReservaTimer();
            $(document).off('click.settings.hidratacion');
        });

    startClock();
    state.hidratado = true;
    $('body').attr('data-hidratado', 'true');

    console.log('[HIDRATACIÓN] DOM hidratado correctamente a las', new Date().toLocaleTimeString());
});
