/*
 * Starlink dish card for Home Assistant
 * https://github.com/CameronSmith93/Starlink-Card-HA
 *
 * Your Starlink dish under a night sky, in a DIN typeface like Starlink's (D-DIN), with what it reports:
 * online, sleeping, stowed or offline; live throughput and latency; the last hour as two small
 * graphs; and any alerts. Driven by Home Assistant's built-in Starlink integration.
 *
 * The card shows the right dish for your kit: it reads the dish's hardware version from Home
 * Assistant, or you can choose the model yourself.
 *
 * D-DIN is by Datto, under the SIL Open Font Licence 1.1. The dish photos are Starlink's.
 */
(() => {
  const STARLINK_CARD_VERSION = '1.0.0';
  const REPO = 'https://github.com/CameronSmith93/Starlink-Card-HA';

  // One photo per dish shape (inlined by tools/build.py).
  const DISHES = {
    standard: '__DISH_standard__',
    v5: '__DISH_v5__',
    mini: '__DISH_mini__',
    standard_actuated: '__DISH_standard_actuated__',
    performance_gen_3: '__DISH_performance_gen_3__',
    performance_gen_2: '__DISH_performance_gen_2__',
    performance_gen_1: '__DISH_performance_gen_1__',
    enterprise: '__DISH_enterprise__',
    standard_circular: '__DISH_standard_circular__',
  };

  // Where each dish sits in its photo (percentages), so the snow-melt glow is on the dish.
  const DISH_GEOMETRY = __DISH_GEOMETRY__;

  // Starlink's kits, under Starlink's current names. `label` is the small line under STARLINK;
  // `name` is what the editor lists.
  const MODELS = {
    standard_4x: { name: 'Standard 4X', label: 'Standard 4X', dish: 'standard' },
    standard_4: { name: 'Standard 4', label: 'Standard 4', dish: 'standard' },
    standard: { name: 'Standard (V4 dish, any kit)', label: 'Standard', dish: 'standard' },
    v5: { name: 'Starlink V5', label: 'V5', dish: 'v5' },
    mini: { name: 'Mini', label: 'Mini', dish: 'mini' },
    mini_x: { name: 'Mini X', label: 'Mini X', dish: 'mini' },
    standard_actuated: { name: 'Standard Actuated', label: 'Standard Actuated', dish: 'standard_actuated' },
    performance_gen_3: { name: 'Performance (Gen 3)', label: 'Performance Gen 3', dish: 'performance_gen_3' },
    performance_gen_2: { name: 'Performance (Gen 2), formerly Flat High Performance', label: 'Performance Gen 2', dish: 'performance_gen_2' },
    performance_gen_1: { name: 'Performance (Gen 1), formerly High Performance', label: 'Performance Gen 1', dish: 'performance_gen_1' },
    enterprise: { name: 'Enterprise', label: 'Enterprise', dish: 'enterprise' },
    standard_circular: { name: 'Standard Circular (the original round dish)', label: 'Standard Circular', dish: 'standard_circular' },
  };
  const MODEL_ALIASES = {
    v4: 'standard', starlink_v4: 'standard', standard_v4: 'standard', standard_kit: 'standard',
    starlink_v5: 'v5', standard_5: 'v5', mini_kit: 'mini', starlink_mini: 'mini', starlink_mini_x: 'mini_x',
    actuated: 'standard_actuated', standard_actuated_kit: 'standard_actuated', rectangular: 'standard_actuated',
    performance: 'performance_gen_3', performance_3: 'performance_gen_3',
    flat_high_performance: 'performance_gen_2', flat_hp: 'performance_gen_2', performance_2: 'performance_gen_2',
    high_performance: 'performance_gen_1', actuated_high_performance: 'performance_gen_1', performance_1: 'performance_gen_1',
    circular: 'standard_circular', round: 'standard_circular', original: 'standard_circular',
  };
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  // The dish's hardware version (e.g. rev4_panda_prod2) says which dish it is, as far as shape goes.
  // It can't tell kits apart (Standard 4 and 4X are the same dish), and the Flat High Performance
  // and Enterprise dishes report the same family as others, so those are best set by hand.
  function detectModel(hw) {
    const v = String(hw || '').toLowerCase();
    if (!v) return null;
    if (v.includes('mini')) return 'mini';
    if (v.includes('rev5')) return 'v5';
    if (v.includes('hp1')) return 'performance_gen_1';
    if (v.includes('rev4')) return 'standard';
    if (v.includes('rev3')) return 'standard_actuated';
    if (/rev[12](_|$)/.test(v)) return 'standard_circular';
    return null;
  }

  // What the card reads, and how to find each one on the Starlink device. Entity IDs follow the
  // language Home Assistant was in when the dish was added, so the card matches on what each entity
  // is (its translation key or device class), and falls back to the English entity ID.
  const ROLES = {
    connectivity: { domain: 'binary_sensor', dc: 'connectivity', id: 'connectivity' },
    sleep: { domain: 'binary_sensor', tk: 'power_save_idle', id: 'sleep' },
    heating: { domain: 'binary_sensor', tk: 'heating', id: 'heating' },
    obstructed: { domain: 'binary_sensor', tk: 'currently_obstructed', id: 'obstructed' },
    thermal_throttle: { domain: 'binary_sensor', tk: 'thermal_throttle', id: 'thermal_throttle' },
    motors_stuck: { domain: 'binary_sensor', tk: 'motors_stuck', id: 'motors_stuck' },
    mast_near_vertical: { domain: 'binary_sensor', tk: 'mast_near_vertical', id: 'mast_near_vertical' },
    slow_ethernet: { domain: 'binary_sensor', tk: 'slow_ethernet', id: 'ethernet_speeds' },
    unexpected_location: { domain: 'binary_sensor', tk: 'unexpected_location', id: 'unexpected_location' },
    roaming: { domain: 'binary_sensor', tk: 'roaming', id: 'roaming_mode' },
    update: { domain: 'binary_sensor', dc: 'update', id: 'update' },
    stowed: { domain: 'switch', tk: 'stowed', id: 'stowed' },
    downlink: { domain: 'sensor', tk: 'downlink_throughput', id: 'downlink_throughput' },
    uplink: { domain: 'sensor', tk: 'uplink_throughput', id: 'uplink_throughput' },
    ping: { domain: 'sensor', tk: 'ping', id: 'ping' },
    ping_drop_rate: { domain: 'sensor', tk: 'ping_drop_rate', id: 'ping_drop_rate' },
    last_restart: { domain: 'sensor', tk: 'last_restart', id: 'last_restart' },
    power: { domain: 'sensor', dc: 'power', id: 'power' },
  };

  const ALERTS = [   // [role, label, kind]
    ['obstructed', 'Obstructed', 'warn'],
    ['thermal_throttle', 'Thermal throttling', 'warn'],
    ['motors_stuck', 'Motors stuck', 'warn'],
    ['mast_near_vertical', 'Mast not vertical', 'warn'],
    ['slow_ethernet', 'Slow Ethernet', 'warn'],
    ['unexpected_location', 'Unexpected location', 'warn'],
    ['roaming', 'Roaming', 'info'],
    ['update', 'Update ready', 'info'],
  ];

  // A fixed scatter of stars, so the sky doesn't change on every render.
  const STARS = (() => {
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const out = [];
    for (let i = 0; i < 60; i++) {
      const x = (rnd() * 100).toFixed(2), y = (rnd() * 34).toFixed(2), a = (0.12 + rnd() * 0.4).toFixed(2);
      const s = rnd() < 0.1 ? 0.24 : 0.14;
      out.push(`radial-gradient(${s}cqw ${s}cqw at ${x}cqw ${y}cqw, rgba(255,255,255,${a}) 98%, transparent)`);
    }
    return out.join(',');
  })();

  const css = `
    @font-face { font-family: "Starlink D-DIN"; src: url(__DDIN__) format("woff2"); font-weight: 400; font-display: swap; }
    @font-face { font-family: "Starlink D-DIN"; src: url(__DDIN_BOLD__) format("woff2"); font-weight: 700; font-display: swap; }
    :host { display: block; }
    ha-card { display: block; overflow: hidden; border-radius: var(--ha-card-border-radius, 12px); background: #000; border: none; }
    .frame { container-type: inline-size; }
    .scene { position: relative; color: #fff; user-select: none; background: #000;
      font-family: "Starlink D-DIN", "D-DIN", "DIN Alternate", "Barlow", "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing: antialiased; padding-bottom: 4.5cqw; }
    .sky { position: absolute; inset: 0 0 auto 0; height: 44cqw; pointer-events: none;
      background: ${STARS}, radial-gradient(ellipse 64cqw 18cqw at 64cqw 34cqw, rgba(70,90,130,.2), rgba(0,0,0,0) 70%);
      -webkit-mask-image: linear-gradient(#000 70%, transparent); mask-image: linear-gradient(#000 70%, transparent); }
    .caps { text-transform: uppercase; letter-spacing: .14em; }

    .hero { position: relative; height: 37cqw; }
    .brand { position: absolute; left: 5cqw; top: 5cqw; font-weight: 700; font-size: max(10px, 2.4cqw); letter-spacing: .34em; color: #d7d7d7; }
    .model { position: absolute; left: 5cqw; top: 8.6cqw; font-size: max(9px, 1.9cqw); color: #7c7c7c; }
    .state { position: absolute; left: 5cqw; top: 15.5cqw; display: flex; align-items: center; gap: 2cqw; cursor: pointer; }
    .state .word { font-weight: 700; font-size: 6.4cqw; letter-spacing: .08em; line-height: 1; }
    .state .dot { width: 1.9cqw; height: 1.9cqw; border-radius: 50%; background: var(--sc); box-shadow: 0 0 1.6cqw var(--sc); }
    .sub { position: absolute; left: 5cqw; top: 24cqw; font-size: max(10px, 2.2cqw); color: #a9a9a9; max-width: 38cqw; line-height: 1.5; }

    /* every dish photo is the same shape (1120 x 600), standing on a ground line 96.5% of the way down */
    .dish { position: absolute; right: 2cqw; top: 3.4cqw; width: 56cqw; aspect-ratio: 1120 / 600; cursor: pointer;
      -webkit-tap-highlight-color: transparent; }
    .dish img { position: relative; display: block; width: 100%; height: 100%; transition: filter .6s ease, opacity .6s ease; }
    .dish .ground { position: absolute; left: -16%; right: -12%; top: 72%; height: 50%; border-radius: 50%;
      background: radial-gradient(ellipse at 50% 50%, rgba(120,130,150,.16), rgba(0,0,0,0) 68%); }
    .dish .warm { position: absolute; left: calc(var(--gx) - var(--gw) / 2); top: calc(var(--gy) - var(--gh) / 2);
      width: var(--gw); height: var(--gh); border-radius: 50%; opacity: 0; transition: opacity .8s ease;
      background: radial-gradient(ellipse at 50% 50%, rgba(255,140,60,.58), rgba(255,140,60,0) 68%); filter: blur(2cqw); }
    .scene.heating .dish .warm { opacity: 1; animation: warm 4s ease-in-out infinite; }
    @keyframes warm { 0%, 100% { opacity: .65; } 50% { opacity: 1; } }
    .scene.dim .dish img { filter: grayscale(1) brightness(.55); }
    .scene.off .dish img { filter: grayscale(1) brightness(.4); opacity: .8; }

    .stats { position: relative; margin: 0 5cqw; display: grid; grid-template-columns: repeat(3, 1fr);
      border-top: 1px solid rgba(255,255,255,.14); padding-top: 3cqw; }
    .stat { cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .stat + .stat { padding-left: 3cqw; border-left: 1px solid rgba(255,255,255,.1); }
    .k { font-size: max(9px, 1.8cqw); color: #8a8a8a; }
    .v { margin-top: .9cqw; font-size: max(18px, 5.4cqw); line-height: 1; white-space: nowrap; }
    .v small { font-size: .42em; color: #9c9c9c; margin-left: .3em; letter-spacing: .08em; }
    .v .arrow { font-size: .55em; color: #8a8a8a; margin-right: .25em; vertical-align: .18em; }

    .charts { position: relative; margin: 3.6cqw 5cqw 0; display: grid; grid-template-columns: 1.35fr 1fr; gap: 4cqw; }
    .chart .head { display: flex; justify-content: space-between; align-items: baseline; }
    .chart .legend { font-size: max(8px, 1.6cqw); color: #6f6f6f; }
    .chart .legend i { display: inline-block; width: 2.4cqw; height: 0; border-top: 2px solid #fff; vertical-align: .3em; margin: 0 .6cqw 0 1.6cqw; }
    .chart .legend i.up { border-top: 2px dashed #8e8e8e; }
    .chart .foot { display: flex; justify-content: space-between; margin-top: 1cqw; }
    .chart svg { display: block; width: 100%; height: 12cqw; margin-top: 1.4cqw; overflow: visible; }

    .chips { position: relative; margin: 3.4cqw 5cqw 0; display: flex; flex-wrap: wrap; gap: 1.6cqw; }
    .chip { font-size: max(9px, 1.75cqw); padding: 1cqw 1.8cqw; border: 1px solid rgba(255,255,255,.18); border-radius: 99px; color: #bdbdbd; white-space: nowrap; }
    .chip.warn { border-color: rgba(255,176,32,.6); color: #ffb020; }
    .chip.info { border-color: rgba(120,170,255,.5); color: #9cc0ff; }
  `;

  class StarlinkDishCard extends HTMLElement {
    static getStubConfig() { return { model: 'auto' }; }

    // The visual editor.
    static getConfigForm() {
      return {
        schema: [
          { name: 'device', selector: { device: { filter: { integration: 'starlink' } } } },
          { name: 'model', selector: { select: { mode: 'dropdown', options: [
            { value: 'auto', label: 'Detect from the dish' },
            ...Object.entries(MODELS).map(([value, m]) => ({ value, label: m.name })),
          ] } } },
          { name: 'history_minutes', selector: { number: { min: 10, max: 1440, step: 5, mode: 'box', unit_of_measurement: 'min' } } },
        ],
        computeLabel: (f) => ({ device: 'Starlink', model: 'Dish', history_minutes: 'Graph history' })[f.name],
        computeHelper: (f) => ({
          device: 'Leave empty to use the first Starlink Home Assistant finds',
          history_minutes: 'How far back the graphs go (an hour if left empty)',
          model: 'Which picture and name to show. Detecting can\'t tell kits that share a dish apart (Standard 4 and 4X, for example), so choose yours if you want its exact name.',
        })[f.name],
      };
    }

    setConfig(config) {
      if (!config) throw new Error('Invalid configuration');
      this._config = { model: 'auto', history_minutes: 60, ...config };
      const mins = Number(this._config.history_minutes);
      this._minutes = Number.isFinite(mins) && mins >= 5 ? Math.round(mins) : 60;
      const m = slug(this._config.model || 'auto');
      this._model = m === 'auto' ? 'auto' : (MODELS[m] ? m : MODEL_ALIASES[m] || null);
      this._customLabel = this._model ? null : String(this._config.model);   // a name we don't know: show it as given
      this._ents = null;
      this._build();
      this._update();
    }

    getCardSize() { return 7; }
    getGridOptions() { return { columns: 12, min_columns: 6, rows: 'auto' }; }

    set hass(hass) {
      const first = !this._hass;
      if (!this._hass || hass.entities !== this._hass.entities || hass.devices !== this._hass.devices) this._ents = null;
      this._hass = hass;
      this._update();
      if (first) this._loadHistory();
    }

    connectedCallback() {
      this._tick = setInterval(() => this._update(), 60000);
      this._hist = setInterval(() => this._loadHistory(), 60000);
      if (this._hass) this._loadHistory();
    }
    disconnectedCallback() { clearInterval(this._tick); clearInterval(this._hist); }

    // Work out the Starlink device and its entities.
    _resolve() {
      if (this._ents) return this._ents;
      const hass = this._hass, reg = hass.entities || {}, prefix = this._config.entity_prefix;
      let device = this._config.device || null;
      if (!device && prefix) device = (reg[`binary_sensor.${prefix}_connectivity`] || {}).device_id || null;
      if (!device) {
        const e = Object.values(reg).find((x) => x.platform === 'starlink' && x.device_id);
        device = e ? e.device_id : null;
      }
      const mine = Object.values(reg).filter((e) => e.device_id && e.device_id === device);
      const ents = {};
      for (const [role, r] of Object.entries(ROLES)) {
        const hit = mine.find((e) => e.entity_id.startsWith(`${r.domain}.`) && (r.tk
          ? e.translation_key === r.tk
          : !e.translation_key && ((hass.states[e.entity_id] || {}).attributes || {}).device_class === r.dc));
        ents[role] = hit ? hit.entity_id : `${r.domain}.${prefix || 'starlink'}_${r.id}`;
      }
      const dev = device && hass.devices ? hass.devices[device] : null;
      this._hw = dev ? dev.hw_version : null;
      this._ents = ents;
      return ents;
    }

    _id(role) { return this._resolve()[role]; }
    _st(role) { return this._hass && this._hass.states[this._id(role)]; }
    _on(role) { const s = this._st(role); return !!s && s.state === 'on'; }
    _num(role) {
      const s = this._st(role);
      if (!s || ['unknown', 'unavailable'].includes(s.state)) return null;
      const v = parseFloat(s.state);
      return Number.isFinite(v) ? v : null;
    }
    _toMbps(role) {
      const u = (((this._st(role) || {}).attributes || {}).unit_of_measurement || 'Mbit/s').toLowerCase();
      const f = { 'bit/s': 1e-6, 'kbit/s': 1e-3, 'mbit/s': 1, 'gbit/s': 1e3, 'b/s': 8e-6, 'kb/s': 8e-3, 'kib/s': 8.192e-3, 'mb/s': 8, 'mib/s': 8.389, 'gb/s': 8e3 }[u];
      return f === undefined ? 1 : f;
    }
    _mbps(role) { const v = this._num(role); return v === null ? null : v * this._toMbps(role); }

    // which model to show: the one chosen, or the one the dish's hardware version points to
    _modelKey() {
      if (this._model && this._model !== 'auto') return this._model;
      this._resolve();
      return detectModel(this._hw) || 'standard';
    }

    _build() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>${css}</style>
        <ha-card>
          <div class="frame"><div class="scene">
            <div class="sky"></div>
            <div class="hero">
              <div class="brand">STARLINK</div>
              <div class="model caps"></div>
              <div class="state" data-more="connectivity"><span class="dot"></span><span class="word"></span></div>
              <div class="sub caps"></div>
              <div class="dish" data-more="connectivity">
                <div class="ground"></div><div class="warm"></div>
                <img alt="">
              </div>
            </div>
            <div class="stats">
              <div class="stat" data-more="downlink"><div class="k caps">Download</div><div class="v s-down"></div></div>
              <div class="stat" data-more="uplink"><div class="k caps">Upload</div><div class="v s-up"></div></div>
              <div class="stat" data-more="ping"><div class="k caps">Latency</div><div class="v s-ping"></div></div>
            </div>
            <div class="charts">
              <div class="chart c-tput"><div class="head"><span class="k caps">Throughput</span><span class="legend caps scale"></span></div>
                <svg viewBox="0 0 100 30" preserveAspectRatio="none"></svg>
                <div class="foot legend caps"><span class="ago"></span><span><i></i>Down<i class="up"></i>Up</span><span>Now</span></div></div>
              <div class="chart c-ping"><div class="head"><span class="k caps">Latency</span><span class="legend caps scale"></span></div>
                <svg viewBox="0 0 100 30" preserveAspectRatio="none"></svg>
                <div class="foot legend caps"><span class="ago"></span><span>Now</span></div></div>
            </div>
            <div class="chips"></div>
          </div></div>
        </ha-card>`;
      this.shadowRoot.querySelectorAll('[data-more]').forEach((el) => el.addEventListener('click', () => {
        const ev = new Event('hass-more-info', { bubbles: true, composed: true });
        ev.detail = { entityId: this._id(el.dataset.more) };
        this.dispatchEvent(ev);
      }));
      const m = this._minutes, h = m / 60;
      const ago = m < 60 ? `${m} min ago` : Number.isInteger(h) ? `${h} ${h === 1 ? 'hr' : 'hrs'} ago` : `${h.toFixed(1)} hrs ago`;
      this.shadowRoot.querySelectorAll('.ago').forEach((el) => { el.textContent = ago; });
      this._shownDish = null;
    }

    _uptime() {
      const s = this._st('last_restart');
      if (!s || ['unknown', 'unavailable'].includes(s.state)) return null;
      const ms = Date.now() - new Date(s.state).getTime();
      if (!(ms >= 0)) return null;
      const m = Math.floor(ms / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
      if (d) return `${d} ${d === 1 ? 'day' : 'days'} ${h} ${h === 1 ? 'hr' : 'hrs'}`;
      if (h) return `${h} ${h === 1 ? 'hr' : 'hrs'} ${m % 60} min`;
      return `${m} min`;
    }

    _update() {
      if (!this.shadowRoot || !this._hass) return;
      const r = this.shadowRoot;
      const conn = this._st('connectivity');
      const reachable = !!conn && !['unknown', 'unavailable'].includes(conn.state);
      const stowed = this._on('stowed'), asleep = this._on('sleep'), heating = this._on('heating');

      let word, colour, mode;
      if (!reachable) { word = 'Offline'; colour = '#ff453a'; mode = 'off'; }
      else if (stowed) { word = 'Stowed'; colour = '#8e8e93'; mode = 'dim'; }
      else if (asleep) { word = 'Sleeping'; colour = '#6e8cff'; mode = 'dim'; }
      else if (conn.state === 'on') { word = 'Online'; colour = '#30d158'; mode = ''; }
      else { word = 'Offline'; colour = '#ff453a'; mode = 'off'; }

      const scene = r.querySelector('.scene');
      scene.className = `scene ${mode} ${heating && reachable ? 'heating' : ''}`;
      scene.style.setProperty('--sc', colour);
      r.querySelector('.word').textContent = word.toUpperCase();

      const key = this._modelKey(), model = MODELS[key];
      r.querySelector('.model').textContent = this._customLabel || model.label;
      if (this._shownDish !== model.dish) {
        const img = r.querySelector('.dish img');
        img.src = DISHES[model.dish];
        img.alt = `Starlink ${model.label}`;
        const g = DISH_GEOMETRY[model.dish] || { x: 50, y: 50, w: 90, h: 70 }, box = r.querySelector('.dish');
        box.style.setProperty('--gx', `${g.x}%`);
        box.style.setProperty('--gy', `${g.y}%`);
        box.style.setProperty('--gw', `${g.w * 1.25}%`);
        box.style.setProperty('--gh', `${Math.min(Math.max(g.h, 60), 85)}%`);
        this._shownDish = model.dish;
      }

      const up = this._uptime();
      let sub = '';
      if (!reachable) sub = 'Home Assistant can’t<br>reach the dish';
      else if (heating) sub = 'Snow melt on' + (up ? `<br>Up ${up}` : '');
      else if (up) sub = `Up ${up}`;
      r.querySelector('.sub').innerHTML = sub;

      const show = (v, d) => (v === null || !reachable ? '–' : v.toFixed(d));
      const down = this._mbps('downlink'), upl = this._mbps('uplink');
      const dp = (v) => (v !== null && v < 10 ? 1 : 0);
      r.querySelector('.s-down').innerHTML = `<span class="arrow">↓</span>${show(down, dp(down))}<small>MBPS</small>`;
      r.querySelector('.s-up').innerHTML = `<span class="arrow">↑</span>${show(upl, dp(upl))}<small>MBPS</small>`;
      r.querySelector('.s-ping').innerHTML = `${show(this._num('ping'), 0)}<small>MS</small>`;

      // chips: alerts first, then the everyday ones
      const chips = [];
      if (reachable) {
        for (const [role, label, kind] of ALERTS) {
          if (this._on(role)) chips.push(`<span class="chip caps ${kind}">${label}</span>`);
        }
        if (this._st('obstructed') && !this._on('obstructed')) chips.push('<span class="chip caps">No obstructions</span>');
        const drop = this._num('ping_drop_rate');
        if (drop !== null) chips.push(`<span class="chip caps">Ping drop ${drop < 1 && drop > 0 ? drop.toFixed(1) : Math.round(drop)}%</span>`);
        const w = this._num('power');
        if (w !== null) chips.push(`<span class="chip caps">${Math.round(w)} W</span>`);
      }
      r.querySelector('.chips').innerHTML = chips.join('');
      this._drawCharts();
    }

    async _loadHistory() {
      if (!this._hass || !this._hass.callWS || this._loading) return;
      if (this._lastLoad && Date.now() - this._lastLoad < 55000) return;
      this._loading = true;
      try {
        const ids = ['downlink', 'uplink', 'ping'].map((k) => this._id(k));
        const res = await this._hass.callWS({
          type: 'history/history_during_period',
          start_time: new Date(Date.now() - this._minutes * 60000).toISOString(),
          entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false,
        });
        this._series = ids.map((id) => (res[id] || []).map((p) => [
          (p.lu !== undefined ? p.lu * 1000 : new Date(p.last_updated || p.last_changed).getTime()),
          parseFloat(p.s !== undefined ? p.s : p.state),
        ]).filter(([, v]) => Number.isFinite(v)));
        this._lastLoad = Date.now();
        this._drawCharts();
      } catch (e) {
        // history isn't essential; leave the graphs empty
      } finally { this._loading = false; }
    }

    // average a series into equal buckets across the window, carrying the last value through quiet ones
    _buckets(series) {
      const n = Math.min(this._minutes, 120), span = this._minutes * 60000 / n;
      const now = Date.now(), start = now - this._minutes * 60000;
      const sums = new Array(n).fill(0), counts = new Array(n).fill(0), out = new Array(n).fill(null);
      for (const [t, v] of series) {
        const i = Math.floor((t - start) / span);
        if (i >= 0 && i < n) { sums[i] += v; counts[i]++; }
      }
      let last = null;
      for (let i = 0; i < n; i++) {
        if (counts[i]) last = sums[i] / counts[i];
        out[i] = counts[i] ? sums[i] / counts[i] : last;
      }
      return out;
    }

    _path(vals, max, close) {
      const n = vals.length; let d = '', started = false;
      vals.forEach((v, i) => {
        if (v === null) return;
        const x = (i / (n - 1)) * 100, y = 30 - Math.min(v / max, 1) * 27;
        d += `${started ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`; started = true;
      });
      if (close && started) {
        const first = vals.findIndex((v) => v !== null);
        d += `L100,30L${((first / (n - 1)) * 100).toFixed(2)},30Z`;
      }
      return d;
    }

    _niceMax(m) {
      if (!(m > 0)) return 1;
      const p = Math.pow(10, Math.floor(Math.log10(m))), f = m / p;
      return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
    }

    _drawCharts() {
      if (!this.shadowRoot) return;
      const t = this.shadowRoot.querySelector('.c-tput svg'), p = this.shadowRoot.querySelector('.c-ping svg');
      const grid = '<line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,.18)" stroke-width="1" vector-effect="non-scaling-stroke"/>'
        + '<line x1="0" y1="3" x2="100" y2="3" stroke="rgba(255,255,255,.07)" stroke-width="1" vector-effect="non-scaling-stroke"/>';
      if (!this._series) { t.innerHTML = grid; p.innerHTML = grid; return; }
      const fd = this._toMbps('downlink'), fu = this._toMbps('uplink');
      const down = this._buckets(this._series[0]).map((v) => (v === null ? null : v * fd));
      const up = this._buckets(this._series[1]).map((v) => (v === null ? null : v * fu));
      const ping = this._buckets(this._series[2]);
      const tmax = this._niceMax(Math.max(0.1, ...down.filter((v) => v !== null), ...up.filter((v) => v !== null)));
      const pmax = this._niceMax(Math.max(20, ...ping.filter((v) => v !== null)));
      const line = (d, extra) => `<path d="${d}" fill="none" vector-effect="non-scaling-stroke" ${extra}/>`;
      t.innerHTML = grid
        + `<path d="${this._path(down, tmax, true)}" fill="rgba(255,255,255,.16)"/>`
        + line(this._path(down, tmax), 'stroke="#fff" stroke-width="1.6"')
        + line(this._path(up, tmax), 'stroke="#8e8e8e" stroke-width="1.4" stroke-dasharray="3 2"');
      p.innerHTML = grid + line(this._path(ping, pmax), 'stroke="#fff" stroke-width="1.6"');
      this.shadowRoot.querySelector('.c-tput .scale').textContent = `Max ${tmax} Mbps`;
      this.shadowRoot.querySelector('.c-ping .scale').textContent = `Max ${pmax} ms`;
    }
  }

  if (!customElements.get('starlink-dish-card')) customElements.define('starlink-dish-card', StarlinkDishCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'starlink-dish-card',
    name: 'Starlink dish',
    description: 'Your Starlink dish with its status, throughput, latency and alerts.',
    preview: true,
    documentationURL: REPO,
  });
  console.info(`%c STARLINK-DISH-CARD %c ${STARLINK_CARD_VERSION} `, 'background:#000;color:#fff', 'background:#fff;color:#000');
})();
