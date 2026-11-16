const CATALOG = window.SHOPIFY_CATALOG;

/* ============================================================
   Product landing page — behaviour
   No dependencies. Everything you need to change is in CONFIG.
   ============================================================ */

/* ------------------------------------------------------------
   DEMO ONLY — simulated viewer count.
   Returns a number that drifts up and down within a range, so the
   pill looks alive during internal testing and the client showcase.
   This is invented data, not measured data. Before the page takes
   real customer traffic, point CONFIG.liveViewers at a real source
   or set it to null.
   ------------------------------------------------------------ */
function simulatedViewersForDemo({ min = 80, max = 160 } = {}) {
  let current = Math.floor(min + Math.random() * (max - min));
  return () => {
    current += Math.floor(Math.random() * 11) - 5; // drift by up to ±5
    current = Math.min(max, Math.max(min, current));
    return current;
  };
}

const CONFIG = {
  /* Unit price. Keep in sync with #priceNow in index.html and with
     whatever the checkout actually charges. */
  price: 119.0,

  // Manual display comparison price in pounds. Use null for Shopify value.
  compareAtPrice: 399.00,

  currency: CATALOG.currency,
  locale: "en-GB",

  /* >>> THE CHECKOUT LINK GOES HERE.
     The buy button sends the customer straight to this URL. While it
     is null the button does nothing but log a warning, so you cannot
     ship a dead button by accident. */
  checkoutUrl: null,

  /* Append the chosen colour and quantity to the checkout URL as query
     parameters. Turn on only if the checkout actually reads them —
     otherwise it may reject or ignore the extra params. */
  passOptionsToCheckout: false,

  /* Countdown mode:
       "daily" — counts down to midnight UK time and starts again the
                 next day. Everyone sees the same clock regardless of
                 their own timezone. This matches a "today only" offer,
                 and only holds up if the price actually changes at
                 midnight.
       "date"  — counts to the fixed deadline in saleEndsAt below and
                 then hides the band for good.
     Set to null for no countdown at all. */
  countdownMode: "daily",

  /* Used when countdownMode is "date". ISO 8601. */
  saleEndsAt: "2026-09-15T23:59:59+01:00",

  /* Line shown in the black top bar. */
  promoLine: "Today only — up to 70% off · Demo",

  /* Live viewer count. Set to null and the pill never renders.
     Currently on SIMULATED data for internal testing and the client
     showcase — see simulatedViewersForDemo() above.
     For a live storefront, swap it for the real figure:
       liveViewers: async () => {
         const r = await fetch("/api/live-viewers");
         return (await r.json()).count;
       }  */
  liveViewers: simulatedViewersForDemo(),

  /* How often to refresh that count, in seconds. */
  liveViewersInterval: 30,

  /* Units sold in the last 24 hours, and units left in stock.
     Both accept either a plain number (a fixed figure, as used for the
     mockup below) or a function returning the real one:
       soldLast24h: async () => (await fetch("/api/sold-24h")).json(),
     Set either to null and its line does not render at all.

     >>> DEMO FIGURES. Wire these to Shopify before the page goes live:
     the sold count comes from the product's recent orders, the stock
     count from its inventory level. A "12 left" that never moves is
     the single most recognisable false-scarcity signal there is. */
  soldLast24h: 48,
  stockLeft: 12,

  /* Units the promotion started with, used only to draw the stock bar
     (12 left out of 50 = the bar sits at 24%). Set to null and the bar
     is hidden while the number still shows. */
  stockStartedAt: 50,

  /* Short product name used inside the purchase toast, so the pill does
     not have to carry the full H1. */
  productShortName: "Smeg Kitchen Collection - Six Pieces",
  knifeProductName: "SMEG Knife Set",

  /* The real Shopify product the page reads at runtime. Title, price and
     the colour options are pulled from /products/<handle>.js, so the page
     mirrors the product instead of the hardcoded mock. Off Shopify (local
     preview) the fetch fails and the mock below is what shows. */
  productHandle: null,

  /* Real Shopify variant behind each colour. The buy button posts the
     matching id, so the order carries the colour as a proper variant
     instead of a note. Regenerate with create-variants-product.mjs. */
  variantByColour: Object.fromEntries(CATALOG.products.main.variants.map(v => [v.title, v.id])),

  /* Recent-purchase toasts. Accepts the array below, or a function
     returning one, so it can be pointed at the Shopify orders feed:
       recentPurchases: async () => (await fetch("/api/recent-orders")).json(),
     Each entry: { name, avatar, city, colour, minutesAgo }. Leave out
     name and avatar and the toast falls back to the anonymous wording
     ("Someone in Leeds bought the Red set").
     Set the whole thing to null and no toasts appear.

     >>> DEMO ENTRIES. These describe purchases that have not happened,
     by people who do not exist. The four faces are the same ones used
     in the review block, so a visitor who scrolls sees each face under
     two different names — swap in four separate photos before this
     goes anywhere near real traffic, or drop name/avatar and let the
     anonymous wording take over. */
  recentPurchases: [
    { name: "Olivia Bennett", avatar: "/assets/smeg-lp-reviews-avatar-1-736ab88ee6.webp", city: "London, UK",     colour: "Light Blue",   minutesAgo: 5 },
    { name: "Daniel Hughes",  avatar: "/assets/smeg-lp-reviews-avatar-2-124fdf3664.webp", city: "Manchester, UK", colour: "Black",        minutesAgo: 12 },
    { name: "Sophie Clarke",  avatar: "/assets/smeg-lp-reviews-avatar-3-24490902a0.webp", city: "Bristol, UK",    colour: "Pink",         minutesAgo: 21 },
    { name: "Marcus Bell",    avatar: "/assets/smeg-lp-reviews-avatar-4-374e79202f.webp", city: "Leeds, UK",      colour: "Pastel Green", minutesAgo: 34 },
  ],

  /* Seconds per toast cycle. Real order volume will not be one every
     eight seconds, so slow this down to match actual order frequency
     once it is wired to Shopify. */
  purchaseToastInterval: 8,
};

let money = new Intl.NumberFormat(CONFIG.locale, { style: "currency", currency: CONFIG.currency });
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ---------- Hero carousel ---------- */

function initCarousel() {
  const track = $("#carousel");
  const dotsBox = $("#dots");
  if (!track || !dotsBox) return;

  const slides = Array.from(track.children);
  dotsBox.replaceChildren();

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "dot" + (i === 0 ? " is-active" : "");
    dot.type = "button";
    dot.setAttribute("aria-label", `Image ${i + 1}`);
    dot.addEventListener("click", () => {
      track.scrollTo({ left: track.clientWidth * i, behavior: "smooth" });
    });
    dotsBox.append(dot);
  });

  const dots = Array.from(dotsBox.children);
  let frame = null;
  track.addEventListener("scroll", () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const index = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    });
  });
}

/* ---------- Colour options ---------- */

let selectedColor = "Light Blue";

function bindTiles() {
  $$(".tile").forEach((tile) => {
    tile.addEventListener("click", async () => {
      selectedColor = tile.dataset.color;
      $("#colorName").textContent = selectedColor;
      $("#summaryColor").textContent = selectedColor;
      $("#summaryImg").src = tile.dataset.img;
      applyVariant();
      const vid = CONFIG.variantByColour && CONFIG.variantByColour[selectedColor];
      if (vid) $("#variantId").value = vid;
      $$(".tile").forEach((t) => {
        t.classList.toggle("is-active", t === tile);
        t.setAttribute("aria-checked", String(t === tile));
      });
      if (basket.cart) {
        await basket.matchKnifeColour();
        basket.render();
      }
    });
  });
}

/* ---------- Product (live from Shopify) ---------- */

async function initProduct() {
  const handle = CONFIG.productHandle;
  if (!handle) return;

  let P;
  try {
    P = await fetch(`/products/${handle}.js`, { headers: { Accept: "application/json" } }).then((r) => r.json());
  } catch {
    return; // off Shopify (local preview): keep the mock
  }
  if (!P || !Array.isArray(P.variants) || !P.variants.length) return;

  // currency the store actually charges in
  const cur = (window.Shopify && Shopify.currency && Shopify.currency.active) || CONFIG.currency;
  CONFIG.currency = cur;
  money = new Intl.NumberFormat(CONFIG.locale, { style: "currency", currency: cur });
  const fmt = (cents) => money.format(cents / 100);

  // title
  const h1 = $(".buybox h1");
  if (h1 && P.title) h1.textContent = P.title;

  // price, was and save — all from the product
  CONFIG.price = P.price / 100;
  productCompareAt = displayCompareAt(P.price, P.compare_at_price);
  $("#priceNow").textContent = fmt(P.price);
  const was = $("#priceWas"), save = $("#priceSave");
  if (productCompareAt) {
    if (was) { was.textContent = fmt(productCompareAt); was.hidden = false; }
    if (save) { save.textContent = `Save ${fmt(productCompareAt - P.price)}`; save.hidden = false; }
  } else {
    if (was) was.hidden = true;
    if (save) save.hidden = true;
  }

  const single = P.variants.length <= 1;

  // Single product: no colour choice. Hide the whole colour UI and just
  // show the product's own image; the hidden variant id (the one variant
  // Shopify always has) still feeds the add-to-cart form.
  if (single) {
    const v = P.variants[0];
    if ($(".pick")) $(".pick").hidden = true;
    if ($(".tiles")) $(".tiles").hidden = true;
    if ($(".summary__meta")) $(".summary__meta").hidden = true;
    const img = (v && v.featured_image && v.featured_image.src) || P.featured_image || (P.images && P.images[0]) || "";
    if (img && $("#summaryImg")) $("#summaryImg").src = img;
    if (v) $("#variantId").value = v.id;
    selectedColor = "";
    CONFIG.variantByColour = {};
    syncSummary();
    return;
  }

  // rebuild the colour tiles straight from the variants
  const tiles = $(".tiles");
  if (tiles) {
    const map = {};
    tiles.replaceChildren(...P.variants.map((v, i) => {
      const colour = v.option1 || v.title;
      const img = (v.featured_image && v.featured_image.src) || P.featured_image || (P.images && P.images[0]) || "";
      map[colour] = v.id;

      const btn = document.createElement("button");
      btn.className = "tile" + (i === 0 ? " is-active" : "");
      btn.type = "button";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", i === 0 ? "true" : "false");
      btn.dataset.color = colour;
      btn.dataset.img = img;

      const im = document.createElement("img");
      im.src = img; im.alt = colour; im.loading = "lazy";
      const sp = document.createElement("span");
      sp.textContent = colour;
      btn.append(im, sp);
      return btn;
    }));
    CONFIG.variantByColour = map;
    bindTiles();

    // select the first colour so image, name, variant id and summary line up
    const first = tiles.querySelector(".tile");
    if (first) first.click();
  }

  syncSummary();
}

/* ---------- Quantity ---------- */

function clampQty(value) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(10, Math.max(1, n));
}

function syncSummary() {
  const qty = clampQty($("#qty").value);
  $("#summaryPrice").textContent = money.format(CONFIG.price * qty);
}

function initQty() {
  const input = $("#qty");
  if (!input) return;

  const set = (value) => {
    input.value = clampQty(value);
    syncSummary();
  };

  $("#qtyMinus").addEventListener("click", () => set(Number(input.value) - 1));
  $("#qtyPlus").addEventListener("click", () => set(Number(input.value) + 1));
  input.addEventListener("change", () => set(input.value));
  syncSummary();
}

/* ---------- Buy button ---------- */

function initBuy() {
  const button = $("#addToCart");
  if (!button) return;

  // Shopify's product form. The basket takes the submit so the customer
  // stays on the page; if the Ajax cart is out of reach the form posts
  // to /cart/add the ordinary way, exactly as the theme's would.
  const form = button.closest("form");
  if (form) {
    form.addEventListener("submit", async (event) => {
      const vid = CONFIG.variantByColour && CONFIG.variantByColour[selectedColor];
      if (vid) $("#variantId").value = vid;
      $("#qty").value = clampQty($("#qty").value);

      if (form.dataset.native) return;
      event.preventDefault();
      button.disabled = true;
      try {
        await basket.add(new FormData(form));
      } catch (cause) {
        basket.open();
        const error = document.querySelector('#basketAddError');
        error.textContent = cause.message || "Could not update the basket. Please try again.";
        error.hidden = false;
      } finally {
        button.disabled = false;
      }
    });
    return;
  }

  button.addEventListener("click", () => {
    if (!CONFIG.checkoutUrl) {
      console.warn("Set CONFIG.checkoutUrl — the buy button has nowhere to go.");
      return;
    }

    let url = CONFIG.checkoutUrl;
    if (CONFIG.passOptionsToCheckout) {
      const target = new URL(CONFIG.checkoutUrl, window.location.href);
      target.searchParams.set("colour", selectedColor);
      target.searchParams.set("quantity", String(clampQty($("#qty").value)));
      url = target.toString();
    }
    window.location.href = url;
  });
}

/* ---------- Basket ---------- */

/* The page's own basket over the real Shopify cart. Every figure it
   shows comes back from Shopify — titles, quantities, prices and the
   currency — so it can never disagree with checkout. */
let productCompareAt = 39900; // Legacy displayed collection comparison amount from reference page

const KNIFE_UPSELL_ENABLED = true;
const KNIFE_IMAGES = {"Black":"/assets/ref-THUMB_KBSF02BL_jpg-60befbc9b6.jpg","White":"/assets/ref-THUMB_KBSF02WH_jpg-e630765121.jpg","Light Blue":"/assets/ref-THUMB_KBSF02PB_jpg-2887c15faf.jpg","Cream":"/assets/ref-THUMB_KBSF02WH_jpg-e630765121.jpg"};
const KNIFE_BY_COLOUR = Object.fromEntries(CATALOG.products.knife.variants.filter(v=>v.available).map(v=>[v.title,{id:v.id,image:KNIFE_IMAGES[v.title]}]));
const KNIFE_PRODUCT_ID = CATALOG.products.knife.id;
function knifeOffer(cart) {
  const mains = cart.items.filter(item => item.product_id === MAIN_PRODUCT_ID);
  const colourOf = item => item.options_with_values?.find(o => o.name === 'Colour')?.value || item.variant_title;
  const main = mains.find(item => colourOf(item) === selectedColor) || mains[0];
  if (!main) return null;
  const colour = selectedColor || colourOf(main);
  const offeredColour = KNIFE_BY_COLOUR[colour] ? colour : "Black";
  return KNIFE_BY_COLOUR[offeredColour] ? { ...KNIFE_BY_COLOUR[offeredColour], colour: offeredColour } : null;
}
const ADDON_IDS = [CATALOG.products.warranty.variants[0].id,CATALOG.products.shipping.variants[0].id];
const MAIN_PRODUCT_ID = CATALOG.products.main.id;
let addonPending = Promise.resolve();
const addonSelected = Object.fromEntries(ADDON_IDS.map(id => {
  try { return [id, sessionStorage.getItem(CATALOG.domain + ':smeg:addon:' + id) !== 'false']; }
  catch { return [id, true]; }
}));
const basket = {
  cart: null,
  loadSession() {
    if (window.__smegBasketLines) return;
    const allowed = new Set(Object.values(CATALOG.products).flatMap(p=>p.variants.filter(v=>v.available).map(v=>Number(v.id))));
    let saved = [];
    try { saved = JSON.parse(sessionStorage.getItem(CATALOG.domain + ':smeg:basket') || '[]'); } catch {}
    const valid = Array.isArray(saved) ? saved.filter(entry => Array.isArray(entry) && entry.length === 2 && allowed.has(Number(entry[0])) && Number.isInteger(entry[1]) && entry[1] >= 1 && entry[1] <= 10).map(([id,n])=>[Number(id),n]) : [];
    window.__smegBasketLines = new Map(valid);
  },

  async request(path, options = {}) {
    // The original archive ran inside Shopify and called /cart/*.js on its own domain.
    // On Netlify those URLs are not connected to the Avera store: use local state
    // and submit the exact selected Shopify variants together at checkout.
    const lines = window.__smegBasketLines || (window.__smegBasketLines = new Map());
    const lineDetails = id => {
      for (const product of Object.values(CATALOG.products)) {
        const variant = product.variants.find(v => Number(v.id) === Number(id));
        if (!variant) continue;
        if (!variant.available) throw new Error('This variant is currently unavailable.');
        const tile = $$('.tile').find(t => t.dataset.color === variant.title);
        return {product_id:product.id,variant_title:variant.title,product_title:product.title,
          options_with_values:variant.title === 'Default Title' ? [] : [{name:'Colour',value:variant.title}],
          final_price:variant.price,image:product.id === MAIN_PRODUCT_ID ? (tile?.dataset.img || '') : (KNIFE_IMAGES[variant.title] || '')};
      }
      throw new Error('Product not found in the selected Shopify store.');
    };
    const save = () => { try { sessionStorage.setItem(CATALOG.domain + ':smeg:basket',JSON.stringify([...lines])); } catch {} };
    if (path === '/cart/add.js') {
      const fd = options.body;
      const id = Number(fd.get('id'));
      const qty = Math.min(10, Math.max(1, parseInt(fd.get('quantity')||'1',10)||1));
      lineDetails(id);
      lines.set(id, Math.min(10, (lines.get(id)||0) + qty));
      save();
    } else if (path === '/cart/change.js') {
      const {id,quantity} = JSON.parse(options.body);
      const vid = Number(id);
      lineDetails(vid);
      const newQty = Math.min(10,Math.max(0,Number(quantity)||0));
      if (newQty) lines.set(vid,newQty); else lines.delete(vid);
      save();
    } else if (path === '/cart/update.js') {
      const {updates} = JSON.parse(options.body);
      for (const [rawId,quantity] of Object.entries(updates)) {
        const vid = Number(rawId);
        lineDetails(vid);
        const n = Math.min(10,Math.max(0,Number(quantity)||0));
        if (n) lines.set(vid,n); else lines.delete(vid);
      }
      save();
    } else if (path !== '/cart.js') throw new Error('Unknown cart action '+path);
    const items = [...lines].map(([id,quantity]) => {
      const detail = lineDetails(id);
      return { key:String(id), variant_id:id, id, quantity, ...detail, final_line_price:detail.final_price * quantity };
    });
    return {currency:CATALOG.currency,items,total_price:items.reduce((sum,line)=>sum+line.final_line_price,0)};
  },

  async add(formData) {
    document.querySelector('#basketAddError').hidden = true;
    await this.request("/cart/add.js", { method: "POST", body: formData });
    await this.matchKnifeColour();
    await this.refresh();
    this.open({ justAdded: true });
  },

  async matchKnifeColour() {
    const cart=await this.request('/cart.js');
    if (!cart.items.some(item=>item.product_id===MAIN_PRODUCT_ID)) return;
    const updates=ShopifyCart.knifeColourUpdates(CATALOG,cart.items,selectedColor);
    this.cart=updates ? await this.request('/cart/update.js', {
      method:'POST',body:JSON.stringify({updates})
    }) : cart;
  },

  async refresh() {
    this.loadSession();
    this.cart = await this.request("/cart.js");
    await this.syncAddons();
    this.render();
  },

  syncAddons() {
    addonPending = addonPending.catch(() => {}).then(async () => {
      const checkout = $("#basketCheckout");
      checkout.disabled = true;
      try {
        const cart = await this.request("/cart.js");
        const hasMain = cart.items.some(item => item.product_id === MAIN_PRODUCT_ID);
        const updates = {};
        cart.items.filter(item => item.product_id === KNIFE_PRODUCT_ID).forEach(item => { updates[item.key] = item.quantity; });
        for (const id of ADDON_IDS) {
          const lines = cart.items.filter(item => item.variant_id === id);
          const wanted = hasMain && addonSelected[id] ? 1 : 0;
          if (!lines.length && wanted) updates[id] = wanted;
          lines.forEach((line, index) => {
            const quantity = index === 0 ? wanted : 0;
            updates[line.key] = quantity;
          });
        }
        this.cart = Object.keys(updates).length ? await this.request("/cart/update.js", {
          method: "POST", headers: {"Content-Type":"application/json", Accept:"application/json"},
          body: JSON.stringify({updates})
        }) : cart;
        $("#addonError").hidden = true;
      } catch (error) {
        $("#addonError").textContent = "Could not update the extras. Please try again.";
        $("#addonError").hidden = false;
        throw error;
      } finally { checkout.disabled = false; }
    });
    return addonPending;
  },

  async change(key, quantity, row) {
    row.classList.add("is-busy");
    try {
      this.cart = await this.request("/cart/change.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id: key, quantity }),
      });
    } catch {
      await this.refresh().catch(() => {});
      return;
    }
    await this.syncAddons();
    this.render();
  },

  money(cents) {
    return new Intl.NumberFormat(CONFIG.locale, { style: "currency", currency: this.cart.currency }).format(cents / 100);
  },

  render() {
    const { cart } = this;
    const list = $("#basketItems");
    const mainItems = cart.items.filter(item => !ADDON_IDS.includes(item.variant_id));
    const offer = knifeOffer(cart);
    const knifeLine = cart.items.find(item => item.product_id === KNIFE_PRODUCT_ID);
    $("#knifeUpsell").hidden = !KNIFE_UPSELL_ENABLED || Boolean(knifeLine) || !offer;
    if (offer) {
      $("#knifeUpsell img").src = offer.image;
      $("#knifeUpsell img").alt = CONFIG.knifeProductName + ' - ' + offer.colour;
      $("#knifeUpsellColour").textContent = 'Colour: ' + offer.colour;
      $("#knifeUpsellAdd").dataset.variantId = offer.id;
    }
    $("#knifeUpsellPrice").textContent = this.money(CATALOG.products.knife.variants.find(v=>v.id===offer?.id)?.price ?? CATALOG.products.knife.variants[0].price);
    const count = mainItems.reduce((sum, item) => sum + item.quantity, 0);
    $("#basketAddons").hidden = !cart.items.some(item => item.product_id === MAIN_PRODUCT_ID);
    $$(".addon__check").forEach(input => {
      const id = Number(input.dataset.variantId);
      input.checked = addonSelected[id];
      const line = cart.items.find(item => item.variant_id === id);
      input.closest('.addon').querySelector('.addon__price').textContent = this.money(line ? line.final_line_price : Number(input.dataset.price));
    });

    $("#basketCount").textContent = count ? `(${count})` : "";
    $("#basketTabCount").textContent = count;
    $("#basketTab").hidden = !count;
    $("#basketFoot").hidden = !count;
    $("#basketTotal").textContent = this.money(cart.total_price);

    const checkoutLink = $('#basketCheckout');
    try {
      checkoutLink.href = ShopifyCart.checkoutUrl(CATALOG, cart.items);
      checkoutLink.removeAttribute('aria-disabled');
    } catch {
      checkoutLink.removeAttribute('href');
      checkoutLink.setAttribute('aria-disabled','true');
    }

    // Struck "was" subtotal — the discount, no separate savings line.
    const was = $("#basketWas");
    const collectionQuantity = mainItems.filter(item => item.product_id === MAIN_PRODUCT_ID).reduce((sum, item) => sum + item.quantity, 0);
    if (productCompareAt && collectionQuantity) {
      if (was) { was.textContent = this.money(cart.total_price + mainItems.filter(item => item.product_id === MAIN_PRODUCT_ID).reduce((sum, item) => sum + productCompareAt * item.quantity - item.final_line_price, 0)); was.hidden = false; }
    } else if (was) {
      was.hidden = true;
    }

    if (!count) {
      const empty = document.createElement("div");
      empty.className = "basket__empty";
      const head = document.createElement("strong");
      head.textContent = "Your basket is empty";
      empty.append(head, "Pick a colour and add the collection to get started.");
      list.replaceChildren(empty);
      $("#basketAdded").hidden = true;
      return;
    }

    list.replaceChildren(...mainItems.map((item) => {
      const row = document.createElement("div");
      row.className = "bitem";

      // Show the set in the colour that was bought, using the same
      // picture the colour tile shows.
      // Colour now rides on the variant; older lines may still carry it
      // as a property, so fall back to that.
      const colour = (item.options_with_values && (item.options_with_values.find(o => o.name === "Colour") || {}).value)
        || (item.properties && item.properties.Colour)
        || (item.variant_title !== "Default Title" ? item.variant_title : null);
      const tile = colour && $$(".tile, [data-color]").find((t) => t.dataset.color === colour);
      const img = document.createElement("img");
      img.className = "bitem__img";
      img.src = item.product_id === MAIN_PRODUCT_ID ? ((tile && tile.querySelector("img") && tile.querySelector("img").src) || item.image || "") : (item.image || "");
      img.alt = "";

      const text = document.createElement("div");
      const title = document.createElement("p");
      title.className = "bitem__title";
      title.textContent = item.product_id === MAIN_PRODUCT_ID ? (CONFIG.productShortName || item.product_title) : item.product_id === KNIFE_PRODUCT_ID ? CONFIG.knifeProductName : item.product_title;
      const meta = document.createElement("p");
      meta.className = "bitem__meta";
      meta.textContent = colour ? `Colour: ${colour}` : "";
      text.append(title, meta);

      const price = document.createElement("span");
      price.className = "bitem__price";
      // Show the discount on the product line too: struck "was" then now.
      if (item.product_id === MAIN_PRODUCT_ID && productCompareAt && productCompareAt > item.final_price) {
        const wasEl = document.createElement("s");
        wasEl.className = "bitem__was";
        wasEl.textContent = this.money(productCompareAt * item.quantity);
        const nowEl = document.createElement("span");
        nowEl.className = "bitem__now";
        nowEl.textContent = this.money(item.final_line_price);
        price.append(wasEl, nowEl);
      } else {
        price.textContent = this.money(item.final_line_price);
      }

      const controls = document.createElement("div");
      controls.className = "bitem__controls";

      const qty = document.createElement("div");
      qty.className = "qty";
      const minus = document.createElement("button");
      minus.type = "button"; minus.className = "qty__btn"; minus.textContent = "−";
      minus.setAttribute("aria-label", "Decrease");
      const val = document.createElement("span");
      val.className = "qty__val"; val.textContent = item.quantity;
      const plus = document.createElement("button");
      plus.type = "button"; plus.className = "qty__btn"; plus.textContent = "+";
      plus.setAttribute("aria-label", "Increase");
      minus.addEventListener("click", () => this.change(item.key, item.quantity - 1, row));
      plus.addEventListener("click", () => this.change(item.key, item.quantity + 1, row));
      qty.append(minus, val, plus);

      const remove = document.createElement("button");
      remove.type = "button"; remove.className = "bitem__remove"; remove.textContent = "Remove";
      remove.addEventListener("click", () => this.change(item.key, 0, row));

      controls.append(qty, remove);
      row.append(img, text, price, controls);
      return row;
    }));
  },

  open({ justAdded = false } = {}) {
    $("#basketAdded").hidden = !justAdded;
    $("#basket").hidden = false;
    $("#toasts").hidden = true;
    document.documentElement.style.overflow = "hidden";
    $(".basket__close").focus();
  },

  close() {
    $("#basket").hidden = true;
    $("#toasts").hidden = true;
    document.documentElement.style.overflow = "";
  },
};

function initBasket() {
  $("#knifeUpsellAdd").addEventListener("click", async () => {
    if (!KNIFE_UPSELL_ENABLED) return;
    const button = $("#knifeUpsellAdd");
    button.disabled = true;
    $("#knifeUpsellError").hidden = true;
    try {
      const form = new FormData();
      const offer = knifeOffer(basket.cart);
      if (!offer) return;
      form.set("id", String(offer.id));
      form.set("quantity", "1");
      await basket.add(form);
    } catch (cause) {
      $("#knifeUpsellError").textContent = cause.message || "Could not add the knife set. Please try again.";
      $("#knifeUpsellError").hidden = false;
    } finally { button.disabled = false; }
  });
  if (!$("#basket")) return;
  $$("[data-basket-close]").forEach((el) => el.addEventListener("click", () => basket.close()));
  $("#basketTab").addEventListener("click", () => basket.refresh().then(() => basket.open()).catch(() => {}));

  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#basket").hidden) basket.close(); });
  $$(".addon__check").forEach(input => input.addEventListener("change", async () => {
    const id = Number(input.dataset.variantId);
    addonSelected[id] = input.checked;
    try { sessionStorage.setItem(CATALOG.domain + ':smeg:addon:' + id, String(input.checked)); } catch {}
    input.disabled = true;
    try { await basket.syncAddons(); basket.render(); } catch {} finally { input.disabled = false; }
  }));
  $("#basketCheckout").closest("form").addEventListener("submit", async event => {
    event.preventDefault();
    const button = $("#basketCheckout");
    button.disabled = true;
    try {
      await basket.syncAddons();
      window.location.assign(ShopifyCart.checkoutUrl(CATALOG, basket.cart.items));
    } catch (error) {
      $('#addonError').textContent = error.message || 'Unable to start checkout.';
      $('#addonError').hidden = false;
      button.disabled = false;
    }
  });
  $('#basketCheckout').addEventListener('click', event => {
    try {
      if ($('#basketCheckout').disabled) { event.preventDefault(); return; }
      event.currentTarget.href=ShopifyCart.checkoutUrl(CATALOG, basket.cart.items);
    } catch (error) {
      event.preventDefault();
      $('#addonError').textContent=error.message;
      $('#addonError').hidden=false;
    }
  });
  // Someone coming back with items already in the cart gets the tab
  // straight away. Off Shopify there is no cart, and no tab.
  basket.refresh().catch(() => {});
}

/* ---------- Countdown ---------- */

/* Milliseconds from now until the next midnight in the UK, worked out
   from London wall-clock time rather than the visitor's own, so a
   customer in Lisbon or New York sees the same figure as one in Leeds.
   Reading the hours off Intl also means BST and GMT are handled for
   free, including the clock-change days. */
function msUntilUkMidnight() {
  const now = new Date();
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(now)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)]),
  );
  const elapsed = (parts.hour % 24) * 3600 + parts.minute * 60 + parts.second;
  return (86400 - elapsed) * 1000 - now.getMilliseconds();
}

function initCountdown() {
  const mode = CONFIG.countdownMode;
  if (!mode) return;

  const fixedEnd = mode === "date" ? new Date(CONFIG.saleEndsAt).getTime() : null;
  if (mode === "date" && !Number.isFinite(fixedEnd)) return;

  const band = $("#countdown");
  const pad = (n) => String(n).padStart(2, "0");

  const tick = () => {
    const left = mode === "daily" ? msUntilUkMidnight() : fixedEnd - Date.now();

    // In daily mode the clock rolls straight over into the next day, so
    // it never runs out; in date mode the band retires at the deadline.
    if (left <= 0) {
      if (mode === "daily") return;
      band.hidden = true;
      clearInterval(handle);
      return;
    }
    const days = Math.floor(left / 86400000);
    $("#cdDayUnit").hidden = days === 0;
    $("#cdSep1").hidden = days === 0;
    $("#cdD").textContent = pad(days);

    // Once inside the final day the hours run 00–23, matching the
    // days field disappearing.
    const hours = days > 0 ? Math.floor((left % 86400000) / 3600000) : Math.floor(left / 3600000);
    $("#cdH").textContent = pad(hours);
    $("#cdM").textContent = pad(Math.floor((left % 3600000) / 60000));
    $("#cdS").textContent = pad(Math.floor((left % 60000) / 1000));
    band.hidden = false;
  };

  tick();
  const handle = setInterval(tick, 1000);
}

/* ---------- Live viewers ---------- */

function initLiveViewers() {
  if (typeof CONFIG.liveViewers !== "function") return;

  const pill = $("#livePill");

  const refresh = async () => {
    let count;
    try {
      count = await CONFIG.liveViewers();
    } catch {
      pill.hidden = true;
      return;
    }
    // No real number means nothing is shown — never a fallback guess.
    if (!Number.isFinite(count) || count < 1) {
      pill.hidden = true;
      return;
    }
    const n = Math.floor(count);
    pill.textContent = n === 1
      ? "1 person is viewing this right now"
      : `${n} people are viewing this right now`;
    pill.hidden = false;
  };

  refresh();
  const seconds = Number(CONFIG.liveViewersInterval) || 30;
  setInterval(refresh, seconds * 1000);
}

/* ---------- Sold / stock lines ---------- */

/* Accepts a plain number or a function (sync or async) returning one.
   Anything that is not a usable number resolves to null, and the
   caller leaves its line hidden rather than inventing a fallback. */
async function resolveCount(source) {
  if (source == null) return null;
  let value = source;
  if (typeof source === "function") {
    try {
      value = await source();
    } catch {
      return null;
    }
  }
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

async function initSoldLine() {
  const el = $("#soldLine");
  const n = await resolveCount(CONFIG.soldLast24h);
  if (n === null || n < 1) return;
  el.textContent = n === 1
    ? "🔥 1 sold in the last 24 hours"
    : `🔥 ${n} sold in the last 24 hours`;
  el.hidden = false;
}

async function initStockLine() {
  const el = $("#stockLine");
  const bar = $("#stockBar");
  const n = await resolveCount(CONFIG.stockLeft);
  if (n === null || n < 1) return;

  el.replaceChildren(
    document.createTextNode("Only "),
    Object.assign(document.createElement("strong"), { textContent: String(n) }),
    document.createTextNode(n === 1 ? " item left in stock" : " items left in stock"),
  );
  el.hidden = false;

  // The bar shows what is left against the batch it started from, so it
  // empties as stock goes. Without a starting figure there is nothing
  // to measure against and the bar stays hidden.
  const started = Number(CONFIG.stockStartedAt);
  if (!Number.isFinite(started) || started < n) return;
  const pct = Math.max(4, Math.round((n / started) * 100));
  bar.querySelector(".stockbar__fill").style.width = `${pct}%`;
  bar.hidden = false;
}

/* ---------- Recent-purchase toasts ---------- */

async function initPurchaseToasts() {
  const box = $("#toasts");
  let list = CONFIG.recentPurchases;
  if (typeof list === "function") {
    try {
      list = await list();
    } catch {
      return;
    }
  }
  if (!Array.isArray(list) || !list.length) return;

  const cycle = Math.max(1, Number(CONFIG.purchaseToastInterval) || 3);
  const visible = cycle * 0.8;
  let i = 0;

  const show = () => {
    const item = list[i % list.length];
    i += 1;

    const card = document.createElement("div");
    card.className = "toast";

    const img = document.createElement("img");
    img.src = item.avatar || colorImages[item.colour] || "/assets/smeg-lp-header-5-be97702988.webp";
    img.alt = "";
    img.loading = "lazy";

    const body = document.createElement("div");

    // A named entry puts the buyer on its own line with the product in
    // bold underneath; without a name the toast stays anonymous.
    let name = null;
    const line = document.createElement("p");
    line.className = "toast__line";

    if (item.name) {
      name = document.createElement("p");
      name.className = "toast__name";
      name.textContent = item.name;

      const what = document.createElement("strong");
      what.textContent = `${CONFIG.productShortName} (${item.colour})`;
      line.append("Purchased: ", what);
    } else {
      line.textContent = item.city
        ? `Someone in ${item.city} bought the ${item.colour} set`
        : `Someone bought the ${item.colour} set`;
    }

    const time = document.createElement("p");
    time.className = "toast__time";
    const ago = item.minutesAgo >= 60
      ? `${Math.floor(item.minutesAgo / 60)} hour${item.minutesAgo >= 120 ? "s" : ""} ago`
      : `${item.minutesAgo} minutes ago`;
    time.textContent = item.name && item.city ? `\u{1F4CD} ${item.city} • ${ago}` : ago;

    body.append(...(name ? [name] : []), line, time);
    card.append(img, body);
    box.replaceChildren(card);

    // Fade out before the next one arrives, so they never stack up.
    setTimeout(() => card.classList.add("is-leaving"), visible * 1000);
  };

  show();
  setInterval(show, cycle * 1000);
}

/* ---------- Stars ---------- */

function initStars() {
  $$(".stars").forEach((el) => {
    const score = Math.min(5, Math.max(0, Number(el.dataset.score) || 0));

    const base = document.createElement("span");
    base.className = "stars__base";
    base.textContent = "★★★★★";

    const fill = document.createElement("span");
    fill.className = "stars__fill";
    fill.textContent = "★★★★★";
    fill.style.width = `${(score / 5) * 100}%`;

    el.replaceChildren(base, fill);
  });
}

function displayCompareAt(price, shopifyCompareAt) {
  const value = CONFIG.compareAtPrice == null ? shopifyCompareAt : Math.round(Number(CONFIG.compareAtPrice) * 100);
  return Number.isFinite(value) && value > price ? value : null;
}

function applyVariant() {
  const variant = CATALOG.products.main.variants.find(v => v.title === selectedColor);
  if (!variant) { $('#addToCart').disabled=true; return; }
  CONFIG.price=variant.price/100;
  productCompareAt=displayCompareAt(variant.price, variant.compare_at_price);
  $('#priceNow').textContent=money.format(CONFIG.price);
  $('#priceWas').hidden=!productCompareAt;
  $('#priceSave').hidden=!productCompareAt;
  if (productCompareAt) {
    $('#priceWas').textContent=money.format(productCompareAt/100);
    $('#priceSave').textContent='Save '+money.format((productCompareAt-variant.price)/100);
  }
  $('#variantId').value=variant.id;
  $('#addToCart').disabled=!variant.available;
  $('#addToCart').textContent=variant.available ? 'Add to basket' : 'Sold out';
  syncSummary();
}
function applyCatalog() {
  // Preserve the reference page heading; use Shopify titles inside the basket.
  // Preserve the reference product presentation.
  $('#knifeUpsell strong').textContent=CONFIG.knifeProductName;
  $$('.tile').forEach(tile=>{
    const variant=CATALOG.products.main.variants.find(v=>v.title===tile.dataset.color);
    tile.disabled=!variant?.available;
    tile.setAttribute('aria-disabled',String(!variant?.available));
  });
  $$('.addon__check').forEach((input,i)=>{
    const product=CATALOG.products[i===0 ? 'warranty' : 'shipping'];
    input.dataset.variantId=product.variants[0].id;
    input.dataset.price=product.variants[0].price;
    input.checked=addonSelected[product.variants[0].id]; input.disabled=!product.variants[0].available;
    input.closest('.addon').querySelector('.addon__name').textContent=product.title;
    input.closest('.addon').querySelector('.addon__price').textContent=money.format(product.variants[0].price/100);
  });
  applyVariant();
}

/* ---------- Boot ---------- */

const boot = () => {
  // Optional: the footer no longer carries a copyright line, so this
  // element may not exist.
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  if (CONFIG.promoLine) $("#promoLine").textContent = CONFIG.promoLine;
  initCarousel();
  bindTiles();
  applyCatalog();
  initQty();
  initBuy();
  initBasket();
  initCountdown();
  initLiveViewers();
  initSoldLine();
  initStockLine();
  initPurchaseToasts();
  initStars();
};
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

