const SNAP = 24;
const state = {
  endpoints: [],
  endpointLinks: [],
  flows: [],
  selectedEndpointId: null,
  selectedFlowId: null,
  connectMode: false,
  connectSourceId: null,
  theme: 'dark',
  view: { scale: 1, x: 0, y: 0 },
};

const defaults = {
  errors: [
    { status: 400, type: 'BadRequest', message: 'Validation failed for payload.' },
    { status: 401, type: 'Unauthorized', message: 'Missing or invalid credentials.' },
    { status: 404, type: 'NotFound', message: 'Resource not found.' },
    { status: 500, type: 'InternalServerError', message: 'Unexpected backend failure.' },
  ],
  outputs: [
    { name: 'result', type: 'object', structure: '{ success: true }' },
    { name: 'meta', type: 'object', structure: '{ traceId, timestamp }' },
  ],
};

const serviceErrorSuggestions = {
  database: [
    { status: 503, type: 'DatabaseUnavailable', message: 'Database connection timed out.' },
    { status: 409, type: 'ConstraintViolation', message: 'Unique constraint violation.' },
  ],
  externalApi: [
    { status: 502, type: 'UpstreamFailure', message: 'Upstream returned malformed response.' },
    { status: 504, type: 'GatewayTimeout', message: 'External service timeout.' },
  ],
  queue: [{ status: 503, type: 'QueueUnavailable', message: 'Queue transport unavailable.' }],
};

const diagram = document.getElementById('diagram-area');
const viewport = document.getElementById('viewport');
const connectionLayer = document.getElementById('connection-layer');
const detailsContent = document.getElementById('details-content');
const selectionState = document.getElementById('selection-state');
const connectState = document.getElementById('connect-state');
const zoomState = document.getElementById('zoom-state');
const tooltip = document.getElementById('flow-tooltip');

function id() { return crypto.randomUUID(); }
const snap = (n) => Math.round(n / SNAP) * SNAP;

function seed() {
  addEndpoint({ name: 'CreateUser', method: 'POST', path: '/users', x: 144, y: 120, inputs: [{ name: 'email', type: 'string', constraints: 'required,email' }, { name: 'password', type: 'string', constraints: 'required,min:8' }] });
  addEndpoint({ name: 'GetUserProfile', method: 'GET', path: '/users/{id}', x: 540, y: 256, inputs: [{ name: 'id', type: 'uuid', constraints: 'required,path param' }] });
  addEndpointLink(state.endpoints[0].id, state.endpoints[1].id);
}

function addEndpoint(partial = {}) {
  const endpoint = {
    id: id(),
    name: partial.name || `Endpoint${state.endpoints.length + 1}`,
    method: partial.method || 'GET',
    path: partial.path || `/resource/${state.endpoints.length + 1}`,
    x: partial.x ?? 120,
    y: partial.y ?? 120,
    linkedService: partial.linkedService || 'none',
    inputs: partial.inputs || [{ name: 'id', type: 'string', constraints: 'optional' }],
    outputs: partial.outputs || structuredClone(defaults.outputs),
    errors: [...structuredClone(defaults.errors), ...(partial.errors || [])],
  };

  state.endpoints.push(endpoint);
  selectEndpoint(endpoint.id);
  generateDataFlows(endpoint.id);
  render();
}

function generateDataFlows(endpointId) {
  state.flows = state.flows.filter((f) => f.endpointId !== endpointId);
  const endpoint = getEndpoint(endpointId);
  endpoint.inputs.forEach((input) => {
    const out = endpoint.outputs[0];
    if (!out) return;
    state.flows.push({
      id: id(),
      endpointId,
      from: `in:${input.name}`,
      to: `out:${out.name}`,
      kind: 'data',
      details: `${input.name} (${input.type}) -> ${out.name} (${out.type}) | ${input.constraints}`,
    });
  });
}

function getEndpoint(endpointId) { return state.endpoints.find((e) => e.id === endpointId); }

function addEndpointLink(from, to) {
  if (!from || !to || from === to) return;
  const exists = state.endpointLinks.some((l) => l.from === from && l.to === to);
  if (!exists) state.endpointLinks.push({ id: id(), from, to, kind: 'endpoint', details: `${getEndpoint(from).name} -> ${getEndpoint(to).name}` });
}

function render() {
  viewport.querySelectorAll('.endpoint-card').forEach((node) => node.remove());
  for (const endpoint of state.endpoints) {
    const card = document.getElementById('endpoint-card-template').content.firstElementChild.cloneNode(true);
    card.dataset.endpointId = endpoint.id;
    card.style.left = `${endpoint.x}px`;
    card.style.top = `${endpoint.y}px`;
    card.querySelector('h3').textContent = endpoint.name;
    card.querySelector('.method-pill').textContent = endpoint.method;
    card.querySelector('.path').textContent = endpoint.path;
    card.classList.toggle('selected', state.selectedEndpointId === endpoint.id);

    fillPorts(card.querySelector('.input-ports'), endpoint.inputs, 'input', '⤓');
    fillPorts(card.querySelector('.output-ports'), endpoint.outputs, 'output', '✓');
    fillPorts(card.querySelector('.error-ports'), endpoint.errors, 'error', '⚠');

    attachCardEvents(card, endpoint.id);
    viewport.appendChild(card);
  }
  renderConnections();
  updateStatus();
}

function fillPorts(container, items, kind, icon) {
  container.innerHTML = '';
  items.forEach((item) => {
    const label = kind === 'error' ? `${item.status} ${item.type}` : `${item.name}:${item.type}`;
    const chip = document.createElement('button');
    chip.className = `port ${kind}`;
    chip.innerHTML = `<span>${icon}</span><span>${label}</span>`;
    chip.type = 'button';
    container.appendChild(chip);
  });
}

function attachCardEvents(card, endpointId) {
  let dragging = false; let offsetX = 0; let offsetY = 0;

  card.addEventListener('click', (event) => {
    event.stopPropagation();
    if (state.connectMode) return handleConnectClick(endpointId);
    state.selectedFlowId = null;
    selectEndpoint(endpointId);
    render();
  });

  card.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    dragging = true;
    const rect = card.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    const onMove = (e) => {
      if (!dragging) return;
      const d = diagram.getBoundingClientRect();
      const x = snap((e.clientX - d.left - state.view.x) / state.view.scale - offsetX);
      const y = snap((e.clientY - d.top - state.view.y) / state.view.scale - offsetY);
      const ep = getEndpoint(endpointId);
      ep.x = Math.max(0, x);
      ep.y = Math.max(0, y);
      card.style.left = `${ep.x}px`;
      card.style.top = `${ep.y}px`;
      renderConnections();
    };
    const onUp = () => {
      dragging = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}

function connectPointFor(endpointId, kind, index = 0) {
  const card = viewport.querySelector(`[data-endpoint-id="${endpointId}"]`);
  if (!card) return null;
  const x0 = card.offsetLeft; const y0 = card.offsetTop;
  if (kind === 'left') return { x: x0, y: y0 + 78 + index * 18 };
  if (kind === 'right') return { x: x0 + card.offsetWidth, y: y0 + 78 + index * 18 };
  return { x: x0 + card.offsetWidth / 2, y: y0 + card.offsetHeight / 2 };
}

function renderConnections() {
  connectionLayer.innerHTML = '';

  for (const link of state.endpointLinks) {
    const from = connectPointFor(link.from, 'right');
    const to = connectPointFor(link.to, 'left');
    if (!from || !to) continue;
    drawPath(from, to, link.id, link.details, true);
  }

  for (const flow of state.flows) {
    const source = connectPointFor(flow.endpointId, 'left', 0);
    const target = connectPointFor(flow.endpointId, 'right', 0);
    if (!source || !target) continue;
    drawPath({ x: source.x + 8, y: source.y }, { x: target.x - 8, y: target.y + 2 }, flow.id, flow.details, false);
  }
}

function drawPath(from, to, flowId, details, isLink) {
  const c = Math.max(50, Math.abs(to.x - from.x) / 2);
  const d = `M ${from.x} ${from.y} C ${from.x + c} ${from.y}, ${to.x - c} ${to.y}, ${to.x} ${to.y}`;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.classList.add('flow-path');
  if (isLink) path.classList.add('endpoint-link');
  path.dataset.flowId = flowId;
  path.dataset.details = details;

  const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  hit.setAttribute('d', d);
  hit.classList.add('flow-hit');
  hit.dataset.flowId = flowId;
  hit.dataset.details = details;

  [path, hit].forEach((node) => {
    node.addEventListener('mouseenter', onFlowHover);
    node.addEventListener('mousemove', onFlowHover);
    node.addEventListener('mouseleave', hideTooltip);
    node.addEventListener('click', (event) => {
      event.stopPropagation();
      state.selectedEndpointId = null;
      state.selectedFlowId = flowId;
      renderFlowDetails(details);
    });
  });

  connectionLayer.append(path, hit);
}

function onFlowHover(event) {
  tooltip.textContent = event.target.dataset.details;
  tooltip.classList.remove('hidden');
  const rect = diagram.getBoundingClientRect();
  tooltip.style.left = `${event.clientX - rect.left + 12}px`;
  tooltip.style.top = `${event.clientY - rect.top + 12}px`;
}
function hideTooltip() { tooltip.classList.add('hidden'); }

function handleConnectClick(endpointId) {
  if (!state.connectSourceId) {
    state.connectSourceId = endpointId;
    connectState.textContent = `Connect: choose target for ${getEndpoint(endpointId).name}`;
    return;
  }
  addEndpointLink(state.connectSourceId, endpointId);
  state.connectMode = false;
  state.connectSourceId = null;
  document.getElementById('connect-btn').classList.remove('btn-primary');
  connectState.textContent = 'Mode: Select';
  renderConnections();
}

function selectEndpoint(id) {
  state.selectedEndpointId = id;
  const endpoint = getEndpoint(id);
  renderEndpointDetails(endpoint);
}

function renderEndpointDetails(endpoint) {
  if (!endpoint) return (detailsContent.innerHTML = '');
  detailsContent.innerHTML = `
    <label>Name <input data-f="name" value="${esc(endpoint.name)}"></label>
    <label>Path <input data-f="path" value="${esc(endpoint.path)}"></label>
    <label>Method
      <select data-f="method">${['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => `<option ${endpoint.method === m ? 'selected' : ''}>${m}</option>`).join('')}</select>
    </label>
    <label>Linked service
      <select data-f="linkedService">
        ${['none', 'database', 'externalApi', 'queue'].map((s) => `<option value="${s}" ${endpoint.linkedService === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </label>

    ${group('Inputs', endpoint.inputs.map((x) => `${x.name} (${x.type}) ${x.constraints}`), 'b-input')}
    ${group('Outputs', endpoint.outputs.map((x) => `${x.name} (${x.type}) ${x.structure}`), 'b-output')}
    ${group('Errors', endpoint.errors.map((x) => `${x.status} ${x.type} - ${x.message}`), 'b-error')}

    <div class="chips">
      <button class="btn" id="add-input">+ Input (I)</button>
      <button class="btn" id="add-output">+ Output (O)</button>
      <button class="btn" id="add-error">+ Error (E)</button>
    </div>
  `;

  detailsContent.querySelectorAll('[data-f]').forEach((el) => {
    el.addEventListener('input', (ev) => {
      endpoint[ev.target.dataset.f] = ev.target.value;
      if (ev.target.dataset.f === 'linkedService') addSuggestedErrors(endpoint);
      generateDataFlows(endpoint.id);
      render();
      renderEndpointDetails(endpoint);
    });
  });

  detailsContent.querySelector('#add-input').addEventListener('click', () => { endpoint.inputs.push({ name: `input${endpoint.inputs.length + 1}`, type: 'string', constraints: 'optional' }); generateDataFlows(endpoint.id); render(); renderEndpointDetails(endpoint); });
  detailsContent.querySelector('#add-output').addEventListener('click', () => { endpoint.outputs.push({ name: `output${endpoint.outputs.length + 1}`, type: 'object', structure: '{...}' }); generateDataFlows(endpoint.id); render(); renderEndpointDetails(endpoint); });
  detailsContent.querySelector('#add-error').addEventListener('click', () => { endpoint.errors.push({ status: 422, type: 'DomainError', message: 'Business rule violation.' }); render(); renderEndpointDetails(endpoint); });
}

function group(title, items, badgeClass) {
  return `<section class="group"><h4>${title}</h4><div class="chips">${items.map((i) => `<span class="chip"><span class="badge ${badgeClass}">•</span> ${i}</span>`).join('')}</div></section>`;
}

function addSuggestedErrors(endpoint) {
  for (const suggestion of serviceErrorSuggestions[endpoint.linkedService] || []) {
    if (!endpoint.errors.some((e) => e.status === suggestion.status && e.type === suggestion.type)) endpoint.errors.push(suggestion);
  }
}

function renderFlowDetails(details) {
  detailsContent.innerHTML = `<section class="group"><h4>Flow details</h4><p>${esc(details)}</p><p class="muted">Hovering arrows displays this tooltip as well.</p></section>`;
}

function autoLayout() {
  const cols = Math.max(1, Math.floor((diagram.clientWidth - 80) / 360));
  state.endpoints.forEach((ep, i) => {
    ep.x = snap(60 + (i % cols) * 330);
    ep.y = snap(70 + Math.floor(i / cols) * 220);
  });
  render();
}

function updateViewport() {
  viewport.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.scale})`;
  zoomState.textContent = `Zoom: ${Math.round(state.view.scale * 100)}%`;
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = state.theme;
}

function exportOpenApi() {
  const paths = {};
  for (const ep of state.endpoints) {
    const mk = ep.method.toLowerCase();
    paths[ep.path] ||= {};
    paths[ep.path][mk] = {
      summary: ep.name,
      requestBody: { content: { 'application/json': { schema: { type: 'object', properties: Object.fromEntries(ep.inputs.map((x) => [x.name, { type: normalizeType(x.type), description: x.constraints }])) } } } },
      responses: Object.fromEntries([
        ...ep.outputs.map((x, i) => [String(200 + i), { description: `${x.name} response` }]),
        ...ep.errors.map((x) => [String(x.status), { description: `${x.type}: ${x.message}` }]),
      ]),
    };
  }
  download('openapi.json', JSON.stringify({ openapi: '3.1.0', info: { title: 'API Designer Export', version: '1.0.0' }, paths }, null, 2), 'application/json');
}

function exportSvg() {
  const svg = connectionLayer.cloneNode(true);
  const cards = [...viewport.querySelectorAll('.endpoint-card')].map((c) => `<foreignObject x="${c.offsetLeft}" y="${c.offsetTop}" width="${c.offsetWidth}" height="${c.offsetHeight}"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Inter,Segoe UI,sans-serif;font-size:12px;background:${state.theme === 'dark' ? '#152036' : '#fff'};color:${state.theme === 'dark' ? '#e6edf8' : '#1b2538'};border:1px solid #667;padding:8px;border-radius:10px;">${esc(c.innerText)}</div></foreignObject>`).join('');
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${diagram.clientWidth}" height="${diagram.clientHeight}">${svg.innerHTML}${cards}</svg>`;
  download('diagram.svg', markup, 'image/svg+xml');
}

function exportPng() {
  const html = new XMLSerializer().serializeToString(document.documentElement);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${window.innerWidth}" height="${window.innerHeight}"><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`;
  const img = new Image();
  const canvas = document.createElement('canvas');
  canvas.width = diagram.clientWidth; canvas.height = diagram.clientHeight;
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, -diagram.getBoundingClientRect().left, -diagram.getBoundingClientRect().top);
    canvas.toBlob((blob) => downloadBlob('diagram.png', blob));
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function download(name, content, type) { downloadBlob(name, new Blob([content], { type })); }
function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function normalizeType(t) { return ['string', 'number', 'integer', 'boolean', 'array', 'object'].includes(String(t).toLowerCase()) ? String(t).toLowerCase() : 'object'; }
function esc(v) { return String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }

function updateStatus() {
  const ep = state.selectedEndpointId ? getEndpoint(state.selectedEndpointId) : null;
  selectionState.textContent = ep ? `Selected: ${ep.name}` : state.selectedFlowId ? 'Selected: data flow' : 'No endpoint selected';
}

function bindUI() {
  document.getElementById('add-endpoint-btn').addEventListener('click', () => addEndpoint());
  document.getElementById('connect-btn').addEventListener('click', (e) => {
    state.connectMode = !state.connectMode;
    state.connectSourceId = null;
    e.currentTarget.classList.toggle('btn-primary', state.connectMode);
    connectState.textContent = state.connectMode ? 'Connect: choose source endpoint' : 'Mode: Select';
  });
  document.getElementById('auto-layout-btn').addEventListener('click', autoLayout);
  document.getElementById('theme-btn').addEventListener('click', () => { toggleTheme(); renderConnections(); });
  document.getElementById('export-openapi-btn').addEventListener('click', exportOpenApi);
  document.getElementById('export-svg-btn').addEventListener('click', exportSvg);
  document.getElementById('export-image-btn').addEventListener('click', exportPng);

  diagram.addEventListener('click', () => { state.selectedEndpointId = null; state.selectedFlowId = null; detailsContent.innerHTML = ''; updateStatus(); render(); });

  diagram.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    state.view.scale = Math.min(2, Math.max(0.5, +(state.view.scale + delta).toFixed(2)));
    updateViewport();
  }, { passive: false });

  let panning = false; let startX = 0; let startY = 0;
  diagram.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.endpoint-card')) return;
    if (e.button !== 1 && !e.shiftKey) return;
    panning = true; startX = e.clientX - state.view.x; startY = e.clientY - state.view.y;
  });
  window.addEventListener('pointermove', (e) => {
    if (!panning) return;
    state.view.x = e.clientX - startX;
    state.view.y = e.clientY - startY;
    updateViewport();
  });
  window.addEventListener('pointerup', () => { panning = false; });

  window.addEventListener('keydown', (e) => {
    if (/input|textarea|select/i.test(document.activeElement.tagName)) return;
    const ep = state.selectedEndpointId ? getEndpoint(state.selectedEndpointId) : null;
    if (e.key.toLowerCase() === 'n') addEndpoint();
    if (e.key.toLowerCase() === 'c') document.getElementById('connect-btn').click();
    if (e.key.toLowerCase() === 'l') autoLayout();
    if (e.key.toLowerCase() === 't') toggleTheme();
    if (e.key === '+') { state.view.scale = Math.min(2, +(state.view.scale + 0.1).toFixed(2)); updateViewport(); }
    if (e.key === '-') { state.view.scale = Math.max(0.5, +(state.view.scale - 0.1).toFixed(2)); updateViewport(); }
    if (e.key === '0') { state.view = { scale: 1, x: 0, y: 0 }; updateViewport(); }
    if (!ep) return;
    if (e.key.toLowerCase() === 'i') ep.inputs.push({ name: `input${ep.inputs.length + 1}`, type: 'string', constraints: 'optional' });
    if (e.key.toLowerCase() === 'o') ep.outputs.push({ name: `output${ep.outputs.length + 1}`, type: 'object', structure: '{...}' });
    if (e.key.toLowerCase() === 'e') ep.errors.push({ status: 500, type: 'CustomError', message: 'Error description.' });
    generateDataFlows(ep.id);
    render();
    renderEndpointDetails(ep);
  });
}

seed();
bindUI();
updateViewport();
render();
