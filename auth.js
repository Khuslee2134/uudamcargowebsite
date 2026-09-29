(function () {
  const AUTH_KEY = 'uudamAuthState';
  const OTP_KEY = 'uudamPendingOtp';
  const SHIPMENTS_KEY = 'uudamShipments';

  const DEMO_SHIPMENTS = {
    '+97699112233': [
      {
        id: 'NC-2048',
        route: 'Эрээн → Дархан',
        status: 'Дархан агуулахад ирсэн',
        eta: '2026.09.29',
        weight: '12 кг',
        lastUpdated: '2026.09.29 10:30'
      },
      {
        id: 'NC-2201',
        route: 'Эрээн → Дархан',
        status: 'Замд явж байна',
        eta: '2026.10.01',
        weight: '8 кг',
        lastUpdated: '2026.09.28 16:45'
      }
    ],
    '+97699001122': [
      {
        id: 'NC-1188',
        route: 'Эрээн → Дархан',
        status: 'Хүргэлт дууссан',
        eta: '2026.09.25',
        weight: '18 кг',
        lastUpdated: '2026.09.25 12:10'
      }
    ]
  };

  function normalizePhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('976')) return '+' + digits;
    if (digits.length >= 8) return '+' + digits;
    return '';
  }

  function ensureDemoData() {
    if (!localStorage.getItem(SHIPMENTS_KEY)) {
      localStorage.setItem(SHIPMENTS_KEY, JSON.stringify(DEMO_SHIPMENTS));
    }
  }

  function getAuthState() {
    try {
      const saved = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
      if (!saved) return { loggedIn: false, phone: '' };
      return saved;
    } catch (error) {
      return { loggedIn: false, phone: '' };
    }
  }

  function setAuthState(state) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  }

  function getShipmentsMap() {
    try {
      const saved = JSON.parse(localStorage.getItem(SHIPMENTS_KEY) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch (error) {
      return {};
    }
  }

  function getShipmentsByPhone(phone) {
    const map = getShipmentsMap();
    return Array.isArray(map[phone]) ? map[phone] : [];
  }

  function renderHeaderButton() {
    const button = document.getElementById('loginButton');
    if (!button) return;
    const auth = getAuthState();
    const label = button.querySelector('.user-label');
    const icon = button.querySelector('.user-icon');
    const isLoggedIn = !!auth.loggedIn && !!auth.phone;
    button.setAttribute('aria-label', isLoggedIn ? 'Профайл нээх' : 'Нэвтрэх');
    if (label) {
      label.textContent = isLoggedIn ? 'Профайл' : 'Нэвтрэх';
    }
    if (icon) {
      icon.innerHTML = isLoggedIn
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 12 12Zm0 2.25c-3.22 0-6.25 1.63-7.5 4.12.78 1.58 2.9 2.63 7.5 2.63s6.72-1.05 7.5-2.63C18.25 16.13 15.22 14.25 12 14.25Z"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.75A4.75 4.75 0 1 1 12 12.25 4.75 4.75 0 0 1 12 2.75Zm0 10.25c-4.74 0-8.5 2.51-8.5 5.5v1.5h17v-1.5c0-2.99-3.76-5.5-8.5-5.5Z"/></svg>';
    }
  }

  function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    const phoneInput = document.getElementById('phoneInput');
    if (phoneInput) {
      phoneInput.focus();
    }
  }

  function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function setStatus(message, isError) {
    const status = document.getElementById('authStatus');
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('error', !!isError);
    status.classList.toggle('success', !isError && !!message);
  }

  function setLoading(button, isLoading, text) {
    if (!button) return;
    button.disabled = isLoading;
    button.classList.toggle('is-loading', isLoading);
    if (text) {
      button.dataset.defaultText = button.textContent;
      button.textContent = text;
    } else if (button.dataset.defaultText) {
      button.textContent = button.dataset.defaultText;
    }
  }

  function sendOtp() {
    const phoneInput = document.getElementById('phoneInput');
    const phone = normalizePhone(phoneInput ? phoneInput.value : '');
    const sendButton = document.getElementById('sendOtpBtn');

    if (!phone) {
      setStatus('Зөв утасны дугаар оруулна уу.', true);
      return;
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const payload = {
      phone,
      otp,
      expiresAt: Date.now() + 180000
    };

    localStorage.setItem(OTP_KEY, JSON.stringify(payload));
    setLoading(sendButton, true, 'Илгээж байна...');
    setStatus('Баталгаажуулах код илгээсэн. Демо код: ' + otp, false);

    const otpStep = document.getElementById('otpStep');
    if (otpStep) {
      otpStep.classList.add('visible');
    }

    const otpInput = document.getElementById('otpInput');
    if (otpInput) {
      otpInput.value = '';
      setTimeout(() => otpInput.focus(), 50);
    }

    setTimeout(() => {
      setLoading(sendButton, false);
    }, 1000);
  }

  function verifyOtp() {
    const otpInput = document.getElementById('otpInput');
    const otp = otpInput ? otpInput.value.trim() : '';
    const verifyButton = document.getElementById('verifyOtpBtn');
    const pending = JSON.parse(localStorage.getItem(OTP_KEY) || 'null');

    if (!pending) {
      setStatus('Баталгаажуулах хүсэлт олдсонгүй. Шинэ код илгээж үзнэ үү.', true);
      return;
    }

    if (Date.now() > pending.expiresAt) {
      localStorage.removeItem(OTP_KEY);
      setStatus('Баталгаажуулах код хугацаа нь дууссан байна. Шинэ код аваарай.', true);
      return;
    }

    if (String(otp) !== String(pending.otp)) {
      setStatus('Буруу баталгаажуулах код байна. Кодоо шалгаад дахин оролдоно уу.', true);
      return;
    }

    setLoading(verifyButton, true, 'Шалгаж байна...');
    setTimeout(function () {
      setAuthState({ loggedIn: true, phone: pending.phone });
      localStorage.removeItem(OTP_KEY);
      closeLoginModal();
      setLoading(verifyButton, false);
      renderHeaderButton();
      setStatus('', false);

      if (window.location.pathname.endsWith('/profile.html') || window.location.pathname.endsWith('profile.html')) {
        renderProfilePage();
      }
    }, 1000);
  }

  function logoutUser() {
    setAuthState({ loggedIn: false, phone: '' });
    localStorage.removeItem(OTP_KEY);
    renderHeaderButton();
    if (window.location.pathname.endsWith('/profile.html') || window.location.pathname.endsWith('profile.html')) {
      window.location.href = 'index.html';
    }
  }

  function renderProfilePage() {
    const auth = getAuthState();
    const phoneEl = document.getElementById('profilePhone');
    const listEl = document.getElementById('shipmentsList');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!auth.loggedIn || !auth.phone) {
      window.location.href = 'index.html';
      return;
    }

    if (phoneEl) {
      phoneEl.textContent = auth.phone;
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', logoutUser);
    }

    const shipments = getShipmentsByPhone(auth.phone);
    if (!listEl) return;

    if (!shipments.length) {
      listEl.innerHTML = '<div class="empty-state">Энэ утасны дугаартай холбоотой ачаа олдсонгүй.</div>';
      return;
    }

    listEl.innerHTML = shipments
      .map(function (item) {
        return '<div class="shipment-item">' +
          '<div class="shipment-top">' +
            '<span class="shipment-id">' + item.id + '</span>' +
            '<span class="shipment-status">' + item.status + '</span>' +
          '</div>' +
          '<div class="shipment-meta"><strong>Чиглэл:</strong> ' + item.route + '</div>' +
          '<div class="shipment-meta"><strong>Өнгөрөх хугацаа:</strong> ' + item.eta + '</div>' +
          '<div class="shipment-meta"><strong>Жин:</strong> ' + item.weight + '</div>' +
          '<div class="shipment-meta"><strong>Шинэчлэгдсэн:</strong> ' + item.lastUpdated + '</div>' +
        '</div>';
      })
      .join('');
  }

  function bindAuthUI() {
    ensureDemoData();
    renderHeaderButton();

    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
      loginButton.addEventListener('click', function () {
        const auth = getAuthState();
        if (auth.loggedIn && auth.phone) {
          window.location.href = 'profile.html';
        } else {
          openLoginModal();
        }
      });
    }

    const closeButtons = document.querySelectorAll('[data-close="auth-modal"]');
    closeButtons.forEach(function (button) {
      button.addEventListener('click', closeLoginModal);
    });

    const sendButton = document.getElementById('sendOtpBtn');
    if (sendButton) {
      sendButton.addEventListener('click', sendOtp);
    }

    const verifyButton = document.getElementById('verifyOtpBtn');
    if (verifyButton) {
      verifyButton.addEventListener('click', verifyOtp);
    }

    const resendButton = document.getElementById('resendOtpBtn');
    if (resendButton) {
      resendButton.addEventListener('click', sendOtp);
    }

    const otpInput = document.getElementById('otpInput');
    if (otpInput) {
      otpInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          verifyOtp();
        }
      });
    }

    const phoneInput = document.getElementById('phoneInput');
    if (phoneInput) {
      phoneInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          sendOtp();
        }
      });
    }

    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.addEventListener('click', function (event) {
        if (event.target === modal) {
          closeLoginModal();
        }
      });
    }

    if (window.location.pathname.endsWith('/profile.html') || window.location.pathname.endsWith('profile.html')) {
      renderProfilePage();
    }
  }

  document.addEventListener('DOMContentLoaded', bindAuthUI);
  window.UUDAM_AUTH = {
    normalizePhone,
    getAuthState,
    setAuthState,
    logoutUser,
    openLoginModal,
    closeLoginModal,
    renderProfilePage,
    getShipmentsByPhone
  };
})();
