// Funciones auxiliares para la interfaz de autenticación

/**
 * MOSTRAR / OCULTAR LOADING
 * Desactiva botón, añade animación de carga
 */
function showLoading(formSelector, show = true, loadingText = 'Cargando...') {
  const form = document.querySelector(formSelector);
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  if (!button) return;

  if (show) {
    button.disabled = true;
    button.classList.add('loading');
    
    // Guardar texto original
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }
    
    button.textContent = loadingText;
    button.style.opacity = '0.7';
  } else {
    button.disabled = false;
    button.classList.remove('loading');
    button.textContent = button.dataset.originalText || 'Enviar';
    button.style.opacity = '1';
  }
}

/**
 * MOSTRAR MENSAJE
 * Displays success, error, warning, o info messages
 */
function showMessage(containerId, type = 'info', message = '') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container ${containerId} no encontrado`);
    return;
  }

  // Limpiar mensajes anteriores
  container.innerHTML = '';

  if (!message) return;

  // Crear elemento de mensaje
  const messageEl = document.createElement('div');
  messageEl.className = `auth-message ${type}`;
  messageEl.setAttribute('role', 'alert');

  // Añadir icono según tipo
  let icon = '';
  switch (type) {
    case 'success':
      icon = '✅';
      break;
    case 'error':
      icon = '❌';
      break;
    case 'warning':
      icon = '⚠️';
      break;
    case 'info':
      icon = 'ℹ️';
      break;
  }

  messageEl.innerHTML = `
    <span class="message-icon">${icon}</span>
    <span class="message-text">${escapeHtml(message)}</span>
  `;

  container.appendChild(messageEl);

  // Auto-limpiar en 5 segundos si no es error
  if (type !== 'error') {
    setTimeout(() => {
      if (container.contains(messageEl)) {
        messageEl.style.opacity = '0';
        messageEl.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          if (container.contains(messageEl)) {
            container.removeChild(messageEl);
          }
        }, 300);
      }
    }, 5000);
  }
}

/**
 * LIMPIAR MENSAJE
 * Elimina todos los mensajes del container
 */
function clearMessage(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
}

/**
 * ESCAPAR HTML
 * Previene XSS sanitizando el contenido
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * VALIDAR VISUALEMENTE UN INPUT
 * Añade clases de validación al input
 */
function validateInputVisually(inputSelector, isValid = true) {
  const input = document.querySelector(inputSelector);
  if (!input) return;

  if (isValid) {
    input.classList.add('is-valid');
    input.classList.remove('is-invalid');
  } else {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
  }
}

/**
 * RESETEAR VALIDACIÓN VISUAL
 */
function resetInputValidation(inputSelector) {
  const input = document.querySelector(inputSelector);
  if (input) {
    input.classList.remove('is-valid', 'is-invalid');
  }
}

/**
 * DESHABILITITAR INPUT
 */
function disableInput(inputSelector, disabled = true) {
  const input = document.querySelector(inputSelector);
  if (input) {
    input.disabled = disabled;
  }
}

/**
 * FOCUS EN INPUT
 */
function focusInput(inputSelector) {
  const input = document.querySelector(inputSelector);
  if (input) {
    setTimeout(() => input.focus(), 100);
  }
}

/**
 * OBTENER VALOR DE INPUT
 */
function getInputValue(inputSelector) {
  const input = document.querySelector(inputSelector);
  return input ? input.value.trim() : '';
}

/**
 * ESTABLECER VALOR EN INPUT
 */
function setInputValue(inputSelector, value) {
  const input = document.querySelector(inputSelector);
  if (input) {
    input.value = value;
  }
}

/**
 * LIMPIAR FORMULARIO
 */
function clearForm(formSelector) {
  const form = document.querySelector(formSelector);
  if (form) {
    form.reset();
    // Limpiar validaciones visuales
    form.querySelectorAll('input').forEach(input => {
      input.classList.remove('is-valid', 'is-invalid');
    });
  }
}

/**
 * COPY TO CLIPBOARD
 */
function copyToClipboard(text, messageContainerId = null) {
  navigator.clipboard.writeText(text)
    .then(() => {
      if (messageContainerId) {
        showMessage(messageContainerId, 'success', 'Copiado al portapapeles');
      }
    })
    .catch(err => {
      console.error('Error copiando:', err);
      if (messageContainerId) {
        showMessage(messageContainerId, 'error', 'Error copiando al portapapeles');
      }
    });
}

/**
 * OBTENER CLIENT IP (Estimado)
 * Intenta obtener la IP del cliente via API pública
 */
async function getClientIp() {
  try {
    const response = await fetch('https://api.ipify.org?format=json', { 
      timeout: 5000 
    });
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.warn('No se pudo obtener IP:', error);
    return 'unknown';
  }
}

/**
 * FORMATEAR FECHA
 */
function formatDate(date, format = 'es') {
  const dateObj = new Date(date);
  
  if (format === 'es') {
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return dateObj.toISOString();
}

/**
 * CALCULAR TIEMPO RESTANTE HASTA EXPIRACIÓN
 */
function getTimeUntilExpiry(expiryDate) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry - now;

  if (diff <= 0) return 'Expirado';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * ANIMAR ELEMENTO
 */
function animateElement(selector, animationClass = 'fade-in', duration = 300) {
  const element = document.querySelector(selector);
  if (!element) return;

  element.style.animation = `${animationClass} ${duration}ms ease-in-out`;
}

/**
 * MOSTRAR/OCULTAR ELEMENTO
 */
function toggleElementVisibility(selector, show = true) {
  const element = document.querySelector(selector);
  if (!element) return;

  if (show) {
    element.style.display = 'block';
    setTimeout(() => element.classList.add('visible'), 10);
  } else {
    element.classList.remove('visible');
    setTimeout(() => element.style.display = 'none', 300);
  }
}

/**
 * CREAR NOTIFICACIÓN TOAST
 * Notificación flotante temporal
 */
function showToast(message, duration = 3000, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${
      type === 'success' ? '#22c55e' :
      type === 'error' ? '#ef4444' :
      type === 'warning' ? '#f97316' :
      '#3b82f6'
    };
    color: white;
    border-radius: 8px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * VERIFICAR SI EL USUARIO ESTÁ AUTENTICADO
 */
function isUserAuthenticated() {
  const session = localStorage.getItem(CONFIG.SESSION_KEY);
  if (!session) return false;

  try {
    const sessionData = JSON.parse(session);
    const expiryDate = new Date(sessionData.expires_at);
    return expiryDate > new Date();
  } catch (error) {
    return false;
  }
}

/**
 * REDIRIGIR SI NO ESTÁ AUTENTICADO
 */
function requireAuth() {
  if (!isUserAuthenticated()) {
    localStorage.removeItem(CONFIG.SESSION_KEY);
    navigate('login-view');
    return false;
  }
  return true;
}

/**
 * LOG PARA DEBUG
 */
function debugLog(label, data) {
  // Usar una variable global en lugar de process.env (no disponible en navegador)
  if (window.__DEBUG__ || (typeof CONFIG !== 'undefined' && CONFIG.DEBUG)) {
    console.log(`[${label}]`, data);
  }
}

/**
 * VALIDAR CONTRASEÑA LOCALMENTE (Quick check)
 */
function quickPasswordValidation(password) {
  const result = AuthValidation.validatePasswordStrength(password);
  return {
    isValid: result.valid,
    score: result.score,
    feedback: result.feedback,
    strength: CONFIG.PASSWORD_STRENGTH[
      result.score <= 1 ? 'WEAK' :
      result.score <= 2 ? 'FAIR' :
      result.score <= 3 ? 'GOOD' :
      result.score <= 4 ? 'STRONG' :
      'VERY_STRONG'
    ]
  };
}

/**
 * VALIDAR EMAIL LOCALMENTE (Quick check)
 */
function quickEmailValidation(email) {
  const isFormatValid = CONFIG.EMAIL_REGEX.test(email);
  const isValid = AuthValidation.validateEmail(email);
  return {
    isFormatValid,
    isValid: isFormatValid && isValid
  };
}

// Estilos CSS para animaciones (inyectados dinámicamente)
const animationStyles = document.createElement('style');
animationStyles.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .is-valid {
    border-color: #22c55e !important;
    background-color: rgba(34, 197, 94, 0.05) !important;
  }

  .is-invalid {
    border-color: #ef4444 !important;
    background-color: rgba(239, 68, 68, 0.05) !important;
  }

  .loading {
    position: relative;
  }

  .loading::after {
    content: '';
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: translateY(-50%) rotate(360deg); }
  }
`;
document.head.appendChild(animationStyles);

console.log('Helpers functions cargadas');
