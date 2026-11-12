
$(document).ready(function () {

    // ============================================================
    // 0. HIDRATACIÓN IDEMPOTENTE (patrón de la guía)
    // ============================================================
    // Si el DOM ya fue hidratado (ej. PWA que reinyecta el script),
    // no volvemos a registrar listeners ni temporizadores.
    if ($('body').attr('data-hidratado') === 'true') {
        console.log('[HIDRATACIÓN] El DOM ya estaba hidratado. Abortando.');
        return;
    }

    // ============================================================
    // 1. ESTADO GLOBAL (referencias a temporizadores e instancias)
    // ============================================================
    const state = {
        currentService: '',
        currentPricePerHour: 0,
        currentStation: '',
        clockInterval: null,
        timerInterval: null,
        reservaModal: null,       // instancia única reutilizable
        bitacoraModal: null,      // instancia única reutilizable
        hidratado: false
    };

    // ============================================================
    // 2. RELOJ (con limpieza de intervalos)
    // ============================================================
    function updateClock() {
        $('#liveClock').text(new Date().toLocaleTimeString('es-ES'));
    }

    function startClock() {
        if (state.clockInterval !== null) return; // ya corriendo
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
    // 4. FACTORIES DE MODALES (instancia única, sin huérfanas)
    // ============================================================
    function getReservaModal() {
        if (!state.reservaModal) {
            state.reservaModal = new bootstrap.Modal(
                document.getElementById('reservaModal')
            );
        }
        return state.reservaModal;
    }

    function getBitacoraModal() {
        if (!state.bitacoraModal) {
            state.bitacoraModal = new bootstrap.Modal(
                document.getElementById('bitacoraModal')
            );
        }
        return state.bitacoraModal;
    }

    // ============================================================
    // 5. SECCIÓN: MENÚ PRINCIPAL
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

                if (state.currentService === 'bebidas') {
                    $('#stationView').hide();
                    $('#gameView').css('display', 'flex');
                    loadGames('bebidas');
                } else {
                    $('#stationView').css('display', 'block');
                    $('#gameView').hide();
                    generateStations(state.currentService);
                }
            });
        });

    // ============================================================
    // 6. SECCIÓN: GENERAR ESTACIONES
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

    // Delegación en estaciones (con namespace)
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
    // 7. SECCIÓN: CARGAR JUEGOS
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
            if (state.currentService === 'bebidas') {
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
    // 9. SECCIÓN: RESERVAR / EMPEZAR (con temporizador limpio)
    // ============================================================

    // Calcula el total según horas * precio
    function calcularTotalReserva() {
        let hrs = parseInt($('#hrsInput').val(), 10);
        if (isNaN(hrs) || hrs < 1) {
            hrs = 1;
            $('#hrsInput').val(1);
        }
        $('#totalPay').text(hrs * state.currentPricePerHour);
    }

    // Detiene y limpia el temporizador de reserva
    function stopReservaTimer() {
        if (state.timerInterval !== null) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
    }

    // Arranca el temporizador de 5 minutos
    function startReservaTimer() {
        stopReservaTimer();
        let timeLeft = 300;
        $('#timerDisplay').text('05:00');

        state.timerInterval = setInterval(function () {
            timeLeft--;
            const m = Math.floor(timeLeft / 60);
            const s = timeLeft % 60;
            $('#timerDisplay').text(
                `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            );

            if (timeLeft <= 0) {
                stopReservaTimer();
                getReservaModal().hide();
                // Toast en vez de alert (mejor UX en PWA)
                $('#toastAlert')
                    .html('<i class="fas fa-exclamation-circle text-warning me-2"></i> Tiempo de reserva expirado.')
                    .slideDown('fast').delay(3000).fadeOut('fast');
            }
        }, 1000);
    }

    // Abrir modal de RESERVA
    $('#btnReservar')
        .off('click.hidratacion')
        .on('click.hidratacion', function () {
            $('#modalActionType').text('Reserva');
            $('#modalConsoleName').text(
                `${state.currentStation} - ${state.currentService.toUpperCase()}`
            );
            $('#hrsInput').val(1);
            calcularTotalReserva();
            $('#timerContainer').show();

            getReservaModal().show();
            startReservaTimer();
        });

    // Abrir modal EMPEZAR AHORA
    $('#btnEmpezar')
        .off('click.hidratacion')
        .on('click.hidratacion', function () {
            $('#modalActionType').text('Empezar');
            $('#modalConsoleName').text(
                `${state.currentStation} - ${state.currentService.toUpperCase()}`
            );
            $('#hrsInput').val(1);
            calcularTotalReserva();
            $('#timerContainer').hide();
            stopReservaTimer(); // por si venía de una reserva previa

            getReservaModal().show();
        });

    // Input de horas (validación en tiempo real + actualización total)
    $('#hrsInput')
        .off('input.hidratacion change.hidratacion')
        .on('input.hidratacion change.hidratacion', calcularTotalReserva);

    // Confirmar pago
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

    // 🔴 CRÍTICO: limpiar timer si el usuario cancela con la X o el botón Cancelar
    // (Evento de Bootstrap: hidden.bs.modal)
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
        $('#logOutput').append(
            `<div><span class="text-warning">[${hora}]</span> ` +
            `<span class="text-info">${tipo}:</span> ${mensaje}</div>`
        );
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
            // pequeño delay para que termine la animación del menú
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
    // 12. LIMPIEZA GLOBAL AL DESCARGAR / NAVEGAR (PWA)
    // ============================================================
    $(window)
        .off('beforeunload.hidratacion pagehide.hidratacion')
        .on('beforeunload.hidratacion pagehide.hidratacion', function () {
            stopClock();
            stopReservaTimer();
            // Desvinculamos también el handler global de click fuera del menú
            $(document).off('click.settings.hidratacion');
        });

    // ============================================================
    // 13. MARCAR EL DOM COMO HIDRATADO
    // ============================================================
    startClock();
    state.hidratado = true;
    $('body').attr('data-hidratado', 'true');

    console.log('[HIDRATACIÓN] DOM hidratado correctamente a las', new Date().toLocaleTimeString());
});
