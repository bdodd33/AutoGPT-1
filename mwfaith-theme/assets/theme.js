/* ============================================================
   MWFaith — Theme JS
   Lightweight, dependency-free storefront interactions.
   ============================================================ */
(function () {
  'use strict';

  const money = (cents) => {
    const fmt = window.MWFAITH_MONEY_FORMAT || '${{amount}}';
    const value = (cents / 100).toFixed(2);
    return fmt.replace(/\{\{\s*amount\s*\}\}/, value);
  };

  /* ---------- Mobile navigation ---------- */
  function initNav() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-site-nav]');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Cart drawer ---------- */
  async function fetchCart() {
    const res = await fetch('/cart.js', { headers: { 'Accept': 'application/json' } });
    return res.json();
  }

  function updateCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.hidden = count === 0;
    });
  }

  async function addToCart(form) {
    const btn = form.querySelector('[type="submit"]');
    const original = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }
    try {
      const formData = new FormData(form);
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      });
      if (!res.ok) throw new Error('Add to cart failed');
      const cart = await fetchCart();
      updateCartCount(cart.item_count);
      openDrawer(cart);
      if (btn) btn.textContent = 'Added ✓';
    } catch (e) {
      if (btn) btn.textContent = 'Unavailable';
      console.error(e);
    } finally {
      if (btn) setTimeout(() => { btn.disabled = false; btn.textContent = original; }, 1600);
    }
  }

  function renderDrawer(cart) {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;
    const body = drawer.querySelector('[data-cart-body]');
    const footer = drawer.querySelector('[data-cart-footer]');
    if (!cart.items.length) {
      body.innerHTML = '<p class="text-muted center" style="padding:3rem 0;">Your cart is empty.</p>';
      if (footer) footer.hidden = true;
      return;
    }
    body.innerHTML = cart.items.map((item) => `
      <div class="drawer-item">
        <img src="${item.image ? item.image.replace(/(\.[^.]+)$/, '_120x$1') : ''}" alt="${item.product_title}" width="64" height="80">
        <div>
          <p class="drawer-item__title">${item.product_title}</p>
          <p class="text-muted" style="font-size:.85rem;">${item.variant_title || ''}</p>
          <p>${money(item.final_line_price)}</p>
        </div>
      </div>`).join('');
    if (footer) {
      footer.hidden = false;
      const subtotal = footer.querySelector('[data-cart-subtotal]');
      if (subtotal) subtotal.textContent = money(cart.total_price);
    }
  }

  function openDrawer(cart) {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;
    if (cart) renderDrawer(cart);
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    const drawer = document.querySelector('[data-cart-drawer]');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function initCart() {
    document.querySelectorAll('[data-product-form]').forEach((form) => {
      form.addEventListener('submit', (e) => { e.preventDefault(); addToCart(form); });
    });
    document.querySelectorAll('[data-cart-open]').forEach((b) =>
      b.addEventListener('click', async (e) => { e.preventDefault(); openDrawer(await fetchCart()); }));
    document.querySelectorAll('[data-cart-close]').forEach((b) =>
      b.addEventListener('click', closeDrawer));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  }

  /* ---------- Product variant selection ---------- */
  function initProductOptions() {
    const root = document.querySelector('[data-product-root]');
    if (!root) return;
    let variants = [];
    try { variants = JSON.parse(root.querySelector('[data-variants]').textContent); } catch (e) { return; }
    const idInput = root.querySelector('[name="id"]');
    const priceEl = root.querySelector('[data-product-price]');
    const selected = {};

    function syncVariant() {
      const match = variants.find((v) =>
        v.options.every((opt, i) => selected['option' + (i + 1)] === undefined || opt === selected['option' + (i + 1)]));
      if (match) {
        idInput.value = match.id;
        if (priceEl) priceEl.textContent = money(match.price);
        const btn = root.querySelector('[type="submit"]');
        if (btn) { btn.disabled = !match.available; btn.textContent = match.available ? 'Add to Cart' : 'Sold Out'; }
      }
    }

    root.querySelectorAll('[data-option]').forEach((el) => {
      el.addEventListener('click', () => {
        const key = el.dataset.optionKey;
        const group = root.querySelectorAll(`[data-option-key="${key}"]`);
        group.forEach((g) => g.classList.remove('swatch--active', 'size-pill--active'));
        el.classList.add(el.classList.contains('swatch') ? 'swatch--active' : 'size-pill--active');
        selected[key] = el.dataset.option;
        syncVariant();
      });
    });
    // Gallery thumbs
    root.querySelectorAll('[data-thumb]').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const main = root.querySelector('[data-main-image]');
        if (main) main.src = thumb.dataset.full || thumb.src;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initReveal();
    initCart();
    initProductOptions();
  });
})();
