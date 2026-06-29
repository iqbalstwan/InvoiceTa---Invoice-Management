export const showToast = (message, type = 'success') => {
  let toastEl = document.getElementById('toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'toast';
    document.body.appendChild(toastEl);
  }
  
  toastEl.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      ${type === 'error' 
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' 
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
      }
      <span>${message}</span>
    </div>
  `;

  if (type === 'error') {
    toastEl.style.background = 'var(--error)';
    toastEl.style.color = '#fff';
  } else {
    toastEl.style.background = 'var(--gradient-warm)';
    toastEl.style.color = '#fff';
  }
  
  toastEl.style.opacity = '1';
  
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toastEl.style.opacity = '0';
  }, 3000);
};
