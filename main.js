document.addEventListener('DOMContentLoaded', () => {
    
    // State
    const state = {
        apiUrl: localStorage.getItem('apiUrl') || 'http://localhost:8081/api/v1',
        linked: false,
        token: null,
        groups: [],
        currentProfileUuid: null, // Track current profile
        sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true'
    };

    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mainContent = document.querySelector('main');
    const views = document.querySelectorAll('.view');
    const navLinks = document.querySelectorAll('.nav-link');
    const linkBtn = document.getElementById('linkServerBtn');
    const loginBtn = document.getElementById('loginBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const serverStatus = document.getElementById('serverStatus');
    const apiUrlInput = document.getElementById('apiUrl');
    
    // Sidebar toggle functionality
    function toggleSidebar() {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
        
        if (state.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('collapsed');
        }
    }
    
    // Initialize sidebar state
    if (state.sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('collapsed');
    }
    
    // Event listener for toggle button
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // Init Settings
    apiUrlInput.value = state.apiUrl;

    // Navigation
    function navigate(targetId) {
        // Hide ALL views first
        views.forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('active');
        });

        // Show the specific normal view
        const targetView = document.getElementById(`${targetId}-view`);
        if (targetView) {
            targetView.classList.remove('hidden');
            targetView.classList.add('active');
        }

        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.target === targetId);
        });

        // Fetch audit logs immediately when entering audit view
        if (targetId === 'audit') {
            fetchAuditLogs(true);
        }
    }
    
    // Expose navigate globally
    window.navigate = navigate;
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;
            // Solo navegar si está vinculado o es settings
            if (target === 'settings' || state.linked) {
                if (target) navigate(target);
            } else {
                showInfoModal('Vinculación Requerida', '⚠️', 'Por favor, vincula un servidor de Minecraft primero para acceder a esta sección.');
            }
        });
    });
    
    linkBtn.addEventListener('click', () => {
        navigate('link');
    });

    loginBtn.addEventListener('click', () => {
        if (typeof authService !== 'undefined' && authService && authService.isAuthenticated()) {
            openLogoutModal();
        } else {
            window.location.href = 'auth.html';
        }
    });

    function checkAuth() {
        if (typeof authService !== 'undefined') {
            console.log('[DEBUG] checkAuth: isAuthenticated?', authService.isAuthenticated());
        }
    }

    setTimeout(checkAuth, 500);

    /**
     * Lógica del Modal de Logout Personalizado
     */
    const logoutModal = document.getElementById('confirmLogoutModal');
    const confirmLogoutBtn = document.getElementById('confirmLogoutSubmitBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

    function openLogoutModal() {
        if (logoutModal) {
            logoutModal.classList.remove('hidden');
        }
    }

    function closeLogoutModal() {
        if (logoutModal) {
            logoutModal.classList.add('hidden');
        }
    }

    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => {
            if (typeof authService !== 'undefined' && authService) {
                authService.logout();
                closeLogoutModal();
                navigate('dashboard');
                window.location.reload();
            }
        });
    }

    const logoutBtnTop = document.getElementById('logoutBtnTop');

    // The original `logoutBtn` variable is not defined in this scope.
    // Assuming `confirmLogoutBtn` is the primary logout trigger from the modal.
    // The instruction implies `logoutBtn` might be another element, but it's not in the provided code.
    // For now, only `logoutBtnTop` is handled as per the instruction.
    if (logoutBtnTop) logoutBtnTop.addEventListener('click', () => {
        if (typeof authService !== 'undefined' && authService) authService.logout();
    });

    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', closeLogoutModal);
    }

    // Cerrar al hacer clic fuera del contenido
    window.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            closeLogoutModal();
        }
    });
    /**
     * Actualiza la interfaz de usuario con los datos del usuario
     */
    function updateUserUI() {
        const userBadge = document.getElementById('userDisplayName');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtnTop = document.getElementById('logoutBtnTop');
        
        if (!userBadge || !loginBtn) return;

        const statusText = userBadge.querySelector('.status-text');

        if (typeof authService !== 'undefined' && authService && authService.isAuthenticated()) {
            const user = authService.getCurrentUser();
            console.log('[DEBUG] User is authenticated:', user);
            
            // Show username in red box area (navbar center)
            if (statusText) {
                // Try different properties based on common auth response patterns
                statusText.textContent = user.name || user.displayName || user.username || user.email || 'Usuario';
            }
            userBadge.classList.remove('hidden');
            
            // Handle Green Box area (Logout after login)
            if (loginBtn) loginBtn.classList.add('hidden');
            if (logoutBtnTop) logoutBtnTop.classList.remove('hidden');
        } else {
            console.log('[DEBUG] User is not authenticated');
            if (statusText) statusText.textContent = 'Bienvenido';
            userBadge.classList.add('hidden');
            
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (logoutBtnTop) logoutBtnTop.classList.add('hidden');
        }
    }

    // Hacer disponible globalmente para AuthService
    window.updateUserUI = updateUserUI;

    // Inicializar UI de usuario inmediatamente
    updateUserUI();
    
    // Y de nuevo cuando el DOM esté completamente cargado para asegurar que AuthService existe
    document.addEventListener('DOMContentLoaded', updateUserUI);

    disconnectBtn.addEventListener('click', () => {
        if(confirm("Are you sure you want to disconnect?")) {
            state.linked = false;
            state.token = null;
            updateStatus(false);
            navigate('link');
        }
    });

    // Settings
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        const url = apiUrlInput.value.replace(/\/$/, '');
        state.apiUrl = url;
        localStorage.setItem('apiUrl', url);
        showInfoModal('Ajustes Guardados', '⚙️', 'La configuración del API se ha actualizado correctamente.');
        checkServerStatus();
    });

    /**
     * Lógica de Modal Informativo General
     */
    const infoModal = document.getElementById('generalInfoModal');
    const infoTitle = document.getElementById('infoModalTitle');
    const infoMsg = document.getElementById('infoModalMessage');
    const infoIcon = document.getElementById('infoModalIcon');
    const closeInfoBtn = document.getElementById('closeInfoModalBtn');

    function showInfoModal(title, icon, message) {
        if (!infoModal) return;
        if (infoTitle) infoTitle.textContent = title;
        if (infoIcon) infoIcon.textContent = icon;
        if (infoMsg) infoMsg.textContent = message;
        infoModal.classList.remove('hidden');
    }

    if (closeInfoBtn) {
        closeInfoBtn.addEventListener('click', () => {
            infoModal.classList.add('hidden');
        });
    }

    // Cerrar al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === infoModal) {
            infoModal.classList.add('hidden');
        }
    });

    // Link Logic
    document.getElementById('confirmLinkBtn').addEventListener('click', async () => {
        const key = document.getElementById('linkKeyInput').value.trim();
        const msg = document.getElementById('linkMessage');
        
        if (!key) return;
        
        msg.textContent = 'Connecting...';
        msg.style.color = 'var(--text-secondary)';
        
        try {
            const res = await fetch(`${state.apiUrl}/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            
            if (res.ok) {
                msg.textContent = 'Server Linked Successfully!';
                msg.style.color = 'var(--success)';
                state.linked = true;
                updateStatus(true);
                setTimeout(() => navigate('dashboard'), 1500);
            } else {
                throw new Error('Invalid key or server unreachable');
            }
        } catch (e) {
            msg.textContent = 'Error: ' + e.message;
            msg.style.color = 'var(--danger)';
            
            // DEMO MODE fallback
            console.log("Failed to connect to real API, asking for Demo Mode...");
            if (confirm("Could not connect to server at " + state.apiUrl + ". \n\nDo you want to enable DEMO MODE to preview the panel?")) {
                 state.linked = true;
                 updateStatus(true);
                 mockData();
                 navigate('dashboard');
            }
        }
    });
    
    function updateStatus(online) {
        const statusText = document.getElementById('serverStatusText');
        if (online) {
            if (statusText) statusText.textContent = 'Connected';
            serverStatus.classList.remove('offline');
            serverStatus.classList.add('online');
            linkBtn.classList.add('hidden');
            disconnectBtn.classList.remove('hidden');
            loadGroups(); // Cargar grupos al conectar
            loadUsersList(); // Cargar usuarios al conectar
            
            // Actualizar uptime si está disponible en state o mock
            const uptimeEl = document.getElementById('uptime');
            if (uptimeEl && uptimeEl.textContent === '--') {
                uptimeEl.textContent = 'Online';
            }
        } else {
            if (statusText) statusText.textContent = 'Disconnected';
            serverStatus.classList.add('offline');
            serverStatus.classList.remove('online');
            linkBtn.classList.remove('hidden');
            disconnectBtn.classList.add('hidden');
            
            // Limpiar datos visuales de la sesión anterior
            document.getElementById('groupsTableBody').innerHTML = '';
            document.getElementById('usersTableBody').innerHTML = '';
            document.getElementById('userCount').textContent = '--';
            document.getElementById('groupCount').textContent = '--';
            document.getElementById('uptime').textContent = '--';
            
            // Cerrar perfil si está abierto
            userInfoContainer.classList.add('hidden');
            usersListContainer.classList.remove('hidden');
            state.currentProfileUuid = null;
            
            // Volver a la pantalla de inicio/link para evitar ver datos estáticos
            navigate('link');
        }
    }
    
    async function checkServerStatus() {
        try {
            const res = await fetch(`${state.apiUrl}/ping`);
            if (res.ok) {
                // Si el servidor vuelve, actualizamos el estado visual si estaba desconectado
                // PERO solo si estamos lógicamente vinculados
                if (state.linked && serverStatus.classList.contains('offline')) {
                    updateStatus(true);
                    navigate('dashboard'); // Volver al dashboard automáticamente
                }
                return true;
            } else {
                // Solo mostramos desconexión si estábamos vinculados
                if (state.linked) {
                    updateStatus(false);
                } else {
                    // Sin vincular: mantener rojo
                    serverStatus.classList.add('offline');
                    serverStatus.classList.remove('online');
                }
                return false;
            }
        } catch (e) {
            if (state.linked) {
                updateStatus(false);
            } else {
                // Sin vincular: mantener rojo
                serverStatus.classList.add('offline');
                serverStatus.classList.remove('online');
            }
            return false;
        }
    }
    
    // Polling para tiempo real (cada 2 segundos si está vinculado)
    setInterval(async () => {
        if (state.linked) {
            // Primero verificamos estado
            const isOnline = await checkServerStatus();
            if (isOnline) {
                loadGroups();
                loadUsersList();
                
                // Si hay un perfil abierto y visible, lo actualizamos en segundo plano
                if (state.currentProfileUuid && !userInfoContainer.classList.contains('hidden')) {
                    refreshUserProfile(state.currentProfileUuid);
                }

                // Update audit if visible
                if (!document.getElementById('audit-view').classList.contains('hidden')) {
                    fetchAuditLogs();
                }
            }
        }
    }, 2000);

    async function refreshUserProfile(uuid) {
        try {
            const res = await fetch(`${state.apiUrl}/users/${uuid}?_=${Date.now()}`);
            if (res.ok) {
                const user = await res.json();
                // Solo renderizamos si seguimos en el mismo perfil (por si cambió rápido)
                if (state.currentProfileUuid === uuid) {
                    renderUser(user);
                }
            }
        } catch (e) {
            // Silencioso en background
            console.error("Error refreshing profile:", e);
        }
    }

    async function loadGroups() {
        try {
            const res = await fetch(`${state.apiUrl}/groups`);
            if (res.ok) {
                const groups = await res.json();
                state.groups = groups;
                renderGroups();
                document.getElementById('groupCount').textContent = groups.length;
            }
        } catch (e) {
            console.error("Error loading groups", e);
        }
    }

    function renderGroups() {
        const tbody = document.getElementById('groupsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = state.groups.map(g => `
            <tr>
                <td>${g.name}</td>
                <td>${g.weight || 0}</td>
                <td>${g.prefix || ''}</td>
                <td>
                    <button class="btn btn-outline" onclick="editGroup('${g.name}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteGroup('${g.name}')" style="margin-left: 0.5rem; padding: 0.25rem 0.5rem;">Del</button>
                </td>
            </tr>
        `).join('');
    }

    // Expose global functions for onclick
    window.deleteGroup = async (name) => {
        if (!confirm(`Delete group ${name}?`)) return;
        
        try {
            const res = await fetch(`${state.apiUrl}/groups`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            if (res.ok) {
                loadGroups();
                fetchAuditLogs();
            } else {
                alert("Failed to delete group");
            }
        } catch (e) {
            alert("Error: " + e.message);
        }
    };

    window.editGroup = (name) => {
        alert("Edit group " + name);
    };

    // Crear grupo
    document.getElementById('createGroupBtn').addEventListener('click', async () => {
        const name = prompt("Enter group name:");
        if (!name) return;
        
        try {
            const res = await fetch(`${state.apiUrl}/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            if (res.ok) {
                loadGroups(); // Recargar lista
                fetchAuditLogs();
            } else {
                alert("Failed to create group");
            }
        } catch (e) {
            alert("Error: " + e.message);
        }
    });

    // --- AUDIT LOG ---
    document.getElementById('refreshAuditBtn').addEventListener('click', () => fetchAuditLogs(true));

    async function fetchAuditLogs(showSpinner = false) {
        const tbody = document.getElementById('auditTableBody');
        if (!tbody) return;
        
        // Solo mostrar spinner en carga manual (navegar a la vista o botón Refresh).
        // En el polling automático NO se limpia la tabla para evitar parpadeo.
        if (showSpinner) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);"><span style="display:inline-block; width:14px; height:14px; border:2px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation:spin 0.6s linear infinite; vertical-align:middle; margin-right:8px;"></span> Cargando...</td></tr>';
        }
        
        let res;
        try {
            res = await fetch(`${state.apiUrl}/audit`);
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">❌ Sin conexión al servidor (${e.message}). Verifica que Minecraft esté corriendo.</td></tr>`;
            console.error("[Audit] Network error:", e);
            return;
        }

        let rawText;
        try { rawText = await res.text(); } catch (e) { return; }

        if (!res.ok) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">⚠️ Error HTTP ${res.status}: ${rawText.substring(0, 200)}</td></tr>`;
            console.error("[Audit] HTTP error:", res.status, rawText);
            return;
        }

        let logs;
        try {
            logs = JSON.parse(rawText);
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">⚠️ JSON inválido: ${rawText.substring(0, 300)}</td></tr>`;
            console.error("[Audit] JSON error:", e, rawText);
            return;
        }

        renderAuditLogs(logs);
    }

    function renderAuditLogs(logs) {
        const tbody = document.getElementById('auditTableBody');
        if (!tbody) return;
        
        if (!Array.isArray(logs) || logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No hay logs de auditoría. Realiza alguna acción (crear grupo, editar usuario, etc.) para generar registros.</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => {
            const date = new Date(log.timestamp).toLocaleString();
            let actionColor = 'var(--text-primary)';
            if (log.action.includes('ADD')) actionColor = 'var(--success)';
            if (log.action.includes('REMOVE')) actionColor = 'var(--danger)';
            if (log.action.includes('LINK')) actionColor = 'var(--primary)';

            // Escapar HTML para prevenir XSS
            const escapeHtml = (str) => String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(log.targetId);
            const targetDisplay = isUuid
                ? `<span style="cursor:pointer; color:var(--text-primary);"
                       onclick="navigator.clipboard.writeText('${escapeHtml(log.targetId)}')"
                       title="UUID: ${escapeHtml(log.targetId)} — Click para copiar">${escapeHtml(log.targetName || log.targetId)}</span>`
                : `<code style="background: var(--bg-dark); padding: 0.2rem 0.4rem; border-radius: 4px;">${escapeHtml(log.targetName || log.targetId)}</code>`;

            return `
            <tr>
                <td style="color: var(--text-secondary); font-size: 0.85rem;">${escapeHtml(date)}</td>
                <td style="color: var(--primary);">${escapeHtml(log.actorName)}</td>
                <td style="color: ${actionColor}; font-weight: bold;">${escapeHtml(log.action)}</td>
                <td>${targetDisplay}</td>
                <td style="color: var(--text-secondary); font-size: 0.9rem;">${escapeHtml(log.details)}</td>
            </tr>
            `;
        }).join('');
    }

    // --- Debug / Simulation ---

    const debugCheckBtn = document.getElementById('debugCheckBtn');
    const debugUserInput = document.getElementById('debugUserInput');
    const debugPermInput = document.getElementById('debugPermInput');
    const debugResultContainer = document.getElementById('debugResultContainer');

    if (debugCheckBtn) {
        debugCheckBtn.addEventListener('click', async () => {
            const user = (debugUserInput.value || '').trim();
            const perm = (debugPermInput.value || '').trim();
            if (!user || !perm) return;
            debugCheckBtn.disabled = true;
            debugCheckBtn.textContent = 'Checking…';
            try {
                const res = await fetch(`${state.apiUrl}/debug?user=${encodeURIComponent(user)}&permission=${encodeURIComponent(perm)}`);
                const data = await res.json();
                if (!res.ok) {
                    renderDebugError(data.error || `HTTP ${res.status}`);
                } else {
                    renderDebugResult(data);
                }
            } catch (err) {
                renderDebugError('Failed to reach server: ' + err.message);
            } finally {
                debugCheckBtn.disabled = false;
                debugCheckBtn.textContent = 'Check';
            }
        });

        // Allow pressing Enter in the permission input to trigger check
        debugPermInput && debugPermInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') debugCheckBtn.click();
        });
    }

    function renderDebugError(msg) {
        const escapeHtml = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        debugResultContainer.innerHTML = `<div class="card" style="border:1px solid var(--danger); padding:1rem; color:var(--danger);">${escapeHtml(msg)}</div>`;
    }

    function renderDebugResult(data) {
        const escapeHtml = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

        const resultColor = data.result === 'ALLOW' ? 'var(--success)'
                          : data.result === 'DENY'  ? 'var(--danger)'
                          : 'var(--text-secondary)';

        const actionBadge = (action) => {
            const colors = {
                MATCHED:         'var(--success)',
                DENY_MATCHED:    'var(--danger)',
                SKIPPED_EXPIRED: '#f59e0b',
                SKIPPED_CONTEXT: '#6366f1',
                UNDEFINED:       'var(--text-secondary)',
            };
            const c = colors[action] || 'var(--text-secondary)';
            return `<span style="font-size:0.75rem; font-weight:600; color:${c}; background:${c}22; padding:0.15rem 0.5rem; border-radius:4px;">${escapeHtml(action)}</span>`;
        };

        const stepsHtml = (data.steps || []).map(s => `
            <tr>
                <td style="color:var(--primary);">${escapeHtml(s.source)}</td>
                <td>${actionBadge(s.action)}</td>
                <td style="font-family:monospace;">${s.nodeKey ? escapeHtml(s.nodeKey) : '<span style="color:var(--text-secondary);">—</span>'}</td>
                <td>${s.nodeKey ? `<span style="color:${s.nodeValue ? 'var(--success)' : 'var(--danger)'};">${s.nodeValue ? 'true' : 'false'}</span>` : ''}</td>
                <td style="color:var(--text-secondary); font-size:0.85rem;">${escapeHtml(s.detail)}</td>
            </tr>`).join('');

        debugResultContainer.innerHTML = `
            <div class="card" style="margin-bottom:1rem; padding:1.25rem;">
                <div style="display:flex; gap:2rem; align-items:center; flex-wrap:wrap;">
                    <div>
                        <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.2rem;">Player</div>
                        <div style="font-weight:600; color:var(--text-primary);">${escapeHtml(data.user)}</div>
                    </div>
                    <div>
                        <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.2rem;">Permission</div>
                        <div style="font-family:monospace; color:var(--text-primary);">${escapeHtml(data.permission)}</div>
                    </div>
                    <div>
                        <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.2rem;">Result</div>
                        <div style="font-size:1.2rem; font-weight:700; color:${resultColor};">${escapeHtml(data.result)}</div>
                    </div>
                    ${data.origin ? `<div>
                        <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.2rem;">Origin</div>
                        <div style="color:var(--text-primary);">${escapeHtml(data.origin)}</div>
                    </div>` : ''}
                </div>
            </div>
            ${stepsHtml ? `
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr><th>Source</th><th>Action</th><th>Node</th><th>Value</th><th>Detail</th></tr>
                    </thead>
                    <tbody>${stepsHtml}</tbody>
                </table>
            </div>` : ''}
        `;
    }

    // --- DEBUG MODE ---
    const debugMode = true;

    function log(msg, ...args) {
        if (debugMode) console.log(`[NextNodes] ${msg}`, ...args);
    }

    // --- Users Logic ---
    const userSearchInput = document.getElementById('userSearchInput');
    const searchUserBtn = document.getElementById('searchUserBtn');
    const userInfoContainer = document.getElementById('userInfoContainer');
    const usersListContainer = document.getElementById('usersListContainer');
    
    // Función centralizada para buscar y abrir perfil
    async function performUserSearch(query) {
        log("Searching user:", query);
        if (!query) return;
        
        try {
            // Add timestamp to prevent caching
            const res = await fetch(`${state.apiUrl}/users/${encodeURIComponent(query)}?_=${Date.now()}`);
            if (res.ok) {
                const user = await res.json();
                log("User found:", user);
                state.currentProfileUuid = user.uuid; // Store UUID
                renderUser(user);
                openProfileView();
            } else {
                log("User not found");
                alert("User not found on server.");
            }
        } catch (e) {
            console.error("Search error:", e);
            // Si falla la conexión, ABRIMOS el perfil igual pero con mensaje de error
            // Esto confirma que el botón funciona, pero la red no.
            renderUserError(query, e.message);
            openProfileView();
        }
    }

    function openProfileView() {
        usersListContainer.classList.add('hidden');
        userInfoContainer.classList.remove('hidden');
        log("View switched to Profile");
    }

    function renderUserError(uuid, errorMsg) {
        document.getElementById('userNameDisplay').textContent = "Connection Error";
        document.getElementById('userUuidDisplay').textContent = uuid;
        document.getElementById('userHeadDisplay').src = 'https://minotar.net/helm/MHF_Steve/48.png';
        
        const errorHtml = `
            <li style="padding: 1rem; background: rgba(255,0,0,0.1); border: 1px solid var(--danger); border-radius: 4px; color: var(--danger);">
                <strong>Error de Conexión:</strong><br>
                ${errorMsg}<br><br>
                <small>Asegúrate de que el servidor está encendido (puerto 8081).</small>
            </li>`;
            
        document.getElementById('userGroupsList').innerHTML = errorHtml;
        document.getElementById('userPermsList').innerHTML = errorHtml;
    }

    async function loadUsersList() {
        try {
            const res = await fetch(`${state.apiUrl}/users`);
            if (res.ok) {
                const users = await res.json();
                
                // Filtrar duplicados por NOMBRE (priorizando el que esté ONLINE)
                const uniqueUsersMap = new Map();
                
                users.forEach(user => {
                    const existing = uniqueUsersMap.get(user.username);
                    if (!existing) {
                        // Si no existe, lo añadimos
                        uniqueUsersMap.set(user.username, user);
                    } else {
                        // Si ya existe, nos quedamos con el que esté ONLINE
                        if (user.online && !existing.online) {
                            uniqueUsersMap.set(user.username, user);
                        }
                        // Si ambos están offline u online, da igual cuál (o el que tenga UUID real si pudiéramos saberlo)
                    }
                });
                
                const uniqueUsers = Array.from(uniqueUsersMap.values());
                
                renderUsersList(uniqueUsers);
                document.getElementById('userCount').textContent = uniqueUsers.length;
            }
        } catch (e) {
            console.error("Error loading users list", e);
        }
    }
    
    function renderUsersList(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        // Ordenar: Online primero, luego alfabéticamente
        users.sort((a, b) => {
            if (a.online === b.online) return a.username.localeCompare(b.username);
            return a.online ? -1 : 1;
        });
        
        // Usar minotar.net en lugar de crafatar para mayor estabilidad si crafatar falla
        // O usar crafatar con fallback
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <img src="https://minotar.net/helm/${u.uuid}/24.png" alt="Head" style="width: 24px; height: 24px; border-radius: 2px; image-rendering: pixelated;" onerror="this.src='https://minotar.net/helm/MHF_Steve/24.png'"/>
                        <span style="font-weight: 500;">${u.username}</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${u.online ? 'status-online' : 'status-offline'}" style="font-size: 0.7rem;">
                        ${u.online ? 'Online' : 'Offline'}
                    </span>
                </td>
                <td style="font-family: monospace; font-size: 0.85rem; color: var(--text-secondary);">${u.uuid}</td>
                <td>
                    <button class="btn btn-outline manage-profile-btn" data-uuid="${u.uuid}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Manage Profile</button>
                </td>
            </tr>
        `).join('');
    }
    
    // Delegación de eventos en el padre (tbody) para evitar problemas de re-renderizado
    document.getElementById('usersTableBody').addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('manage-profile-btn')) {
            e.preventDefault();
            const uuid = e.target.getAttribute('data-uuid');
            console.log("Manage Profile Clicked for UUID:", uuid); // Debug
            performUserSearch(uuid);
        }
    });
    
    // Botón de cerrar perfil con listener explícito
    document.getElementById('closeProfileBtn').addEventListener('click', () => {
        userInfoContainer.classList.add('hidden');
        usersListContainer.classList.remove('hidden');
        userSearchInput.value = '';
    });
    
    // Fallback global por si se llama desde inline (aunque intentamos evitarlo)
    window.searchUserByUuid = async (uuid) => {
        userSearchInput.value = uuid;
        await performUserSearch(uuid);
    };

    searchUserBtn.addEventListener('click', async () => {
        const query = userSearchInput.value.trim();
        await performUserSearch(query);
    });

    function renderUser(user) {
        userInfoContainer.classList.remove('hidden');
        document.getElementById('userNameDisplay').textContent = user.username;
        document.getElementById('userUuidDisplay').textContent = user.uuid;
        // Usar Minotar también aquí
        document.getElementById('userHeadDisplay').src = `https://minotar.net/helm/${user.uuid}/48.png`;
        document.getElementById('userHeadDisplay').onerror = function() { this.src = 'https://minotar.net/helm/MHF_Steve/48.png'; };

        // Render Groups
        const groupsList = document.getElementById('userGroupsList');
        if (user.groups && user.groups.length > 0) {
            groupsList.innerHTML = user.groups.map(g => `
                <li style="padding: 0.5rem; background: var(--bg-dark); margin-bottom: 0.5rem; border-radius: 4px; display: flex; justify-content: space-between;">
                    <span>${g}</span>
                    <button class="btn btn-danger" style="padding: 0.1rem 0.4rem; font-size: 0.7rem;" onclick="removeUserGroup('${user.uuid}', '${g}')">X</button>
                </li>
            `).join('');
        } else {
            groupsList.innerHTML = '<li style="color: var(--text-secondary); font-size: 0.875rem;">No groups assigned</li>';
        }

        // Render Perms
        const permsList = document.getElementById('userPermsList');
        if (user.permissions && user.permissions.length > 0) {
            permsList.innerHTML = user.permissions.map(p => `
                <li style="padding: 0.5rem; background: var(--bg-dark); margin-bottom: 0.5rem; border-radius: 4px; display: flex; justify-content: space-between;">
                    <span style="color: ${p.value ? 'var(--success)' : 'var(--danger)'}">${p.key}</span>
                    <button class="btn btn-danger" style="padding: 0.1rem 0.4rem; font-size: 0.7rem;" onclick="removeUserPerm('${user.uuid}', '${p.key}', ${p.value})">X</button>
                </li>
            `).join('');
        } else {
            permsList.innerHTML = '<li style="color: var(--text-secondary); font-size: 0.875rem;">No direct permissions</li>';
        }

        // Render Meta (Prefix/Suffix)
        const metaList = document.getElementById('userMetaList');
        if (user.meta && user.meta.length > 0) {
            metaList.innerHTML = user.meta.map(m => `
                <li style="padding: 0.5rem; background: var(--bg-dark); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: bold; margin-right: 0.5rem;">${m.type}</span>
                        <span style="font-family: monospace; background: rgba(0,0,0,0.3); padding: 0.1rem 0.3rem; border-radius: 2px;">${formatMinecraftText(m.value)}</span>
                        <span style="font-size: 0.75rem; color: var(--text-secondary); margin-left: 0.5rem;">(P: ${m.priority})</span>
                    </div>
                    <button class="btn btn-danger" style="padding: 0.1rem 0.4rem; font-size: 0.7rem;" onclick="removeUserMeta('${user.uuid}', '${m.type}', '${m.priority}', '${encodeURIComponent(m.value)}')">X</button>
                </li>
            `).join('');
        } else {
            metaList.innerHTML = '<li style="color: var(--text-secondary); font-size: 0.875rem;">No metadata assigned</li>';
        }
    }

    // --- Meta & Preview Logic ---
    const metaModal = document.getElementById('metaModal');
    const metaContentInput = document.getElementById('metaContentInput');
    const metaTypeInput = document.getElementById('metaTypeInput');
    const metaPreview = document.getElementById('metaPreview');

    // Tabs Logic
    const tabSimpleBtn = document.getElementById('tabSimpleBtn');
    const tabGradientBtn = document.getElementById('tabGradientBtn');
    const toolSimple = document.getElementById('toolSimple');
    const toolGradient = document.getElementById('toolGradient');

    tabSimpleBtn.addEventListener('click', () => {
        toolSimple.classList.remove('hidden');
        toolGradient.classList.add('hidden');
        tabSimpleBtn.style.background = 'var(--bg-card)';
        tabGradientBtn.style.background = 'transparent';
    });

    tabGradientBtn.addEventListener('click', () => {
        toolSimple.classList.add('hidden');
        toolGradient.classList.remove('hidden');
        tabGradientBtn.style.background = 'var(--bg-card)';
        tabSimpleBtn.style.background = 'transparent';
    });

    // Color/Format Buttons Logic
    document.querySelectorAll('.color-btn, .format-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const code = btn.getAttribute('data-code');
            insertAtCursor(metaContentInput, code);
            updatePreview();
        });
    });

    // Multi-Stop Gradient Logic
    const gradStopsContainer = document.getElementById('gradStopsContainer');
    const addGradStopBtn = document.getElementById('addGradStopBtn');
    const gradBoldBtn = document.getElementById('gradBoldBtn');
    let isGradBold = false;

    gradBoldBtn.addEventListener('click', () => {
        isGradBold = !isGradBold;
        gradBoldBtn.classList.toggle('active', isGradBold);
    });

    function createColorStop(hex) {
        const div = document.createElement('div');
        div.className = 'grad-stop';
        div.innerHTML = `
            <div class="grad-stop-preview" style="background-color: ${hex};"></div>
            <input type="color" value="${hex}">
            <span class="grad-stop-remove">&times;</span>
        `;
        
        const input = div.querySelector('input');
        const preview = div.querySelector('.grad-stop-preview');
        input.addEventListener('input', () => {
            preview.style.backgroundColor = input.value;
        });

        div.querySelector('.grad-stop-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            div.remove();
        });

        return div;
    }

    // Initialize with 2 colors
    gradStopsContainer.insertBefore(createColorStop('#55FFFF'), addGradStopBtn);
    gradStopsContainer.insertBefore(createColorStop('#AA00AA'), addGradStopBtn);

    addGradStopBtn.addEventListener('click', () => {
        const currentStops = gradStopsContainer.querySelectorAll('.grad-stop');
        if (currentStops.length >= 4) {
            addGradStopBtn.style.borderColor = 'var(--danger)';
            setTimeout(() => addGradStopBtn.style.borderColor = '', 500);
            return;
        }
        gradStopsContainer.insertBefore(createColorStop('#FFFFFF'), addGradStopBtn);
    });

    document.getElementById('applyGradBtn').addEventListener('click', () => {
        const text = document.getElementById('gradText').value;
        if (!text) return;
        
        const inputs = gradStopsContainer.querySelectorAll('input[type="color"]');
        const colors = Array.from(inputs).map(input => input.value);
        
        const gradientCode = generateMultiGradient(text, colors, isGradBold);
        insertAtCursor(metaContentInput, gradientCode);
        updatePreview();
    });

    function generateMultiGradient(text, colors, bold) {
        if (colors.length < 2) return text;
        
        let result = "";
        const len = text.length;
        if (len <= 1) return `&#${colors[0].substring(1).toUpperCase()}${bold ? '&l' : ''}${text}`;

        const segmentLength = (len - 1) / (colors.length - 1);
        
        for (let i = 0; i < len; i++) {
            const segmentIndex = Math.min(Math.floor(i / segmentLength), colors.length - 2);
            const segmentStart = segmentIndex * segmentLength;
            const ratio = (i - segmentStart) / segmentLength;
            
            const startHex = colors[segmentIndex];
            const endHex = colors[segmentIndex + 1];
            
            const r1 = parseInt(startHex.substring(1,3), 16);
            const g1 = parseInt(startHex.substring(3,5), 16);
            const b1 = parseInt(startHex.substring(5,7), 16);
            
            const r2 = parseInt(endHex.substring(1,3), 16);
            const g2 = parseInt(endHex.substring(3,5), 16);
            const b2 = parseInt(endHex.substring(5,7), 16);
            
            const r = Math.round(r1 + (r2 - r1) * ratio);
            const g = Math.round(g1 + (g2 - g1) * ratio);
            const b = Math.round(b1 + (b2 - b1) * ratio);
            
            const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            
            result += `&#${hex.toUpperCase()}`;
            if (bold) result += "&l";
            result += text[i];
        }
        return result;
    }

    function insertAtCursor(input, text) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const val = input.value;
        input.value = val.substring(0, start) + text + val.substring(end);
        input.selectionStart = input.selectionEnd = start + text.length;
        input.focus();
    }

    document.getElementById('addMetaBtn').addEventListener('click', () => {
        metaModal.classList.remove('hidden');
        metaModal.style.display = 'flex'; // Force flex
        metaContentInput.value = '';
        metaContentInput.focus();
        updatePreview();
    });

    document.getElementById('cancelMetaBtn').addEventListener('click', () => {
        metaModal.classList.add('hidden');
        metaModal.style.display = 'none';
    });

    document.getElementById('saveMetaBtn').addEventListener('click', async () => {
        const uuid = document.getElementById('userUuidDisplay').textContent;
        const type = metaTypeInput.value;
        const priority = document.getElementById('metaPriorityInput').value;
        const content = metaContentInput.value;

        if (!content) return;

        try {
            // We use the same 'nodes' endpoint. For PREFIX/SUFFIX, key=priority, value=content
            const res = await fetch(`${state.apiUrl}/users/${uuid}/nodes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: type, key: priority, value: content })
            });
            if (res.ok) {
                metaModal.classList.add('hidden');
                metaModal.style.display = 'none';
                if (state.currentProfileUuid) performUserSearch(state.currentProfileUuid);
                fetchAuditLogs();
            } else {
                alert("Failed to add metadata");
            }
        } catch (e) { alert(e.message); }
    });

    metaContentInput.addEventListener('input', updatePreview);
    metaTypeInput.addEventListener('change', updatePreview);

    function updatePreview() {
        const raw = metaContentInput.value || '';
        const type = metaTypeInput.value;
        const formatted = formatMinecraftText(raw);
        
        if (type === 'PREFIX') {
            metaPreview.innerHTML = `${formatted} <span style='color: white;'>Name</span>`;
        } else {
            metaPreview.innerHTML = `<span style='color: white;'>Name</span> ${formatted}`;
        }
    }

    function formatMinecraftText(text) {
        if (!text) return '';
        const colorMap = {
            '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
            '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
            '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
            'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF'
        };
        
        let html = '';
        let currentColor = '#FFFFFF';
        let isBold = false;
        let isItalic = false;
        let isUnderline = false;
        
        let i = 0;
        while (i < text.length) {
            // Check for Hex color: &#RRGGBB
            if (text[i] === '&' && text[i+1] === '#') {
                if (i + 7 < text.length) {
                    const hex = text.substring(i + 2, i + 8);
                    // Validate hex
                    if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
                        currentColor = '#' + hex;
                        isBold = false; isItalic = false; isUnderline = false;
                        i += 8;
                        continue;
                    }
                }
            }

            // Check for Legacy code: &c
            if (text[i] === '&') {
                if (i + 1 < text.length) {
                    const code = text[i+1].toLowerCase();
                    if (colorMap[code]) {
                        currentColor = colorMap[code];
                        isBold = false; isItalic = false; isUnderline = false;
                        i += 2;
                        continue;
                    } else if (code === 'l') { isBold = true; i += 2; continue; }
                    else if (code === 'o') { isItalic = true; i += 2; continue; }
                    else if (code === 'n') { isUnderline = true; i += 2; continue; }
                    else if (code === 'r') { 
                        currentColor = '#FFFFFF'; 
                        isBold = false; isItalic = false; isUnderline = false; 
                        i += 2; 
                        continue; 
                    }
                }
            }
            
            // Render char
            let style = `color: ${currentColor};`;
            if (isBold) style += 'font-weight: bold;';
            if (isItalic) style += 'font-style: italic;';
            if (isUnderline) style += 'text-decoration: underline;';
            
            html += `<span style="${style}">${text[i]}</span>`;
            i++;
        }
        
        return html;
    }

    // Expose User Actions
    window.removeUserMeta = async (uuid, type, priority, encodedValue) => {
        const value = decodeURIComponent(encodedValue);
        if (!confirm(`Remove this ${type}?`)) return;
        try {
            const res = await fetch(`${state.apiUrl}/users/${uuid}/nodes`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: type, key: priority, value: value })
            });
            if (res.ok) {
                if (state.currentProfileUuid) performUserSearch(state.currentProfileUuid);
                fetchAuditLogs();
            } else {
                alert("Failed to remove metadata");
            }
        } catch (e) { alert(e.message); }
    };

    // Expose User Actions
    window.removeUserGroup = async (uuid, group) => {
        if (!confirm(`Remove group ${group} from user?`)) return;
        try {
            const res = await fetch(`${state.apiUrl}/users/${uuid}/nodes`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'INHERITANCE', key: group })
            });
            if (res.ok) {
                if (state.currentProfileUuid) performUserSearch(state.currentProfileUuid);
                fetchAuditLogs();
            } else {
                alert("Failed to remove group");
            }
        } catch (e) { alert(e.message); }
    };
    
    window.removeUserPerm = async (uuid, perm, value) => {
        if (!confirm(`Remove permission ${perm} from user?`)) return;
        try {
            const res = await fetch(`${state.apiUrl}/users/${uuid}/nodes`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'PERMISSION', key: perm, value: value })
            });
            if (res.ok) {
                if (state.currentProfileUuid) performUserSearch(state.currentProfileUuid);
                fetchAuditLogs();
            } else {
                alert("Failed to remove permission");
            }
        } catch (e) { alert(e.message); }
    };

    document.getElementById('addUserGroupBtn').addEventListener('click', async () => {
        const uuid = document.getElementById('userUuidDisplay').textContent;
        // Use custom modal or prompt. For autocomplete, prompt is not enough.
        // For now we keep prompt but ensure refresh works.
        const group = prompt("Enter group name to inherit:");
        if (!group) return;
        
        try {
            const res = await fetch(`${state.apiUrl}/users/${uuid}/nodes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'INHERITANCE', key: group })
            });
            if (res.ok) {
                if (state.currentProfileUuid) performUserSearch(state.currentProfileUuid);
                fetchAuditLogs();
            } else {
                alert("Failed to add group");
            }
        } catch (e) { alert(e.message); }
    });

    document.getElementById('addUserPermBtn').addEventListener('click', async () => {
        const uuid = document.getElementById('userUuidDisplay').textContent;
        const perm = prompt("Enter permission node (e.g. nextnodes.admin):");
        if (!perm) return;
        
        const value = confirm("Should this permission be TRUE (Allow)?\nClick OK for Allow, Cancel for Deny.");
        
        try {
            const res = await fetch(`${state.apiUrl}/users/${uuid}/nodes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'PERMISSION', key: perm, value: value })
            });
            if (res.ok) {
                if (state.currentProfileUuid) performUserSearch(state.currentProfileUuid);
                fetchAuditLogs();
            } else {
                alert("Failed to add permission");
            }
        } catch (e) { alert(e.message); }
    });

    function mockData() {
        document.getElementById('userCount').textContent = '12';
        document.getElementById('groupCount').textContent = '4';
        document.getElementById('uptime').textContent = 'Online';
        
        const groups = [
            { name: 'admin', weight: 100, prefix: '&c[Admin] ' },
            { name: 'mod', weight: 80, prefix: '&6[Mod] ' },
            { name: 'vip', weight: 50, prefix: '&e[VIP] ' },
            { name: 'default', weight: 0, prefix: '&7' }
        ];
        
        const tbody = document.getElementById('groupsTableBody');
        if (tbody) {
            tbody.innerHTML = groups.map(g => `
                <tr>
                    <td>${g.name}</td>
                    <td>${g.weight}</td>
                    <td>${g.prefix}</td>
                    <td>
                        <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem">Edit</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    // Init
    checkServerStatus();

    // Footer Modals
    const privacyLink = document.getElementById('privacyLink');
    const termsLink = document.getElementById('termsLink');
    const privacyModal = document.getElementById('privacyModal');
    const termsModal = document.getElementById('termsModal');
    const closePrivacyBtn = document.getElementById('closePrivacyBtn');
    const closeTermsBtn = document.getElementById('closeTermsBtn');

    // Privacy Policy
    privacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        privacyModal.classList.remove('hidden');
    });

    closePrivacyBtn.addEventListener('click', () => {
        privacyModal.classList.add('hidden');
    });

    privacyModal.addEventListener('click', (e) => {
        if (e.target === privacyModal) {
            privacyModal.classList.add('hidden');
        }
    });

    // Terms & Conditions
    termsLink.addEventListener('click', (e) => {
        e.preventDefault();
        termsModal.classList.remove('hidden');
    });

    closeTermsBtn.addEventListener('click', () => {
        termsModal.classList.add('hidden');
    });

    termsModal.addEventListener('click', (e) => {
        if (e.target === termsModal) {
            termsModal.classList.add('hidden');
        }
    });
});
