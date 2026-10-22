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

  // ==================================================================
  // Ачааны бүртгэлийн сан — localStorage
  // Түлхүүр: uudamCargoShipments (admin.html болон index.html хоёул эндээс ашиглана)
  // Бүртгэлийн бүтэц: { name, phone, code, date, status, [price] }
  // Бичихдээ JSON.stringify(), уншихдаа JSON.parse() ашиглана.
  // ==================================================================
  var SHIPMENTS_KEY = 'uudamCargoShipments';
  var SHIPMENT_STATUSES = ['Эрээнээс ачигдсан', 'Дарханд буусан', 'Авсан'];

  function parseShipments() {
    try {
      var parsed = JSON.parse(localStorage.getItem(SHIPMENTS_KEY));
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  // Хадгалсан бүх ачааг унших (хоосон/эвдэрсэн бичлэгийг алгасна)
  function listShipments() {
    return parseShipments().filter(function (item) {
      return item && typeof item === 'object' && String(item.code || '').trim() !== '';
    });
  }

  // localStorage-т бүхий л бүртгэлийг хадгалах
  function writeShipments(list) {
    localStorage.setItem(SHIPMENTS_KEY, JSON.stringify(list));
  }

  // Код харьцуулахад жигд хэлбэр (зай хасан, ТОМ үсэг)
  function normalizeShipmentCode(code) {
    return String(code == null ? '' : code).trim().toUpperCase();
  }

  function normalizeShipmentStatus(status) {
    var value = String(status == null ? '' : status).trim();
    return SHIPMENT_STATUSES.indexOf(value) >= 0 ? value : SHIPMENT_STATUSES[0];
  }

  // Давхардлыг шалгах
  function isCodeInList(list, code, exceptCode) {
    var wanted = normalizeShipmentCode(code);
    var except = normalizeShipmentCode(exceptCode || '');
    return list.some(function (item) {
      var itemCode = normalizeShipmentCode(item && item.code);
      return itemCode === wanted && itemCode !== except;
    });
  }

  // Ачааны код давхардсан эсэхийг шалгах (exceptCode — засах үед өөрийн кодыг тоохгүй)
  function isCodeTaken(code, exceptCode) {
    return isCodeInList(listShipments(), code, exceptCode);
  }

  // Тухайн кодтой ачааг олох (олдохгүй бол null)
  function findShipment(code) {
    var wanted = normalizeShipmentCode(code);
    var found = listShipments().find(function (item) {
      return normalizeShipmentCode(item.code) === wanted;
    });
    return found || null;
  }

  function findShipmentIndex(list, code) {
    var wanted = normalizeShipmentCode(code);
    return list.findIndex(function (item) {
      return normalizeShipmentCode(item.code) === wanted;
    });
  }

  // Шинэ ачаа хадгалах. Хоосон мэдээлэл хадгалахгүй; код давхардвал алдаа буцна.
  function addShipment(data) {
    data = data || {};
    var record = {
      name: String(data.name == null ? '' : data.name).trim(),
      phone: String(data.phone == null ? '' : data.phone).trim(),
      code: normalizeShipmentCode(data.code),
      date: String(data.date == null ? '' : data.date).trim(),
      status: normalizeShipmentStatus(data.status)
    };
    var price = String(data.price == null ? '' : data.price).trim();
    if (price !== '') record.price = price; // форм дэх "Үнэ" талбар — заавал биш

    if (!record.code || !record.name || !record.phone) {
      return { ok: false, error: 'Нэр, утасны дугаар, ачааны кодыг заавал бөглөнө үү.' };
    }
    if (isCodeTaken(record.code)) {
      return { ok: false, error: record.code + ' кодтой ачаа аль хэдийн бүртгэлтэй байна.' };
    }

    var list = listShipments();
    list.unshift(record);
    writeShipments(list);
    return { ok: true, record: record };
  }

  // Ачааны мэдээлэл засах — өөрчилсөн талбруудыг л бичнэ (тэгж байхад хоослохгүй)
  function updateShipment(code, changes) {
    changes = changes || {};
    var list = listShipments();
    var index = findShipmentIndex(list, code);
    if (index < 0) return { ok: false, error: 'Бүртгэл олдсонгүй.' };

    var record = list[index];

    var nextCode = changes.code != null ? normalizeShipmentCode(changes.code) : normalizeShipmentCode(record.code);
    if (!nextCode) return { ok: false, error: 'Ачааны код хоосон байна.' };
    if (nextCode !== normalizeShipmentCode(record.code) && isCodeInList(list, nextCode, record.code)) {
      return { ok: false, error: nextCode + ' кодтой өөр бүртгэл байгаа тул солих боломжгүй.' };
    }

    if (changes.name != null && String(changes.name).trim() !== '') record.name = String(changes.name).trim();
    if (changes.phone != null && String(changes.phone).trim() !== '') record.phone = String(changes.phone).trim();
    if (changes.date != null && String(changes.date).trim() !== '') record.date = String(changes.date).trim();
    if (changes.status != null) record.status = normalizeShipmentStatus(changes.status);
    if (changes.price != null) {
      var price = String(changes.price).trim();
      if (price !== '') record.price = price;
      else delete record.price;
    }

    record.code = nextCode;
    writeShipments(list);
    return { ok: true, record: record };
  }

  // Ачааны төлөв зөвхөн шинэчлэх
  function updateShipmentStatus(code, status) {
    return updateShipment(code, { status: status });
  }

  // Ачаа устгах
  function deleteShipment(code) {
    var list = listShipments();
    var index = findShipmentIndex(list, code);
    if (index < 0) return { ok: false, error: 'Бүртгэл олдсонгүй.' };
    var removed = list.splice(index, 1)[0];
    writeShipments(list);
    return { ok: true, record: removed };
  }

  // Өөр tab дээр localStorage өөрчлөгдвөл 'storage' event ирдэг бөгөөд
  // хуудсууд хялбархан сонсохоор 'uudam:shipments-changed' event болгон дамжуулна.
  window.addEventListener('storage', function (e) {
    if (!e || e.key !== SHIPMENTS_KEY) return;
    try {
      document.dispatchEvent(new CustomEvent('uudam:shipments-changed'));
    } catch (err) { /* event дэмжигдэхгүй үед алгасна */ }
  });

  global.toggleMenu = toggleMenu;
  global.Uudam = {
    WEIGHT_RATE: WEIGHT_RATE,
    VOLUME_RATE: VOLUME_RATE,
    escapeHtml: escapeHtml,
    volumeM3: volumeM3,
    formatMoney: formatMoney,
    calcCost: calcCost,
    fillRates: fillRates,
    // Ачааны бүртгэлийн сан (localStorage: uudamCargoShipments)
    SHIPMENTS_KEY: SHIPMENTS_KEY,
    SHIPMENT_STATUSES: SHIPMENT_STATUSES,
    listShipments: listShipments,
    findShipment: findShipment,
    isCodeTaken: isCodeTaken,
    addShipment: addShipment,
    updateShipment: updateShipment,
    updateShipmentStatus: updateShipmentStatus,
    deleteShipment: deleteShipment
  };
})(window);

