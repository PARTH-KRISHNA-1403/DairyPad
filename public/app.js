// DairyPad Application Logic (Light Theme Only, Zero-Scroll)
document.addEventListener('DOMContentLoaded', () => {
  // Ensure Light Theme Only
  document.documentElement.setAttribute('data-bs-theme', 'light');

  // --- App State ---
  let currentDate = new Date();
  let whatsappPhoneNumber = '';
  let activeProductId = 'prod-milk';
  const soundEnabled = true;

  const CUSTOM_ITEMS_KEY = 'dairypad_custom_items';

  // Formatting Rule:
  // If float points are 000 then only display main integer,
  // If there is one digit after . then only display that particular digit,
  // Else show all 3 floating points.
  function formatQuantity(val) {
    if (val === '' || val === null || val === undefined) return '';
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    const fixed3 = num.toFixed(3);
    const [intPart, decPart] = fixed3.split('.');
    if (decPart === '000') {
      return intPart;
    } else if (decPart.endsWith('00')) {
      return `${intPart}.${decPart[0]}`;
    } else {
      return fixed3;
    }
  }

  // Default Dairy Products - Default unit is Kg for all items
  let products = [
    {
      id: 'prod-milk',
      name: 'Milk',
      checked: true,
      quantity: 1.5,
      unit: 'Kg',
      isCustom: false
    },
    {
      id: 'prod-ghee',
      name: 'Ghee',
      checked: false,
      quantity: 0.5,
      unit: 'Kg',
      isCustom: false
    },
    {
      id: 'prod-curd',
      name: 'Curd',
      checked: false,
      quantity: 1,
      unit: 'Kg',
      isCustom: false
    }
  ];

  // Persistent Custom Items Loader
  function loadCustomItems() {
    try {
      const saved = localStorage.getItem(CUSTOM_ITEMS_KEY);
      if (saved) {
        const items = JSON.parse(saved);
        if (Array.isArray(items)) {
          items.forEach(item => {
            if (!products.some(p => p.id === item.id)) {
              products.push({
                ...item,
                isCustom: true
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load custom items from localStorage', e);
    }
  }

  function saveCustomItems() {
    try {
      const customItems = products.filter(p => p.isCustom);
      localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(customItems));
    } catch (e) {
      console.warn('Failed to save custom items to localStorage', e);
    }
  }

  // --- DOM Elements ---
  const dateCardWrapper = document.getElementById('dateCardWrapper');
  const dateDisplayText = document.getElementById('dateDisplayText');
  const nativeDatePicker = document.getElementById('nativeDatePicker');
  const prevDayBtn = document.getElementById('prevDayBtn');
  const nextDayBtn = document.getElementById('nextDayBtn');

  const productListContainer = document.getElementById('productList');
  const extraItemName = document.getElementById('extraItemName');
  const extraItemQty = document.getElementById('extraItemQty');
  const extraItemUnit = document.getElementById('extraItemUnit');
  const addExtraItemBtn = document.getElementById('addExtraItemBtn');

  const sendBtn = document.getElementById('sendBtn');
  const quickMinus05Btn = document.getElementById('quickMinus05Btn');
  const quickAdd05Btn = document.getElementById('quickAdd05Btn');
  const quickAdd10Btn = document.getElementById('quickAdd10Btn');
  const quickMinus10Btn = document.getElementById('quickMinus10Btn');
  const ovalUnit05 = document.getElementById('ovalUnit05');
  const ovalUnit10 = document.getElementById('ovalUnit10');
  const selectedProductNameBadge = document.getElementById('selectedProductNameBadge');

  const appToast = document.getElementById('appToast');
  const toastMessage = document.getElementById('toastMessage');
  const bsToast = new bootstrap.Toast(appToast, { delay: 3000 });

  // --- Audio Synthesis for Tactile Feedback ---
  let audioCtx = null;
  function playClickSound(freq = 600, type = 'sine', duration = 0.05) {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // --- Show Toast Helper ---
  function showToast(msg, isSuccess = true) {
    toastMessage.innerHTML = `<i class="bi ${isSuccess ? 'bi-check-circle-fill text-light' : 'bi-exclamation-triangle-fill text-warning'}"></i> ${msg}`;
    appToast.className = `toast align-items-center text-white ${isSuccess ? 'bg-success' : 'bg-danger'} border-0 rounded-3 shadow`;
    bsToast.show();
  }

  // --- Date Handling ---
  function formatDateForDisplay(date) {
    const day = date.getDate();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function updateDateDisplay() {
    dateDisplayText.textContent = formatDateForDisplay(currentDate);
    nativeDatePicker.value = formatDateForInput(currentDate);
  }

  // Top rectangle click opens datepicker
  dateCardWrapper.addEventListener('click', (e) => {
    if (e.target.closest('#prevDayBtn') || e.target.closest('#nextDayBtn')) return;
    playClickSound(520);
    try {
      if (typeof nativeDatePicker.showPicker === 'function') {
        nativeDatePicker.showPicker();
      } else {
        nativeDatePicker.click();
      }
    } catch (err) {
      nativeDatePicker.focus();
    }
  });

  nativeDatePicker.addEventListener('change', (e) => {
    if (e.target.value) {
      const [y, m, d] = e.target.value.split('-').map(Number);
      currentDate = new Date(y, m - 1, d);
      updateDateDisplay();
    }
  });

  function triggerDateNavAnim(btn) {
    if (!btn) return;
    btn.classList.remove('btn-click-anim');
    void btn.offsetWidth;
    btn.classList.add('btn-click-anim');
    setTimeout(() => {
      btn.classList.remove('btn-click-anim');
      btn.blur();
    }, 120);
  }

  prevDayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerDateNavAnim(prevDayBtn);
    playClickSound(480);
    currentDate.setDate(currentDate.getDate() - 1);
    updateDateDisplay();
  });

  nextDayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerDateNavAnim(nextDayBtn);
    playClickSound(560);
    currentDate.setDate(currentDate.getDate() + 1);
    updateDateDisplay();
  });

  [prevDayBtn, nextDayBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('mouseup', () => btn.blur());
      btn.addEventListener('mouseleave', () => btn.blur());
      btn.addEventListener('touchend', () => btn.blur(), { passive: true });
    }
  });

  // --- Fetch WhatsApp Number from Backend & LocalStorage ---
  async function fetchConfig() {
    // 1. Check browser localStorage first for instant recall
    const localNumber = localStorage.getItem('dairypad_whatsapp_number');
    if (localNumber) {
      whatsappPhoneNumber = localNumber;
    }

    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data.whatsappNumber) {
          whatsappPhoneNumber = data.whatsappNumber;
          localStorage.setItem('dairypad_whatsapp_number', data.whatsappNumber);
        }
      }
    } catch (err) {
      console.warn('Could not load /api/config', err);
    }
  }

  // --- Product List Rendering & Selection Rules ---
  // RULE: An unticked item can NEVER be active!
  function getActiveProduct() {
    if (!activeProductId) return null;
    const active = products.find(p => p.id === activeProductId);
    if (active && active.checked) {
      return active;
    }
    // If not checked or not found, clear active state
    activeProductId = null;
    return null;
  }

  function updateQuickButtonsLabel() {
    const active = getActiveProduct();
    if (selectedProductNameBadge) {
      selectedProductNameBadge.textContent = active ? active.name.toUpperCase() : 'NONE';
    }
    if (ovalUnit05) ovalUnit05.textContent = active ? active.unit : 'Kg';
    if (ovalUnit10) ovalUnit10.textContent = active ? active.unit : 'Kg';
  }

  function renderProducts() {
    productListContainer.innerHTML = '';

    // Verify active product adheres to rule: an unticked item can never be active
    getActiveProduct();

    products.forEach((product) => {
      const isChecked = !!product.checked;
      // An unticked item can NEVER be active/selected!
      const isSelected = isChecked && (product.id === activeProductId);

      const card = document.createElement('div');
      card.className = `product-row-card d-flex align-items-center justify-content-between ${isChecked ? 'is-checked' : ''} ${isSelected ? 'is-selected' : ''}`;
      card.dataset.id = product.id;

      card.innerHTML = `
        <div class="product-left-group flex-grow-1" data-action="select-item">
          <input type="checkbox" class="form-check-input product-checkbox m-0" ${isChecked ? 'checked' : ''} id="chk-${product.id}">
          <label class="product-name-label" for="chk-${product.id}">
            ${escapeHtml(product.name)}
          </label>
        </div>

        <div class="product-qty-group">
          <input 
            type="text" 
            inputmode="decimal"
            class="form-control form-control-sm product-qty-input" 
            value="${formatQuantity(product.quantity)}" 
            data-id="${product.id}"
            aria-label="Quantity for ${escapeHtml(product.name)}"
          >
          <select class="form-select unit-dropdown" data-id="${product.id}">
            <option value="Kg" ${product.unit === 'Kg' ? 'selected' : ''}>Kg</option>
            <option value="L" ${product.unit === 'L' ? 'selected' : ''}>L</option>
            <option value="g" ${product.unit === 'g' ? 'selected' : ''}>g</option>
            <option value="ml" ${product.unit === 'ml' ? 'selected' : ''}>ml</option>
          </select>
          ${product.isCustom ? `
            <button class="btn btn-sm btn-link text-danger custom-item-delete-btn" data-action="delete-item" data-id="${product.id}" title="Remove item">
              <i class="bi bi-trash3-fill"></i>
            </button>
          ` : ''}
        </div>
      `;

      // Event: Clicking cell or check box
      // Rule 1: Clicking ticks the item and activates the cell
      // Rule 2: Clicking again on that item will untick it
      // Rule 3: An unticked item can never be active
      card.addEventListener('click', (e) => {
        // Ignore interactions on inputs, selects, or delete buttons
        if (e.target.closest('input[type="text"]') || e.target.closest('select') || e.target.closest('.custom-item-delete-btn')) {
          return;
        }

        if (e.target.type === 'checkbox') {
          if (e.target.checked) {
            // Ticked via checkbox -> tick item and activate cell
            product.checked = true;
            activeProductId = product.id;
            playClickSound(620);
          } else {
            // Unticked via checkbox -> untick item
            product.checked = false;
            if (activeProductId === product.id) {
              const other = products.find(p => p.checked && p.id !== product.id);
              activeProductId = other ? other.id : null;
            }
            playClickSound(400);
          }
          renderProducts();
          updateQuickButtonsLabel();
          return;
        }

        // Clicking on the cell / row
        if (!product.checked) {
          // Unticked -> tick item and activate cell
          product.checked = true;
          activeProductId = product.id;
          playClickSound(650);
        } else {
          // Already ticked:
          if (activeProductId === product.id) {
            // "clicking again on that item will untick it"
            product.checked = false;
            const other = products.find(p => p.checked && p.id !== product.id);
            activeProductId = other ? other.id : null;
            playClickSound(400);
          } else {
            // Ticked but was not the active cell: activate it
            activeProductId = product.id;
            playClickSound(600);
          }
        }
        renderProducts();
        updateQuickButtonsLabel();
      });

      // Quantity Input edit
      const qtyInput = card.querySelector('.product-qty-input');
      qtyInput.addEventListener('input', (e) => {
        const trimmed = e.target.value.trim();
        if (trimmed === '') {
          product.quantity = '';
        } else {
          const val = parseFloat(trimmed);
          if (!isNaN(val)) {
            product.quantity = val;
          }
        }
      });

      qtyInput.addEventListener('blur', (e) => {
        const trimmed = e.target.value.trim();
        if (trimmed === '') {
          product.quantity = '';
          e.target.value = '';
          return;
        }
        let val = parseFloat(trimmed);
        if (isNaN(val) || val < 0) val = 0;
        product.quantity = Math.round(val * 1000) / 1000;
        e.target.value = formatQuantity(product.quantity);
      });

      qtyInput.addEventListener('focus', () => {
        if (product.checked && activeProductId !== product.id) {
          activeProductId = product.id;
          renderProducts();
          updateQuickButtonsLabel();
        }
      });

      // Unit Dropdown change
      const unitSelect = card.querySelector('.unit-dropdown');
      unitSelect.addEventListener('change', (e) => {
        product.unit = e.target.value;
        if (product.isCustom) {
          saveCustomItems();
        }
        if (activeProductId === product.id) {
          updateQuickButtonsLabel();
        }
      });

      // Delete Custom Item
      if (product.isCustom) {
        const delBtn = card.querySelector('.custom-item-delete-btn');
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          products = products.filter(p => p.id !== product.id);
          saveCustomItems();
          if (activeProductId === product.id) {
            const next = products.find(p => p.checked);
            activeProductId = next ? next.id : null;
          }
          renderProducts();
          updateQuickButtonsLabel();
          showToast(`Removed "${product.name}"`, false);
        });
      }

      productListContainer.appendChild(card);
    });

    updateQuickButtonsLabel();
  }

  // --- Quick Step Operations (+0.5, +1.0, -0.5, -1.0) ---
  function triggerBtnClickAnimation(btn) {
    if (!btn) return;
    btn.classList.remove('btn-click-anim');
    void btn.offsetWidth;
    btn.classList.add('btn-click-anim');
    setTimeout(() => {
      btn.classList.remove('btn-click-anim');
      btn.blur();
    }, 140);
  }

  function incrementActiveProduct(amount, btnElement) {
    triggerBtnClickAnimation(btnElement);

    const active = getActiveProduct();
    if (!active) {
      showToast('Please tick an item first to add quantity', false);
      return;
    }

    const current = (active.quantity === '' || active.quantity === null || active.quantity === undefined || isNaN(parseFloat(active.quantity))) 
      ? 0 
      : parseFloat(active.quantity);
    active.quantity = Math.round((current + amount) * 1000) / 1000;

    const card = document.querySelector(`.product-row-card[data-id="${active.id}"]`);
    if (card) {
      const input = card.querySelector('.product-qty-input');
      if (input) {
        input.value = formatQuantity(active.quantity);
        input.classList.remove('qty-pop');
        void input.offsetWidth;
        input.classList.add('qty-pop');
      }
    }

    playClickSound(amount === 0.5 ? 700 : 850, 'triangle', 0.08);
  }

  function decrementActiveProduct(amount, btnElement) {
    triggerBtnClickAnimation(btnElement);

    const active = getActiveProduct();
    if (!active) {
      showToast('Please tick an item first', false);
      return;
    }

    const current = (active.quantity === '' || active.quantity === null || active.quantity === undefined || isNaN(parseFloat(active.quantity))) 
      ? 0 
      : parseFloat(active.quantity);
    active.quantity = Math.max(0, Math.round((current - amount) * 1000) / 1000);

    const card = document.querySelector(`.product-row-card[data-id="${active.id}"]`);
    if (card) {
      const input = card.querySelector('.product-qty-input');
      if (input) {
        input.value = formatQuantity(active.quantity);
        input.classList.remove('qty-pop');
        void input.offsetWidth;
        input.classList.add('qty-pop');
      }
    }

    playClickSound(amount === 0.5 ? 540 : 440, 'triangle', 0.08);
  }

  // Wire buttons: [ - ] [ +0.5 ] | [ +1.0 ] [ - ]
  if (quickMinus05Btn) {
    quickMinus05Btn.addEventListener('click', (e) => {
      e.preventDefault();
      decrementActiveProduct(0.5, quickMinus05Btn);
    });
  }

  if (quickAdd05Btn) {
    quickAdd05Btn.addEventListener('click', (e) => {
      e.preventDefault();
      incrementActiveProduct(0.5, quickAdd05Btn);
    });
  }

  if (quickAdd10Btn) {
    quickAdd10Btn.addEventListener('click', (e) => {
      e.preventDefault();
      incrementActiveProduct(1.0, quickAdd10Btn);
    });
  }

  if (quickMinus10Btn) {
    quickMinus10Btn.addEventListener('click', (e) => {
      e.preventDefault();
      decrementActiveProduct(1.0, quickMinus10Btn);
    });
  }

  [quickMinus05Btn, quickAdd05Btn, quickAdd10Btn, quickMinus10Btn].forEach(btn => {
    if (btn) {
      btn.addEventListener('mouseup', () => btn.blur());
      btn.addEventListener('mouseleave', () => btn.blur());
      btn.addEventListener('touchend', () => btn.blur(), { passive: true });
    }
  });

  // --- Add Extra Custom Item (Persisted for next time) ---
  function handleAddExtraItem() {
    const rawName = extraItemName.value.trim();
    if (!rawName) {
      extraItemName.focus();
      extraItemName.classList.add('is-invalid');
      setTimeout(() => extraItemName.classList.remove('is-invalid'), 1200);
      return;
    }

    const qtyStr = extraItemQty.value.trim();
    let qty = '';
    if (qtyStr !== '') {
      const parsed = parseFloat(qtyStr);
      if (!isNaN(parsed) && parsed >= 0) {
        qty = Math.round(parsed * 1000) / 1000;
      }
    }

    const unit = extraItemUnit.value || 'Kg';

    const newId = 'prod-custom-' + Date.now();
    const newItem = {
      id: newId,
      name: rawName,
      checked: true,
      quantity: qty,
      unit: unit,
      isCustom: true
    };

    products.push(newItem);
    saveCustomItems();
    activeProductId = newId;

    extraItemName.value = '';
    extraItemQty.value = '';

    renderProducts();
    updateQuickButtonsLabel();
    playClickSound(750, 'sine', 0.1);
    showToast(`Added "${rawName}"!`, true);
  }

  addExtraItemBtn.addEventListener('click', handleAddExtraItem);
  extraItemName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddExtraItem();
  });
  extraItemQty.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddExtraItem();
  });

  extraItemQty.addEventListener('blur', (e) => {
    const trimmed = e.target.value.trim();
    if (trimmed === '') {
      e.target.value = '';
      return;
    }
    let val = parseFloat(trimmed);
    if (isNaN(val) || val <= 0) {
      e.target.value = '';
    } else {
      e.target.value = formatQuantity(val);
    }
  });

  // --- Fixed Message Generation for WhatsApp ---
  // Format:
  // <Date>
  // <Milk (DairyProduct)> - <Kg (Quantity)>
  function generateFormattedMessage() {
    const formattedDate = formatDateForDisplay(currentDate);
    const checkedProducts = products.filter(p => {
      if (!p.checked) return false;
      const q = parseFloat(p.quantity);
      return !isNaN(q) && q > 0;
    });

    if (checkedProducts.length === 0) {
      return '';
    }

    const lines = [formattedDate];
    checkedProducts.forEach(p => {
      lines.push(`${p.name} - ${formatQuantity(p.quantity)} ${p.unit}`);
    });

    return lines.join('\n');
  }

  // --- Number Change Modal & 3-Second Long Press on Send Button ---
  const numberModalEl = document.getElementById('numberModal');
  const numberModal = numberModalEl ? new bootstrap.Modal(numberModalEl) : null;
  const modalPhoneNumberInput = document.getElementById('modalPhoneNumberInput');
  const saveNumberBtn = document.getElementById('saveNumberBtn');

  function openNumberModal() {
    if (!numberModal) return;
    let displayDigits = whatsappPhoneNumber.replace(/[^0-9]/g, '');
    if (displayDigits.startsWith('91') && displayDigits.length >= 12) {
      displayDigits = displayDigits.slice(2);
    }
    if (modalPhoneNumberInput) {
      modalPhoneNumberInput.value = displayDigits;
    }
    numberModal.show();
    setTimeout(() => {
      if (modalPhoneNumberInput) modalPhoneNumberInput.focus();
    }, 350);
  }

  if (saveNumberBtn) {
    saveNumberBtn.addEventListener('click', async () => {
      if (!modalPhoneNumberInput) return;
      const rawDigits = modalPhoneNumberInput.value.replace(/[^0-9]/g, '');
      if (!rawDigits) {
        showToast('Please enter a phone number', false);
        return;
      }

      // Default country code is +91
      let finalNumber = rawDigits;
      if (rawDigits.length === 10) {
        finalNumber = '91' + rawDigits;
      } else if (rawDigits.length === 12 && rawDigits.startsWith('91')) {
        finalNumber = rawDigits;
      } else if (!rawDigits.startsWith('91')) {
        finalNumber = '91' + rawDigits;
      }

      // Save immediately to localStorage for instant use
      whatsappPhoneNumber = finalNumber;
      localStorage.setItem('dairypad_whatsapp_number', finalNumber);

      try {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ whatsappNumber: finalNumber })
        });
        const data = await res.json();
        if (data.success) {
          if (numberModal) numberModal.hide();
          if (data.vercel && data.vercel.success) {
            showToast(`Saved +${finalNumber} & updated Vercel environment variable!`, true);
          } else {
            showToast(`Saved +${finalNumber}!`, true);
          }
        } else {
          showToast(data.error || 'Failed to save number', false);
        }
      } catch (e) {
        console.error('Error saving number to backend', e);
        if (numberModal) numberModal.hide();
        showToast(`Saved +${finalNumber} in browser!`, true);
      }
    });
  }

  // 3-Second Long Press on Send Button (sliding animation only appears during press-and-hold)
  let holdStartTimer = null;
  let holdCompleteTimer = null;
  let isLongPressTriggered = false;
  let pressStartTime = 0;
  const HOLD_THRESHOLD = 250; // ms before hold animation begins (prevents animation on normal clicks)
  const HOLD_TOTAL = 3000;    // 3 seconds total to trigger change number popup

  function startHold() {
    isLongPressTriggered = false;
    pressStartTime = Date.now();

    if (holdStartTimer) clearTimeout(holdStartTimer);
    if (holdCompleteTimer) clearTimeout(holdCompleteTimer);

    // Only add .is-pressing (sliding progress) if held longer than a regular click (>250ms)
    holdStartTimer = setTimeout(() => {
      sendBtn.classList.add('is-pressing');
    }, HOLD_THRESHOLD);

    // Complete 3-second hold
    holdCompleteTimer = setTimeout(() => {
      isLongPressTriggered = true;
      sendBtn.classList.remove('is-pressing');
      playClickSound(850, 'sine', 0.15);
      openNumberModal();
    }, HOLD_TOTAL);
  }

  function endHold() {
    if (holdStartTimer) {
      clearTimeout(holdStartTimer);
      holdStartTimer = null;
    }
    if (holdCompleteTimer) {
      clearTimeout(holdCompleteTimer);
      holdCompleteTimer = null;
    }
    sendBtn.classList.remove('is-pressing');
  }

  // Desktop Mouse Events
  sendBtn.addEventListener('mousedown', startHold);
  sendBtn.addEventListener('mouseup', endHold);
  sendBtn.addEventListener('mouseleave', endHold);

  // Mobile Touch Events
  sendBtn.addEventListener('touchstart', () => {
    startHold();
  }, { passive: true });
  sendBtn.addEventListener('touchend', endHold);
  sendBtn.addEventListener('touchcancel', endHold);

  function triggerSendWhatsApp() {
    playClickSound(800, 'sine', 0.12);

    const msg = generateFormattedMessage();
    if (!msg) {
      showToast('Please check at least one dairy item with quantity > 0', false);
      return;
    }

    if (!whatsappPhoneNumber || !whatsappPhoneNumber.trim()) {
      showToast('WhatsApp number not set in .env! Long press Send to configure.', false);
      return;
    }

    const cleanPhone = whatsappPhoneNumber.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(msg);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    window.open(waUrl, '_blank');
    showToast('Dispatching to WhatsApp...', true);
  }

  // Send via WhatsApp (if regular click and not a hold)
  sendBtn.addEventListener('click', (e) => {
    if (isLongPressTriggered) {
      isLongPressTriggered = false;
      e.preventDefault();
      return;
    }
    // If the user held down long enough to enter hold mode (>= HOLD_THRESHOLD) and then let go,
    // don't treat it as a send click
    const duration = Date.now() - pressStartTime;
    if (pressStartTime > 0 && duration >= HOLD_THRESHOLD) {
      pressStartTime = 0;
      e.preventDefault();
      return;
    }
    pressStartTime = 0;
    triggerSendWhatsApp();
  });

  // Helper
  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // --- Initialization ---
  loadCustomItems();
  updateDateDisplay();
  renderProducts();
  fetchConfig();
});
