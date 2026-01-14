// Enable clipboard on text inputs and textareas
document.addEventListener('copy', (e) => e.stopImmediatePropagation(), true);
document.addEventListener('cut', (e) => e.stopImmediatePropagation(), true);
document.addEventListener('paste', (e) => e.stopImmediatePropagation(), true);

// Allow text selection
document.querySelectorAll('*').forEach(el => {
  el.style.userSelect = 'text';
  el.style.webkitUserSelect = 'text';
  el.style.MozUserSelect = 'text';
});

// Re-enable all input and textarea elements
document.querySelectorAll('input, textarea').forEach(el => {
  el.onpaste = null;
  el.oncopy = null;
  el.oncut = null;
  el.style.userSelect = 'text';
  el.style.webkitUserSelect = 'text';
});

// Remove any oncontextmenu restrictions
document.oncontextmenu = null;
document.querySelectorAll('*').forEach(el => {
  el.oncontextmenu = null;
});

console.log('Clipboard enabled!');