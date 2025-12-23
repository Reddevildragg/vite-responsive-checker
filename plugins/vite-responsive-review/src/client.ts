export const initResponsiveUI = (devices, offsets) => {
  if (window.location.search.includes('is-responsive-view=true')) return;

  const orientationState = {};
  devices.forEach((d) => (orientationState[d.id] = 'portrait'));

  let state = {
    isOpen: false,
    showToolbar: true,
    showTaskbar: false,
    showSideNav: false,
    autoScale: true, // New: Scale down large devices to fit screen
    activeGroups: new Set([...new Set(devices.flatMap((d) => d.groups))]),
  };

  const btn = document.createElement('button');
  const overlay = document.createElement('div');
  const filterBar = document.createElement('div');
  const grid = document.createElement('div');

  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    .rr-zoom-container { position: relative; transition: all 0.3s ease; }
    .rr-shell { 
      display: flex; flex-direction: column; background: #fff; 
      border: 2px solid #333; border-radius: 8px; overflow: hidden; 
      transform-origin: top left; /* Critical for scaling */
    }
    .rr-body-wrapper { display: flex; flex: 1; overflow: hidden; }
    .rr-toolbar { height: ${offsets.toolbar}px; background: #e0e0e0; border-bottom: 1px solid #ccc; display: flex; align-items: center; padding: 0 10px; gap: 10px; flex-shrink: 0; }
    .rr-url-bar { flex: 1; background: #fff; height: 24px; border-radius: 12px; border: 1px solid #ccc; font-size: 10px; display: flex; align-items: center; padding-left: 10px; color: #666; }
    .rr-taskbar { height: ${offsets.taskbar}px; background: #222; border-top: 1px solid #444; flex-shrink: 0; }
    .rr-sidenav { width: ${offsets.sideNav}px; background: #f4f4f4; border-right: 1px solid #ddd; flex-shrink: 0; }
    .rr-iframe { border: none; flex: 1; width: 100%; height: 100%; }
    .hidden { display: none !important; }
  `;
  document.head.appendChild(styleTag);

  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '2000000',
    padding: '12px 18px',
    backgroundColor: '#646cff',
    color: 'white',
    borderRadius: '12px',
    cursor: 'pointer',
    border: 'none',
    fontWeight: 'bold',
  });
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    backgroundColor: '#0a0a0a',
    zIndex: '1999999',
    display: 'none',
    overflowY: 'auto',
    padding: '120px 40px 40px',
  });
  Object.assign(filterBar.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    padding: '15px',
    backgroundColor: '#141414',
    borderBottom: '1px solid #333',
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    zIndex: '2000001',
    flexWrap: 'wrap',
  });
  Object.assign(grid.style, {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '40px',
    justifyContent: 'center',
    alignItems: 'flex-start',
  });

  const updateAllShells = () => {
    document.querySelectorAll('.rr-shell').forEach((shell) => {
      const isDesktop =
        shell.dataset.group.includes('Desktop') || shell.dataset.group.includes('Laptop');
      shell.querySelector('.rr-toolbar').classList.toggle('hidden', !state.showToolbar);
      shell
        .querySelector('.rr-taskbar')
        .classList.toggle('hidden', !(state.showTaskbar && isDesktop));
      shell
        .querySelector('.rr-sidenav')
        .classList.toggle('hidden', !(state.showSideNav && isDesktop));
    });
  };

  const render = () => {
    grid.innerHTML = '';
    const maxAvailableWidth = window.innerWidth - 100; // Buffer for padding

    devices.forEach((dev) => {
      if (!dev.groups.some((g) => state.activeGroups.has(g))) return;

      const isRotated = orientationState[dev.id] === 'landscape';
      const baseW = isRotated ? dev.height : dev.width;
      const baseH = isRotated ? dev.width : dev.height;

      // Calculate Scaling
      let scaleFactor = 1;
      if (state.autoScale && baseW > maxAvailableWidth) {
        scaleFactor = maxAvailableWidth / baseW;
      }

      const card = document.createElement('div');
      card.className = 'rr-card';

      const header = document.createElement('div');
      header.style.cssText = `width: ${baseW * scaleFactor}px; display:flex; justify-content:space-between; margin-bottom:8px; align-items: center;`;
      header.innerHTML = `<div style="color:#eee; font-size:11px;"><strong>${dev.label}</strong> <span style="opacity:0.5">${baseW}x${baseH} ${scaleFactor < 1 ? '(' + Math.round(scaleFactor * 100) + '%)' : ''}</span></div>`;

      const rot = document.createElement('button');
      rot.innerText = '🔄';
      rot.style.cssText =
        'background:none; border:none; cursor:pointer; font-size:12px; filter: grayscale(1);';
      rot.onclick = () => {
        orientationState[dev.id] = isRotated ? 'portrait' : 'landscape';
        render();
      };
      header.appendChild(rot);

      // The Zoom Wrapper
      const zoomContainer = document.createElement('div');
      zoomContainer.className = 'rr-zoom-container';
      zoomContainer.style.width = `${baseW * scaleFactor}px`;
      zoomContainer.style.height = `${baseH * scaleFactor}px`;

      const shell = document.createElement('div');
      shell.className = 'rr-shell';
      shell.dataset.group = dev.groups.join(',');
      shell.style.width = `${baseW}px`;
      shell.style.height = `${baseH}px`;
      shell.style.transform = `scale(${scaleFactor})`;

      // Shell Content
      const toolbar = document.createElement('div');
      toolbar.className = 'rr-toolbar';
      toolbar.innerHTML = `<div style="width:10px; height:10px; border-radius:50%; background:#ff5f56"></div><div class="rr-url-bar">localhost:5173</div>`;

      const bodyWrapper = document.createElement('div');
      bodyWrapper.className = 'rr-body-wrapper';
      const sideNav = document.createElement('div');
      sideNav.className = 'rr-sidenav';
      const iframe = document.createElement('iframe');
      iframe.className = 'rr-iframe';
      iframe.src =
        window.location.href + (window.location.search ? '&' : '?') + 'is-responsive-view=true';

      const taskbar = document.createElement('div');
      taskbar.className = 'rr-taskbar';

      bodyWrapper.append(sideNav, iframe);
      shell.append(toolbar, bodyWrapper, taskbar);
      zoomContainer.appendChild(shell);
      card.append(header, zoomContainer);
      grid.appendChild(card);
    });
    updateAllShells();
  };

  const buildControls = () => {
    filterBar.innerHTML = '';

    const groupPanel = document.createElement('div');
    [...new Set(devices.flatMap((d) => d.groups))].sort().forEach((g) => {
      const t = document.createElement('button');
      t.innerText = g;
      t.style.cssText = `padding:5px 10px; margin:2px; border-radius:4px; border:none; cursor:pointer; font-size:10px; background:${state.activeGroups.has(g) ? '#444' : '#222'}; color:${state.activeGroups.has(g) ? '#fff' : '#666'}`;
      t.onclick = () => {
        state.activeGroups.has(g) ? state.activeGroups.delete(g) : state.activeGroups.add(g);
        buildControls();
        render();
      };
      groupPanel.appendChild(t);
    });

    const simPanel = document.createElement('div');
    simPanel.style.cssText =
      'border-left:1px solid #333; padding-left:15px; display:flex; gap:5px;';

    [
      ['🌐 Toolbar', 'showToolbar'],
      ['⌨️ Taskbar', 'showTaskbar'],
      ['📁 SideNav', 'showSideNav'],
      ['🔍 Auto Scale', 'autoScale'],
    ].forEach(([l, k]) => {
      const t = document.createElement('button');
      t.innerText = l;
      t.style.cssText = `padding:5px 10px; border-radius:4px; font-size:10px; cursor:pointer; border:1px solid ${state[k] ? '#646cff' : '#333'}; background:${state[k] ? '#333' : '#1a1a1a'}; color:${state[k] ? '#fff' : '#888'}`;
      t.onclick = () => {
        state[k] = !state[k];
        if (k === 'autoScale')
          render(); // Scaling requires full re-calc
        else updateAllShells();
        buildControls();
      };
      simPanel.appendChild(t);
    });

    filterBar.append(groupPanel, simPanel);
  };

  overlay.append(filterBar, grid);
  document.body.append(btn, overlay);

  btn.onclick = () => {
    state.isOpen = !state.isOpen;
    overlay.style.display = state.isOpen ? 'block' : 'none';
    btn.innerText = state.isOpen ? '✕ Close' : '📱 View Layouts';
    document.body.style.overflow = state.isOpen ? 'hidden' : '';
    if (state.isOpen) {
      buildControls();
      render();
    }
  };

  window.onresize = () => {
    if (state.isOpen && state.autoScale) render();
  };
};
