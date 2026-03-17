// Funciones auxiliares para la UI de autenticación

/**
 * Navegar entre vistas de autenticación
 * Función global accesible desde HTML onclick
 * @param {string} viewName - Nombre de la vista (con prefijo auth- o sin él)
 */
function goToAuthView(viewName) {
  const fullViewName = viewName.startsWith('auth-') ? viewName : `auth-${viewName}`;
  const viewId = `${fullViewName}-view`;
  
  const authContainer = document.getElementById('auth-container');
  if (!authContainer) return;
  
  authContainer.style.display = 'block';
  
  const authSections = authContainer.querySelectorAll('section.view');
  
  authSections.forEach(section => {
    section.classList.remove('active');
    section.classList.add('hidden');
  });
  
  const targetSection = document.getElementById(viewId);
  if (targetSection) {
    targetSection.classList.remove('hidden');
    targetSection.classList.add('active');
  }
}

/**
 * Cambiar entre vistas de autenticación (función alternativa)
 * @param {string} viewName - Nombre de la vista (sin sufijo -view)
 */
function switchAuthView(viewName) {
  const authContainer = document.getElementById('auth-container');
  if (!authContainer) return;
  
  authContainer.style.display = 'block';
  const viewId = `auth-${viewName}-view`;
  const authSections = authContainer.querySelectorAll('section.view');
  
  authSections.forEach(section => {
    section.classList.remove('active');
    section.classList.add('hidden');
  });
  
  const targetSection = document.getElementById(viewId);
  if (targetSection) {
    targetSection.classList.remove('hidden');
    targetSection.classList.add('active');
  }
}

/**
 * Actualizar indicador de fuerza de contraseña
 * @param {string} password - La contraseña a evaluar
 */
function updatePasswordStrength(password) {
  // Detectar qué campo de contraseña estamos actualizando
  const signupPwd = document.getElementById('signup-password');
  const resetPwd = document.getElementById('reset-password');
  
  let strengthContainer, strengthBar, strengthLabel, strengthPercentage, strengthFeedback;
  
  if (signupPwd && signupPwd === document.activeElement) {
    // Estamos en el formulario de signup
    strengthContainer = document.getElementById('password-strength');
    strengthBar = document.getElementById('strength-fill');
    strengthLabel = document.getElementById('strength-label');
    strengthPercentage = document.getElementById('strength-percentage');
    strengthFeedback = document.getElementById('strength-feedback');
  } else if (resetPwd && resetPwd === document.activeElement) {
    // Estamos en el formulario de reset
    strengthContainer = document.getElementById('reset-password-strength');
    strengthBar = document.getElementById('reset-strength-fill');
    strengthLabel = document.getElementById('reset-strength-label');
    strengthPercentage = document.getElementById('reset-strength-percentage');
    strengthFeedback = document.getElementById('reset-strength-feedback');
  }
  
  if (!strengthContainer) return;
  
  // Calcular fuerza de contraseña
  let strength = 0;
  let feedback = [];
  
  if (password.length >= 8) strength += 25;
  else feedback.push('Mínimo 8 caracteres');
  
  if (/[a-z]/.test(password)) strength += 25;
  else feedback.push('Incluye letras minúsculas');
  
  if (/[A-Z]/.test(password)) strength += 25;
  else feedback.push('Incluye letras mayúsculas');
  
  if (/[0-9]/.test(password)) strength += 12.5;
  else feedback.push('Incluye números');
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 12.5;
  else feedback.push('Incluye caracteres especiales');
  
  // Mostrar contenedor si hay contraseña
  if (password.length > 0) {
    strengthContainer.style.display = 'block';
  } else {
    strengthContainer.style.display = 'none';
    return;
  }
  
  // Actualizar barra de fortaleza
  if (strengthBar) {
    strengthBar.style.width = strength + '%';
  }
  
  // Actualizar etiqueta y color
  let strengthText, strengthColor;
  if (strength < 25) {
    strengthText = 'Muy Débil';
    strengthColor = '#ef4444'; // red
  } else if (strength < 50) {
    strengthText = 'Débil';
    strengthColor = '#f97316'; // orange
  } else if (strength < 75) {
    strengthText = 'Media';
    strengthColor = '#eab308'; // yellow
  } else if (strength < 100) {
    strengthText = 'Fuerte';
    strengthColor = '#84cc16'; // lime
  } else {
    strengthText = 'Muy Fuerte';
    strengthColor = '#22c55e'; // green
  }
  
  if (strengthLabel) {
    strengthLabel.textContent = strengthText;
    strengthLabel.style.color = strengthColor;
  }
  
  if (strengthBar) {
    strengthBar.style.backgroundColor = strengthColor;
  }
  
  if (strengthPercentage) {
    strengthPercentage.textContent = Math.min(100, Math.round(strength)) + '%';
  }
  
  if (strengthFeedback) {
    strengthFeedback.innerHTML = feedback.length > 0 
      ? '<small>' + feedback.join(', ') + '</small>'
      : '<small style="color: var(--success);">✓ Contraseña fuerte</small>';
  }
}

/**
 * Abrir una modal
 * @param {string} modalId - ID de la modal a abrir
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
  }
}

/**
 * Cerrar una modal
 * @param {string} modalId - ID de la modal a cerrar
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Inicializar cierres de modales cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  // Cerrar Privacy modal
  const closePrivacyBtn = document.getElementById('closePrivacyBtn');
  if (closePrivacyBtn) {
    closePrivacyBtn.addEventListener('click', () => closeModal('privacyModal'));
  }
  
  // Cerrar Terms modal
  const closeTermsBtn = document.getElementById('closeTermsBtn');
  if (closeTermsBtn) {
    closeTermsBtn.addEventListener('click', () => closeModal('termsModal'));
  }
  
  // Cerrar modales al hacer click fuera de ellas
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.add('hidden');
    }
  });
});
