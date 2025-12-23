/**
 * vite-responsive-review: Client UI Script (Full Updated Version)
 * Handles the responsive overlay, shell rendering, and browser simulation.
 */
export const initResponsiveUI = (devices, groupOffsets) => {
  // 1. Prevent recursion: don't load the UI inside its own iframes
  if (window.location.search.includes('is-responsive-view=true')) return;

  // --- STATE ---
  const orientationState = {};
  devices.forEach((d) => (orientationState[d.id] = 'portrait'));

  let state = {
    isOpen: false,
    showToolbar: true,
    showTaskbar: false,
    showSideLeft: false,
    showSideRight: false,
    autoScale: true,
    activeGroups: new Set([...new Set(devices.flatMap((d) => d.groups))]),
  };

  // --- UI ELEMENTS ---
  const btn = document.createElement('button');
  const overlay = document.createElement('div');
  const filterBar = document.createElement('div');
  const grid = document.createElement('div');

  // --- CSS INJECTION ---
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    .rr-overlay { position: fixed; inset: 0; background: #0a0a0a; z-index: 9999998; display: none; overflow-y: auto; padding: 120px 40px 40px; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; scroll-behavior: smooth; }
    .rr-filter-bar { position: fixed; top: 0; left: 0; width: 100%; padding: 15px; background: #141414; border-bottom: 1px solid #333; display: flex; gap: 20px; justify-content: center; align-items: center; z-index: 9999999; flex-wrap: wrap; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    .rr-grid { display: flex; flex-wrap: wrap; gap: 60px; justify-content: center; align-items: flex-start; }
    
    .rr-zoom-container { position: relative; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    
    .rr-shell { 
      display: flex; flex-direction: column; background: #000; 
      border: 1px solid #444; border-radius: 12px; overflow: hidden; 
      transform-origin: top left; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      transition: width 0.3s, height 0.3s;
    }

    /* Browser UI Components */
    .rr-toolbar { background: #2b2b2b; border-bottom: 1px solid #3d3d3d; display: flex; align-items: center; padding: 0 15px; gap: 15px; flex-shrink: 0; overflow: hidden; }
    .rr-traffic { display: flex; gap: 6px; }
    .rr-dot { width: 10px; height: 10px; border-radius: 50%; }
    .rr-url-bar { flex: 1; background: #1e1e1e; height: 26px; border-radius: 6px; border: 1px solid #444; font-size: 11px; display: flex; align-items: center; padding-left: 12px; color: #888; font-family: monospace; }

    .rr-body-wrapper { display: flex; flex: 1; overflow: hidden; background: #fff; position: relative; }
    
    .rr-sidenav { background: #1c1c1c; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding: 15px 0; justify-content: space-between; overflow: hidden; }
    .rr-sidenav-left { border-right: 1px solid #333; }
    .rr-sidenav-right { border-left: 1px solid #333; }
    .rr-side-icons { display: flex; flex-direction: column; gap: 15px; align-items: center; }
    .rr-side-icon { width: 30px; height: 30px; border-radius: 8px; background: #333; }

    .rr-iframe { border: none; flex: 1; width: 100%; height: 100%; }

    .rr-taskbar { background: rgba(30, 30, 30, 0.9); backdrop-filter: blur(10px); border-top: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .rr-win-icon { width: 22px; height: 22px; background: #0078d4; border-radius: 3px; display: grid; grid-template-columns: 1fr 1fr; gap: 2px; padding: 4px; box-sizing: border-box; }
    .rr-win-square { background: white; opacity: 0.9; }

    /* Controls UI */
    .rr-toggle-btn { position: fixed; bottom: 20px; right: 20px; z-index: 10000000; padding: 12px 20px; background: #646cff; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: 0.2s; }
    .rr-toggle-btn:hover { transform: translateY(-2px); background: #7c83ff; }

    .hidden { display: none !important; }
  `;
  document.head.appendChild(styleTag);

  // --- HELPERS ---

  /**
   * Tiered Offset Logic:
   * 1. Individual Device Offset
   * 2. Group Default Offset
   * 3. 'Other' Fallback
   */
  const getOffset = (dev, key) => {
    // 1. Check individual device overrides
    if (dev.offsets && typeof dev.offsets[key] !== 'undefined') {
      return dev.offsets[key];
    }

    // 2. Check group defaults
    const groupName = dev.groups.find((g) => groupOffsets[g]) || 'Other';
    const set = groupOffsets[groupName] || groupOffsets['Other'] || {};

    return typeof set[key] !== 'undefined' ? set[key] : 0;
  };

  const updateAllShells = () => {
    document.querySelectorAll('.rr-shell').forEach((shell) => {
      const dev = devices.find((d) => d.id === shell.dataset.id);
      shell.querySelector('.rr-toolbar').classList.toggle('hidden', !state.showToolbar);
      shell.querySelector('.rr-taskbar').classList.toggle('hidden', !state.showTaskbar);
      shell.querySelector('.rr-sidenav-left').classList.toggle('hidden', !state.showSideLeft);
      shell.querySelector('.rr-sidenav-right').classList.toggle('hidden', !state.showSideRight);
    });
  };

  const render = () => {
    grid.innerHTML = '';
    const maxAvailableW = window.innerWidth - 100;

    devices.forEach((dev) => {
      if (!dev.groups.some((g) => state.activeGroups.has(g))) return;

      const isRotated = orientationState[dev.id] === 'landscape';
      const baseW = isRotated ? dev.height : dev.width;
      const baseH = isRotated ? dev.width : dev.height;

      // Scale factor calculation
      let scale = 1;
      if (state.autoScale && baseW > maxAvailableW) scale = maxAvailableW / baseW;

      const card = document.createElement('div');

      // Device Label & Header Controls
      const header = document.createElement('div');
      header.style.cssText = `width:${baseW * scale}px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; color:#eee; font-size:11px;`;
      header.innerHTML = `<div><strong>${dev.label}</strong> <span style="opacity:0.5; margin-left:5px;">${baseW}x${baseH}</span></div>`;

      const rot = document.createElement('button');
      rot.innerText = '🔄';
      rot.title = 'Rotate Device';
      rot.style.cssText =
        'background:none; border:none; cursor:pointer; font-size:12px; filter:grayscale(1); opacity:0.6;';
      rot.onclick = () => {
        orientationState[dev.id] = isRotated ? 'portrait' : 'landscape';
        render();
      };
      header.appendChild(rot);

      // Construct Zoom Container (The visual hitbox)
      const zoomContainer = document.createElement('div');
      zoomContainer.className = 'rr-zoom-container';
      zoomContainer.style.width = `${baseW * scale}px`;
      zoomContainer.style.height = `${baseH * scale}px`;

      // Construct the Shell (The simulated device)
      const shell = document.createElement('div');
      shell.className = 'rr-shell';
      shell.dataset.id = dev.id;
      shell.style.width = `${baseW}px`;
      shell.style.height = `${baseH}px`;
      shell.style.transform = `scale(${scale})`;

      // A. Browser Toolbar
      const toolbar = document.createElement('div');
      toolbar.className = 'rr-toolbar';
      toolbar.style.height = `${getOffset(dev, 'toolbar')}px`;
      toolbar.innerHTML = `
        <div class="rr-traffic">
          <div class="rr-dot" style="background:#ff5f56"></div>
          <div class="rr-dot" style="background:#ffbd2e"></div>
          <div class="rr-dot" style="background:#27c93f"></div>
        </div>
        <div class="rr-url-bar">localhost:5173</div>
      `;

      // B. Body Wrapper (Sidebars + Iframe)
      const bodyWrapper = document.createElement('div');
      bodyWrapper.className = 'rr-body-wrapper';

      const sWidth = getOffset(dev, 'sideNav');
      const createSideNav = (cls) => {
        const nav = document.createElement('div');
        nav.className = `rr-sidenav ${cls}`;
        nav.style.width = `${sWidth}px`;
        nav.innerHTML = `
          <div class="rr-side-icons">
            <div class="rr-side-icon" style="background:linear-gradient(#4facfe,#00f2fe)"></div>
            <div class="rr-side-icon" style="background:linear-gradient(#f093fb,#f5576c)"></div>
          </div>
          <div style="color:#444; font-size:18px; margin-bottom: 10px;">⚙️</div>
        `;
        return nav;
      };

      const iframe = document.createElement('iframe');
      iframe.className = 'rr-iframe';
      const url = new URL(window.location.href);
      url.searchParams.set('is-responsive-view', 'true');
      iframe.src = url.toString();

      bodyWrapper.append(
        createSideNav('rr-sidenav-left'),
        iframe,
        createSideNav('rr-sidenav-right'),
      );

      // C. OS Taskbar
      const taskbar = document.createElement('div');
      taskbar.className = 'rr-taskbar';
      taskbar.style.height = `${getOffset(dev, 'taskbar')}px`;
      taskbar.innerHTML = `
        <div class="rr-win-icon">
          <div class="rr-win-square"></div><div class="rr-win-square"></div>
          <div class="rr-win-square"></div><div class="rr-win-square"></div>
        </div>
      `;

      shell.append(toolbar, bodyWrapper, taskbar);
      zoomContainer.appendChild(shell);
      card.append(header, zoomContainer);
      grid.appendChild(card);
    });

    updateAllShells();
  };

  const buildControls = () => {
    filterBar.innerHTML = '';

    // 1. Group Selection Buttons
    const groupPanel = document.createElement('div');
    groupPanel.style.display = 'flex';
    [...new Set(devices.flatMap((d) => d.groups))].sort().forEach((g) => {
      const t = document.createElement('button');
      t.innerText = g;
      const active = state.activeGroups.has(g);
      t.style.cssText = `padding:6px 12px; margin:2px; border-radius:6px; border:none; cursor:pointer; font-size:11px; background:${active ? '#444' : '#222'}; color:${active ? '#fff' : '#666'}; transition: 0.2s;`;
      t.onclick = () => {
        state.activeGroups.has(g) ? state.activeGroups.delete(g) : state.activeGroups.add(g);
        buildControls();
        render();
      };
      groupPanel.appendChild(t);
    });

    // 2. Feature Toggle Buttons (Toolbar, Taskbar, Sidebars, Scale)
    const simPanel = document.createElement('div');
    simPanel.style.cssText =
      'border-left: 1px solid #333; padding-left: 20px; margin-left: 10px; display:flex; gap:8px;';

    const toggles = [
      ['🌐 Toolbar', 'showToolbar'],
      ['⌨️ Taskbar', 'showTaskbar'],
      ['⬅️ Side L', 'showSideLeft'],
      ['➡️ Side R', 'showSideRight'],
      ['🔍 Auto Scale', 'autoScale'],
    ];

    toggles.forEach(([label, key]) => {
      const t = document.createElement('button');
      t.innerText = label;
      const active = state[key];
      t.style.cssText = `padding:6px 12px; border-radius:6px; font-size:11px; cursor:pointer; transition:0.2s; border:1px solid ${active ? '#646cff' : '#333'}; background:${active ? '#333' : '#1a1a1a'}; color:${active ? '#fff' : '#888'};`;
      t.onclick = () => {
        state[key] = !state[key];
        // Auto scale and re-render or just toggle CSS classes
        if (key === 'autoScale') render();
        else updateAllShells();
        buildControls();
      };
      simPanel.appendChild(t);
    });

    filterBar.append(groupPanel, simPanel);
  };

  // --- INITIALIZATION ---
  overlay.className = 'rr-overlay';
  filterBar.className = 'rr-filter-bar';
  grid.className = 'rr-grid';
  btn.className = 'rr-toggle-btn';
  btn.innerText = '📱 View Layouts';

  overlay.append(filterBar, grid);
  document.body.append(btn, overlay);

  btn.onclick = () => {
    state.isOpen = !state.isOpen;
    overlay.style.display = state.isOpen ? 'block' : 'none';
    btn.innerText = state.isOpen ? '✕ Close Review' : '📱 View Layouts';
    btn.style.background = state.isOpen ? '#f44336' : '#646cff';
    document.body.style.overflow = state.isOpen ? 'hidden' : '';
    if (state.isOpen) {
      buildControls();
      render();
    }
  };

  // Resize listener for auto-scaling
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (state.isOpen && state.autoScale) render();
    }, 200);
  });
};
