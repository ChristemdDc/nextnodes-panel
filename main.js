/* ============================================================
   NextNodes Panel – Main JavaScript
   ============================================================ */

// ---------- Sample data (replace with real API calls) ----------
const NODES = [
  { id: 1, name: 'node-us-east-1',  status: 'online',  region: 'US East'   },
  { id: 2, name: 'node-eu-west-1',  status: 'online',  region: 'EU West'   },
  { id: 3, name: 'node-ap-south-1', status: 'warning', region: 'AP South'  },
  { id: 4, name: 'node-us-west-2',  status: 'offline', region: 'US West'   },
  { id: 5, name: 'node-eu-central', status: 'online',  region: 'EU Central'},
];

// ---------- Render Nodes Table ----------
function renderNodes(nodes) {
  const tbody = document.getElementById('nodesTableBody');
  if (!tbody) return;

  tbody.innerHTML = nodes.map(node => `
    <tr>
      <td>${node.id}</td>
      <td>${node.name}</td>
      <td><span class="badge badge-${node.status}">${node.status}</span></td>
      <td>${node.region}</td>
      <td>
        <button class="btn btn-secondary" style="font-size:0.8rem;padding:0.3rem 0.7rem"
          onclick="toggleNode(${node.id})">Toggle</button>
      </td>
    </tr>
  `).join('');
}

// ---------- Toggle Node Status ----------
function toggleNode(id) {
  const node = NODES.find(n => n.id === id);
  if (!node) return;

  if (node.status === 'online') {
    node.status = 'offline';
  } else {
    node.status = 'online';
  }

  renderNodes(NODES);
  updateNodeCount();
  showToast(`Node "${node.name}" is now ${node.status}.`);
}

// ---------- Update active node counter ----------
function updateNodeCount() {
  const el = document.getElementById('nodeCount');
  if (el) el.textContent = NODES.filter(n => n.status === 'online').length;
}

// ---------- Toast notification ----------
let toastTimer = null;

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ---------- Settings ----------
function loadSettings() {
  const saved = localStorage.getItem('nn_settings');
  if (!saved) return;

  try {
    const settings = JSON.parse(saved);
    const panelName = document.getElementById('panelName');
    const apiUrl    = document.getElementById('apiUrl');
    const theme     = document.getElementById('themeSelect');

    if (panelName && settings.panelName) panelName.value = settings.panelName;
    if (apiUrl    && settings.apiUrl)    apiUrl.value    = settings.apiUrl;
    if (theme     && settings.theme)     theme.value     = settings.theme;

    applyTheme(settings.theme || 'dark');
  } catch (_) { /* ignore corrupt data */ }
}

function saveSettings() {
  const panelName = document.getElementById('panelName')?.value ?? '';
  const apiUrl    = document.getElementById('apiUrl')?.value    ?? '';
  const theme     = document.getElementById('themeSelect')?.value ?? 'dark';

  localStorage.setItem('nn_settings', JSON.stringify({ panelName, apiUrl, theme }));
  applyTheme(theme);
  showToast('Settings saved!');
}

function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
}

// ---------- Smooth scroll for nav links ----------
function initNavLinks() {
  document.querySelectorAll('.navbar-links a').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  renderNodes(NODES);
  updateNodeCount();
  loadSettings();
  initNavLinks();

  document.getElementById('saveSettings')
    ?.addEventListener('click', saveSettings);

  document.getElementById('getStartedBtn')
    ?.addEventListener('click', () => {
      document.getElementById('nodes')?.scrollIntoView({ behavior: 'smooth' });
    });

  document.getElementById('loginBtn')
    ?.addEventListener('click', () => showToast('Login functionality coming soon!'));
});
