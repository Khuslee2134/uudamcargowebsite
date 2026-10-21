/* УУДАМ CARGO — бүх хуудсанд нийтлэг ашиглагдах функц, тариф */
(function (global) {
  'use strict';

  // Тариф — үнэ өөрчлөгдвөл зөвхөн эндээс засна
  var WEIGHT_RATE = 2500;   // ₮ / кг
  var VOLUME_RATE = 350000; // ₮ / м³

  function toggleMenu() {
    var drawer = document.getElementById('sideDrawer');
    if (drawer) drawer.classList.toggle('open');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // "40x30x25" (x, X, х, ×, * зөвшөөрнө; таслалтай бутархай ч болно) -> м³
  function volumeM3(dimsStr) {
    var text = String(dimsStr || '').replace(/,/g, '.');
    var m = text.match(/(\d+(?:\.\d+)?)\s*[xXхХ×*]\s*(\d+(?:\.\d+)?)\s*[xXхХ×*]\s*(\d+(?:\.\d+)?)/);
    if (!m) return 0;
    return (parseFloat(m[1]) * parseFloat(m[2]) * parseFloat(m[3])) / 1000000; // см³ -> м³
  }

  function formatMoney(amount) {
    return Math.round(amount).toLocaleString('en-US') + ' ₮';
  }

  // Жин (нэг ширхгийн), хэмжээ, ширхэг -> зардал. Жин, эзэлхүүнээс аль ихийг нь авна.
  function calcCost(weightKg, dimsStr, qty) {
    var w = Math.max(0, parseFloat(weightKg) || 0);
    var q = Math.max(1, parseFloat(qty) || 1);
    var volume = volumeM3(dimsStr);
    var weightCost = w * WEIGHT_RATE * q;
    var volumeCost = volume * VOLUME_RATE * q;
    return {
      weightCost: weightCost,
      volumeCost: volumeCost,
      total: Math.round(Math.max(weightCost, volumeCost)),
      basis: volumeCost > weightCost ? 'volume' : 'weight'
    };
  }

  // [data-rate="weight"] / [data-rate="volume"] элементүүдэд тарифыг бичнэ
  function fillRates() {
    var nodes = document.querySelectorAll('[data-rate]');
    for (var i = 0; i < nodes.length; i++) {
      var rate = nodes[i].getAttribute('data-rate') === 'volume' ? VOLUME_RATE : WEIGHT_RATE;
      nodes[i].textContent = rate.toLocaleString('en-US') + '₮';
    }
  }

  // Esc товчоор цэсийг хаана
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var drawer = document.getElementById('sideDrawer');
    if (drawer) drawer.classList.remove('open');
  });

  global.toggleMenu = toggleMenu;
  global.Uudam = {
    WEIGHT_RATE: WEIGHT_RATE,
    VOLUME_RATE: VOLUME_RATE,
    escapeHtml: escapeHtml,
    volumeM3: volumeM3,
    formatMoney: formatMoney,
    calcCost: calcCost,
    fillRates: fillRates
  };
})(window);

/* ===== УУДАМ CARGO — Ачааны мэдээллийн сан ===== */

const CARGO_STORAGE_KEY = "uudam_cargos_v1";

function getCargoRecords() {
  try {
    const data = JSON.parse(
      localStorage.getItem(CARGO_STORAGE_KEY) || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function saveCargoRecords(cargos) {
  localStorage.setItem(
    CARGO_STORAGE_KEY,
    JSON.stringify(cargos)
  );
}

function normalizeCargoPhone(phone) {
  let digits = String(phone || "").replace(/\D/g, "");

  if (digits.startsWith("976") && digits.length === 11) {
    digits = digits.slice(3);
  }

  return digits;
}

// Админ самбараас шинэ ачаа бүртгэх
function saveCargo(cargo) {
  const cargos = getCargoRecords();

  const newCargo = {
    id: cargo.id || (
      Date.now().toString() +
      Math.random().toString(36).slice(2, 7)
    ),
    customer_name: String(cargo.customer_name || "").trim(),
    phone: normalizeCargoPhone(cargo.phone),
    cargo_code: String(cargo.cargo_code || "").trim(),
    price: Number(cargo.price) || 0,
    arrival_date: cargo.arrival_date || "",
    status: cargo.status || "Замд явж байна"
  };

  if (
    !newCargo.customer_name ||
    newCargo.phone.length !== 8 ||
    !newCargo.cargo_code
  ) {
    throw new Error("Нэр, утас, ачааны кодоо шалгана уу.");
  }

  const duplicate = cargos.some(
    item => item.cargo_code.toLowerCase() ===
      newCargo.cargo_code.toLowerCase()
  );

  if (duplicate) {
    throw new Error("Энэ ачааны код өмнө нь бүртгэгдсэн байна.");
  }

  cargos.push(newCargo);
  saveCargoRecords(cargos);

  return newCargo;
}
const CARGO_STORAGE_KEY = "uudam_cargos_v1";
