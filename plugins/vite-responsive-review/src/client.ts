// Remove all type annotations so this is valid JS
export const initResponsiveUI = (devices) => {
  if (window.location.search.includes('is-responsive-view=true')) return;

  let isOpen = false;
  const btn = document.createElement('button');
  btn.innerHTML = '📱 View Layouts';

  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '1000000',
    padding: '12px 20px',
    backgroundColor: '#646cff',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    transition: 'all 0.2s ease',
  });

  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#121212',
    zIndex: '999999',
    display: 'none',
    overflowY: 'auto',
    padding: '60px 20px',
    boxSizing: 'border-box',
  });

  const grid = document.createElement('div');
  Object.assign(grid.style, {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '50px',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '100%',
  });

  devices.forEach((dev) => {
    const wrapper = document.createElement('div');
    wrapper.style.textAlign = 'center';
    const label = document.createElement('div');
    label.innerText = `${dev.label} (${dev.width}x${dev.height})`;
    Object.assign(label.style, {
      color: '#888',
      marginBottom: '10px',
      fontSize: '12px',
      fontFamily: 'monospace',
    });

    const iframe = document.createElement('iframe');
    const url = new URL(window.location.href);
    url.searchParams.set('is-responsive-view', 'true');
    iframe.src = url.toString();
    iframe.width = `${dev.width}px`;
    iframe.height = `${dev.height}px`;
    Object.assign(iframe.style, {
      border: '1px solid #333',
      backgroundColor: 'white',
      borderRadius: '8px',
    });

    wrapper.append(label, iframe);
    grid.appendChild(wrapper);
  });

  overlay.appendChild(grid);
  document.body.append(btn, overlay);

  btn.onclick = () => {
    isOpen = !isOpen;
    overlay.style.display = isOpen ? 'block' : 'none';
    btn.innerHTML = isOpen ? '✕ Close Review' : '📱 View Layouts';
    btn.style.backgroundColor = isOpen ? '#f44336' : '#646cff';
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };
};
