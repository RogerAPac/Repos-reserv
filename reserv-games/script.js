$(document).ready(function() {

    // 1. RELOJ
    function updateClock() {
        $('#liveClock').text(new Date().toLocaleTimeString('es-ES'));
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 2. DATOS
    const catalogData = {
        'pc': [{ name: 'League of Legends', icon: 'fa-gamepad' }, { name: 'Valorant', icon: 'fa-crosshairs' }, { name: 'GTA V', icon: 'fa-car' }, { name: 'Minecraft', icon: 'fa-cube' }, { name: 'CS2', icon: 'fa-gun' }, { name: 'Fortnite', icon: 'fa-parachute-box' }],
        'ps5': [{ name: 'EA FC 24', icon: 'fa-futbol' }, { name: 'Spider-Man 2', icon: 'fa-spider' }, { name: 'God of War', icon: 'fa-axe' }, { name: 'Mortal Kombat 1', icon: 'fa-dragon' }],
        'xbox': [{ name: 'Halo 3', icon: 'fa-rocket' }, { name: 'Gears of War', icon: 'fa-skull' }, { name: 'PES 2013', icon: 'fa-futbol' }, { name: 'GTA San Andreas', icon: 'fa-car' }],
        'bebidas': [{ name: 'Coca Cola', icon: 'fa-glass-whiskey' }, { name: 'Pepsi', icon: 'fa-glass-whiskey' }, { name: 'Papas Lays', icon: 'fa-cookie' }, { name: 'Chocolate', icon: 'fa-candy-cane' }]
    };

    let currentService = '', currentPricePerHour = 0, currentStation = '';
    let timerInterval, modalInstance = null;

    // 3. SELECCIÓN DE MENÚ (Delegación de eventos y transiciones sin espacios en blanco)
    $('#mainMenu').off('click', '.giant-btn').on('click', '.giant-btn', function() {
        currentService = $(this).data('target');
        
        if (currentService === 'pc') currentPricePerHour = 15;
        if (currentService === 'ps5') currentPricePerHour = 12;
        if (currentService === 'xbox') currentPricePerHour = 8;
        if (currentService === 'bebidas') currentPricePerHour = 0;

        $('#mainMenu').fadeOut('fast', function() {
            $('#mainMenu').hide(); // Aseguramos que desaparezca
            // Hacemos que el catálogo ocupe todo el espacio
            $('#catalogSection').css('display', 'flex').hide().fadeIn('fast');
            
            if (currentService === 'bebidas') {
                $('#stationView').hide();
                $('#gameView').css('display', 'flex');
                loadGames('bebidas');
            } else {
                $('#stationView').css('display', 'block');
                $('#gameView').hide();
                generateStations(currentService);
            }
        });
    });

    // 4. GENERAR LAS 10 MÁQUINAS
    function generateStations(service) {
        let grid = $('#stationGrid');
        grid.empty();
        let prefix = service.toUpperCase();
        
        for (let i = 1; i <= 10; i++) {
            let isBusy = Math.random() < 0.3; 
            let statusClass = isBusy ? 'busy' : 'available';
            let statusText = isBusy ? 'Ocupada' : 'Libre';
            
            grid.append(`
                <div class="station-card ${statusClass}" data-station="${prefix}-${i}">
                    <i class="fas fa-desktop"></i>
                    <h4>${prefix}-${i}</h4>
                    <span>${statusText}</span>
                </div>
            `);
        }
    }

    // Delegación de evento para clic en máquina libre
    $('#stationGrid').off('click', '.station-card.available').on('click', '.station-card.available', function() {
        currentStation = $(this).data('station');
        $('#stationView').fadeOut('fast', function() {
            $('#gameView').css('display', 'flex').hide().fadeIn('fast');
            loadGames(currentService);
        });
    });

    // 5. CARGAR JUEGOS (Optimización: loading="lazy" si hubiera imágenes)
    function loadGames(service) {
        let grid = $('#gameGrid');
        grid.empty();

        catalogData[service].forEach(game => {
            // Agregamos loading="lazy" en caso de que en un futuro uses imágenes
            grid.append(`
                <div class="game-card" data-name="${game.name.toLowerCase()}">
                    <i class="fas ${game.icon}"></i>
                    <span>${game.name}</span>
                </div>
            `);
        });

        if (service !== 'bebidas') {
            $('#actionPanel').show();
            $('#currentStationName').text(currentStation);
            $('#startPrice').text(currentPricePerHour);
        } else {
            $('#actionPanel').hide();
        }
    }

    // VOLVER ATRÁS (Corregido para que no deje huecos)
    $('#btnBack').off('click').on('click', function() {
        if (currentService === 'bebidas') {
            $('#catalogSection').fadeOut('fast', function() {
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

    // 6. RESERVAR (Con temporizador)
    $('#btnReservar').off('click').on('click', function() {
        $('#modalActionType').text('Reserva');
        $('#modalConsoleName').text(currentStation + ' - ' + currentService.toUpperCase());
        $('#hrsInput').val(1);
        calcularTotalReserva();
        $('#timerContainer').show();

        modalInstance = new bootstrap.Modal(document.getElementById('reservaModal'));
        modalInstance.show();

        let timeLeft = 300;
        $('#timerDisplay').text('05:00');
        clearInterval(timerInterval);
        timerInterval = setInterval(function() {
            timeLeft--;
            let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
            $('#timerDisplay').text(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                modalInstance.hide();
                alert("Tiempo de reserva expirado.");
            }
        }, 1000);
    });

    $('#hrsInput').off('input').on('input', calcularTotalReserva);
    function calcularTotalReserva() {
        let hrs = $('#hrsInput').val();
        if (hrs < 1) { $('#hrsInput').val(1); hrs = 1; }
        $('#totalPay').text(hrs * currentPricePerHour);
    }

    // 7. EMPEZAR AHORA
    $('#btnEmpezar').off('click').on('click', function() {
        $('#modalActionType').text('Empezar');
        $('#modalConsoleName').text(currentStation + ' - ' + currentService.toUpperCase());
        $('#hrsInput').val(1);
        calcularTotalReserva();
        $('#timerContainer').hide(); 

        modalInstance = new bootstrap.Modal(document.getElementById('reservaModal'));
        modalInstance.show();
    });

    // PROCESAR PAGO
    $('#btnConfirm').off('click').on('click', function() {
        clearInterval(timerInterval);
        if(modalInstance) modalInstance.hide();
        
        let action = $('#modalActionType').text();
        let hrs = $('#hrsInput').val();
        let total = $('#totalPay').text();

        $('#toastAlert').slideDown('fast').delay(3000).fadeOut('fast');
        addLog(action.toUpperCase(), `${currentStation} por ${hrs} hrs. Total: ${total} BOB`);
        
        $(`.station-card[data-station="${currentStation}"]`).removeClass('available').addClass('busy').find('span').text('Ocupada');
    });

    // 8. BITÁCORA Y MENÚ ENGRANAJE
    function addLog(tipo, mensaje) {
        let hora = new Date().toLocaleTimeString();
        $('#logOutput').append(`<div><span class="text-warning">[${hora}]</span> <span class="text-info">${tipo}:</span> ${mensaje}</div>`);
        $('#logOutput').scrollTop($('#logOutput')[0].scrollHeight);
    }

    $('#btnSettings').off('click').on('click', function(e) {
        e.stopPropagation();
        $('#settingsMenu').slideToggle('fast');
    });

    $('#menuBitacora').off('click').on('click', function(e) {
        e.preventDefault();
        $('#settingsMenu').slideUp('fast');
        
        setTimeout(function() {
            let bitacoraModal = new bootstrap.Modal(document.getElementById('bitacoraModal'));
            bitacoraModal.show();
        }, 300);
    });

    $(document).off('click.settings').on('click.settings', function(e) {
        if (!$(e.target).closest('.brand-box').length && !$(e.target).closest('#settingsMenu').length) {
            $('#settingsMenu').slideUp('fast');
        }
    });

    // BUSCADOR
    $('#gameSearch').off('keyup').on('keyup', function() {
        let val = $(this).val().toLowerCase();
        $('#gameGrid .game-card').each(function() {
            $(this).data('name').includes(val) ? $(this).show() : $(this).hide();
        });
    });
});
