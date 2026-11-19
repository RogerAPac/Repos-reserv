/* =========================================================
   Componente tarjeta + estado persistente por estación.
   Persistencia con localStorage: las reservas NO cambian al
   volver al menú ni al recargar.
   ========================================================= */
(function () {
  'use strict';

  const STORAGE_KEY = 'majora_station_state_v1';

  // Datos separados de la presentación (Parte 1)
  const catalogData = {
    pc: [
      { name: 'League of Legends', icon: 'bi-controller' },
      { name: 'Valorant',          icon: 'bi-crosshair' },
      { name: 'GTA V',             icon: 'bi-car-front' },
      { name: 'Minecraft',         icon: 'bi-box' },
      { name: 'CS2',               icon: 'bi-bullseye' },
      { name: 'Fortnite',          icon: 'bi-joystick' }
    ],
    ps5: [
      { name: 'EA FC 24',        icon: 'bi-dribbble' },
      { name: 'Spider-Man 2',    icon: 'bi-person-bounding-box' },
      { name: 'God of War',      icon: 'bi-hammer' },
      { name: 'Mortal Kombat 1', icon: 'bi-fire' }
    ],
    xbox: [
      { name: 'Halo 3',          icon: 'bi-rocket' },
      { name: 'Gears of War',    icon: 'bi-skull' },
      { name: 'PES 2013',        icon: 'bi-dribbble' },
      { name: 'GTA San Andreas', icon: 'bi-car-front' }
    ],
    // Productos: iconos propios (no PC)
    bebidas: [
      { name: 'Coca Cola',   icon: 'bi-cup-straw', price: 5 },
      { name: 'Pepsi',       icon: 'bi-cup',       price: 5 },
      { name: 'Papas Lays',  icon: 'bi-bag',       price: 4 },
      { name: 'Chocolate',   icon: 'bi-cookie',    price: 3 },
      { name: 'Agua',        icon: 'bi-droplet',   price: 2 },
      { name: 'Jugo Natural',icon: 'bi-cup-hot',   price: 6 }
    ]
  };

  // Icono correcto por tipo de estación (requerimiento del usuario)
  const stationIcons = {
    PC:   'bi-pc-display',
    PS5:  'bi-playstation',
    XBOX: 'bi-xbox'
  };

  // ---- Persistencia ----
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }
  function saveState(obj) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch {}
  }
  let stationState = loadState();   // { "PC-1": "busy", "PS5-3": "busy", ... }

  function marcarOcupada(stationId) {
    stationState[stationId] = 'busy';
    saveState(stationState);
  }

  // Exponer helpers para el script principal
  window.MajoraCard = {
    catalogData,
    stationIcons,
    marcarOcupada,
    isBusy: (id) => stationState[id] === 'busy',
    reset: () => { stationState = {}; saveState({}); }
  };

  // ---- Delegación de eventos: botón simular por tarjeta ----
  // Afecta SOLO a la tarjeta pulsada (Parte 1, §3)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.card-item__btn-simular');
    if (!btn) return;
    const tarjeta = btn.closest('.card-item');
    if (!tarjeta || tarjeta.classList.contains('card-item--busy')) return;

    const estado = tarjeta.querySelector('.card-item__estado');
    const activo = tarjeta.classList.toggle('card-item--activo');
    if (estado) {
      estado.textContent = activo ? 'Estado: Seleccionado (Simulación)' : 'Estado: Disponible';
    }
  });
})();
