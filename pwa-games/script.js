$(document).ready(function () {

    // ... (Aquí va tu código de hidratación, estado global y modales, se mantiene igual) ...
    if ($('body').attr('data-hidratado') === 'true') return;

    const state = {
        currentService: '', currentPricePerHour: 0, currentStation: '',
        clockInterval: null, timerInterval: null,
        reservaModal: null, bitacoraModal: null, hidratado: false
    };

    function updateClock() { $('#liveClock').text(new Date().toLocaleTimeString('es-ES')); }
    function startClock() { if (state.clockInterval === null) { state.clockInterval = setInterval(updateClock, 1000); updateClock(); } }
    
    const catalogData = {
        'pc': [{ name: 'League of Legends', icon: 'fa-gamepad' }, { name: 'Valorant', icon: 'fa-crosshairs' }, { name: 'GTA V', icon: 'fa-car' }, { name: 'Minecraft', icon: 'fa-cube' }, { name: 'CS2', icon: 'fa-gun' }, { name: 'Fortnite', icon: 'fa-parachute-box' }],
        'ps5': [{ name: 'EA FC 24', icon: 'fa-futbol' }, { name: 'Spider-Man 2', icon: 'fa-spider' }, { name: 'God of War', icon: 'fa-axe' }, { name: 'Mortal Kombat 1', icon: 'fa-dragon' }],
        'xbox': [{ name: 'Halo 3', icon: 'fa-rocket' }, { name: 'Gears of War', icon: 'fa-skull' }, { name: 'PES 2013', icon: 'fa-futbol' }, { name: 'GTA San Andreas', icon: 'fa-car' }],
        'bebidas': [{ name: 'Coca Cola', icon: 'fa-glass-whiskey' }, { name: 'Pepsi', icon: 'fa-glass-whiskey' }, { name: 'Papas Lays', icon: 'fa-cookie' }, { name: 'Chocolate', icon: 'fa-candy-cane' }]
    };

    function getReservaModal() { if (!state.reservaModal) state.reservaModal = new bootstrap.Modal(document.getElementById('reservaModal')); return state.reservaModal; }
    function getBitacoraModal() { if (!state.bitacoraModal) state.bitacoraModal = new bootstrap.Modal(document.getElementById('bitacoraModal')); return state.bitacoraModal; }

    // --- NAVEGACIÓN PRINCIPAL ---
    $('#mainMenu').off('click.hidratacion', '.giant-btn').on('click.hidratacion', '.giant-btn', function () {
        const $btn = $(this);
        state.currentService = $btn.data('target');
        state.currentPricePerHour = { pc: 15, ps5: 12, xbox: 8, bebidas: 0 }[state.currentService] || 0;

        $('#mainMenu').fadeOut('fast', function () {
            $('#mainMenu').hide();
            $('#catalogSection').css('display', 'flex').hide().fadeIn('fast');
            $('#catalogTitle').text(state.currentService.toUpperCase()); // Título dinámico
            
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

    function generateStations(service) {
        const $grid = $('#stationGrid').empty();
        const prefix = service.toUpperCase();
        for (let i = 1; i <= 10; i++) {
            const isBusy = Math.random() < 0.3;
            $grid.append(`
                <div class="station-card ${isBusy ? 'busy' : 'available'}" data-station="${prefix}-${i}">
                    <i class="fas fa-desktop"></i><h4>${prefix}-${i}</h4><span>${isBusy ? 'Ocupada' : 'Libre'}</span>
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

    function loadGames(service) {
        const $grid = $('#gameGrid').empty();
        (catalogData[service] || []).forEach(game => {
            $grid.append(`<div class="game-card" data-name="${game.name.toLowerCase()}"><i class="fas ${game.icon}"></i><span>${game.name}</span></div>`);
        });
        if (service !== 'bebidas') {
            $('#actionPanel').show();
            $('#currentStationName').text(state.currentStation);
            $('#startPrice').text(state.currentPricePerHour);
        } else { $('#actionPanel').hide(); }
    }

    // --- VOLVER ATRÁS ---
    $('#btnBack').off('click.hidratacion').on('click.hidratacion', function () {
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
                $('#gameView').fadeOut('fast', () => $('#stationView').fadeIn('fast').css('display', 'block'));
            } else {
                $('#stationView').fadeOut('fast', () => {
                    $('#catalogSection').hide();
                    $('#mainMenu').fadeIn('fast').css('display', 'flex');
                });
            }
        }
    });

    // --- MÓDULO DE RESERVAS (CON PREVENCIÓN XSS) ---
    $('#menuReservas').off('click.hidratacion').on('click.hidratacion', function (e) {
        e.preventDefault();
        $('#settingsMenu').slideUp('fast');
        
        // Ocultar todo y mostrar solo el módulo de reservas
        $('#mainMenu, #stationView, #gameView').hide();
        $('#catalogSection').css('display', 'flex').hide().fadeIn('fast');
        $('#catalogTitle').text('Módulo de Reservas');
        $('#reservasView').css('display', 'flex').hide().fadeIn('fast');
    });

    // Envío del formulario SEGURO
    $('#formReserva').off('submit.hidratacion').on('submit.hidratacion', function (e) {
        e.preventDefault();
        let nombre = $('#clienteNombre').val().trim();
        let sala = $('#salaSelect').val();
        
        if (!nombre) return;

        // 🛡️ PREVENCIÓN XSS: Usar .text() en lugar de .html() o concatenación
        let $li = $('<li>').addClass('list-group-item bg-dark text-white border-success d-flex flex-column mb-2');
        let $strong = $('<strong>').text(nombre + ' - ').css('color', 'var(--primary-green)');
        let $span = $('<span>').text(sala);

        $li.append($strong, $span);
        $('#listaReservas').append($li);
        
        this.reset(); // Limpiar el formulario
    });

    // ... (El resto de tu código: reservas modales, temporizador, etc. se mantiene igual) ...

    startClock();
    state.hidratado = true;
    $('body').attr('data-hidratado', 'true');
});
