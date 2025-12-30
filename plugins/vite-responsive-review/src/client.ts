/**
 * vite-responsive-review: Client UI Script (Full Updated Version)
 * Handles the responsive overlay, shell rendering, and browser simulation.
 */

// --- SYNC UTILS ---
const CHANNEL_NAME = 'responsive-review-sync';

// Helper to serialize Headers
const serializeHeaders = (headers: Headers) => {
  const h: any = {};
  for (const [key, value] of headers.entries()) {
    h[key] = value;
  }
  return h;
};

// Helper to serialize Response
const serializeResponse = async (response: Response) => {
  const blob = await response.blob();
  return {
    id: null, // set by caller
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: serializeHeaders(response.headers),
    body: blob, // Send as Blob
    url: response.url,
    responseType: response.type,
    redirected: response.redirected
  };
};

const setupMasterSync = () => {
  if (!('BroadcastChannel' in window)) {
    console.warn('[vite-responsive-review] BroadcastChannel API not supported. Sync disabled.');
    return;
  }

  const channel = new BroadcastChannel(CHANNEL_NAME);
  let isSyncing = false;

  // 1. Navigation Broadcasting
  const notifyNavigation = () => {
    if (isSyncing) return;
    channel.postMessage({
      type: 'navigation-update',
      url: window.location.href
    });
  };

  window.addEventListener('popstate', notifyNavigation);

  // Monkey-patch pushState/replaceState to catch programmatic navigation
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    notifyNavigation();
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    notifyNavigation();
  };

  // 2. Fetch Proxy Handler
  channel.onmessage = async (event: MessageEvent) => {
    const msg = event.data;
    if (!msg) return;

    if (msg.type === 'fetch-request') {
      try {
        const { id, url, options } = msg;
        // Perform the actual fetch
        const response = await window.fetch(url, options);
        const serialized = await serializeResponse(response);
        serialized.id = id;

        channel.postMessage({
          type: 'fetch-response',
          ...serialized
        });
      } catch (error) {
        channel.postMessage({
          type: 'fetch-error',
          id: msg.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } else if (msg.type === 'slave-navigated') {
        // Sync Master to Slave's navigation
        try {
            const urlObj = new URL(msg.url);
            urlObj.searchParams.delete('is-responsive-view');
            const cleanUrl = urlObj.toString();

            if (decodeURI(cleanUrl) !== decodeURI(window.location.href)) {
                isSyncing = true;
                // Update history without reloading page (preserves overlay state)
                history.pushState(null, '', cleanUrl);
                // Dispatch popstate to notify framework routers (e.g., Vue Router)
                window.dispatchEvent(new PopStateEvent('popstate'));
                isSyncing = false;
            }
        } catch (e) {
            console.warn('Failed to parse slave URL', e);
        }
    } else if (msg.type === 'slave-scroll') {
        // Sync Master to Slave's scroll
        // Check threshold to avoid loops
        if (Math.abs(window.scrollX - msg.x) > 2 || Math.abs(window.scrollY - msg.y) > 2) {
            window.scrollTo(msg.x, msg.y);
        }
    }
  };

  // 3. Scroll Sync Broadcasting
  let scrollTimeout: any = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
        channel.postMessage({
            type: 'scroll-update',
            x: window.scrollX,
            y: window.scrollY
        });
        scrollTimeout = null;
    }, 50);
  });
};

const setupSlaveSync = () => {
  if (!('BroadcastChannel' in window)) {
    console.warn('[vite-responsive-review] BroadcastChannel API not supported. Sync disabled.');
    return;
  }

  const channel = new BroadcastChannel(CHANNEL_NAME);
  let isSyncing = false;

  // 1. Navigation Listening & Broadcasting

  // Broadcast navigation to Master
  const notifyMaster = () => {
      if (isSyncing) return;
      channel.postMessage({
          type: 'slave-navigated',
          url: window.location.href
      });
  };

  // Listen for navigation updates from Master
  channel.onmessage = (event: MessageEvent) => {
    const msg = event.data;
    if (msg.type === 'navigation-update') {
      // Master sends clean URL. We MUST add 'is-responsive-view=true' to keep Slave status.
      try {
          const urlObj = new URL(msg.url);
          urlObj.searchParams.set('is-responsive-view', 'true');
          const slaveUrl = urlObj.toString();

          // Avoid infinite loop if we are already there
          if (decodeURI(window.location.href) !== decodeURI(slaveUrl)) {
            isSyncing = true;
            // SOFT NAVIGATION: Use history API + dispatch popstate to avoid reload
            history.replaceState(null, '', slaveUrl);
            window.dispatchEvent(new PopStateEvent('popstate'));
            isSyncing = false;
          }
      } catch (e) {
          console.warn('Failed to parse master URL', e);
      }
    } else if (msg.type === 'scroll-update') {
        // Check threshold to avoid loops
        if (Math.abs(window.scrollX - msg.x) > 2 || Math.abs(window.scrollY - msg.y) > 2) {
            window.scrollTo(msg.x, msg.y);
        }
    }
  };

  // Monkey-patch history to detect local navigation changes (e.g. RouterLink clicks)
  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    notifyMaster();
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    notifyMaster();
  };

  window.addEventListener('popstate', notifyMaster);

  // Broadcast scroll to Master
  let scrollTimeout: any = null;
  window.addEventListener('scroll', () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
          channel.postMessage({
              type: 'slave-scroll',
              x: window.scrollX,
              y: window.scrollY
          });
          scrollTimeout = null;
      }, 50);
  });

  // 2. Proxy Fetch Requests
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    let url = input;
    let options: any = init || {};

    if (input instanceof Request) {
        url = input.url;
        // Merge request options if not present in init
        if (!options.method) options.method = input.method;
        if (!options.headers) options.headers = serializeHeaders(input.headers);
        if (!options.body && input.body) {
             try {
                const clone = input.clone();
                options.body = await clone.blob(); // Get as blob
             } catch (e) {
                 console.warn('Could not clone request body for proxy', e);
             }
        }
        // Copy other properties
        if (!options.mode) options.mode = input.mode;
        if (!options.credentials) options.credentials = input.credentials;
        if (!options.cache) options.cache = input.cache;
        if (!options.redirect) options.redirect = input.redirect;
        if (!options.referrer) options.referrer = input.referrer;
        if (!options.referrerPolicy) options.referrerPolicy = input.referrerPolicy;
        if (!options.integrity) options.integrity = input.integrity;
        if (!options.keepalive) options.keepalive = input.keepalive;
    }

    // Strip AbortSignal as it is not serializable
    if (options.signal) {
        delete options.signal;
        console.warn('AbortSignal is not supported in Responsive Review proxy mode.');
    }

    // Ensure headers are plain object
    if (options.headers instanceof Headers) {
        options.headers = serializeHeaders(options.headers);
    }

    const requestId = Math.random().toString(36).substring(7);

    return new Promise((resolve, reject) => {

        const handler = (event: MessageEvent) => {
            const msg = event.data;
            if (msg.id === requestId) {
                if (msg.type === 'fetch-response') {
                    channel.removeEventListener('message', handler);

                    // Reconstruct Response
                    const response = new Response(msg.body as any, {
                        status: msg.status,
                        statusText: msg.statusText,
                        headers: new Headers(msg.headers as any)
                    });

                    // Define properties that Response ctor doesn't set
                    Object.defineProperty(response, 'url', { value: msg.url });
                    Object.defineProperty(response, 'redirected', { value: msg.redirected });
                    Object.defineProperty(response, 'type', { value: msg.responseType });

                    resolve(response);
                } else if (msg.type === 'fetch-error') {
                    channel.removeEventListener('message', handler);
                    reject(new TypeError(msg.error as string));
                }
            }
        };

        channel.addEventListener('message', handler);

        channel.postMessage({
            type: 'fetch-request',
            id: requestId,
            url: url.toString(),
            options: options
        });
    });
  };
};

export const initResponsiveUI = (devices: any, groupOffsets: any) => {
  // Safe init
  const init = () => {
      try {
          // Check if we are in a slave (iframe)
          if (window.location.search.includes('is-responsive-view=true')) {
            setupSlaveSync();
            return;
          }

          // If we are here, we are likely the Master (or a normal view)
          // We initialize the Master Sync
          setupMasterSync();

          // --- STATE ---
          const orientationState: any = {};
          devices.forEach((d: any) => (orientationState[d.id] = 'portrait'));
          orientationState['master-controller'] = 'portrait';

          let state = {
            isOpen: false,
            showToolbar: true,
            showTaskbar: false,
            showSideLeft: false,
            showSideRight: false,
            autoScale: true,
            activeGroups: new Set([...new Set(devices.flatMap((d: any) => d.groups))]),
          };

          // --- UI ELEMENTS ---
          const btn = document.createElement('button');
          const overlay = document.createElement('div');
          const filterBar = document.createElement('div');

          const stage = document.createElement('div');
          const masterPane = document.createElement('div');
          const grid = document.createElement('div');

          // --- CSS INJECTION ---
          const styleTag = document.createElement('style');
          styleTag.innerHTML = `
            .rr-overlay { position: fixed; inset: 0; background: #0a0a0a; z-index: 9999998; display: none; overflow-y: auto; padding: 120px 40px 40px; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; scroll-behavior: smooth; }
            .rr-filter-bar { position: fixed; top: 0; left: 0; width: 100%; padding: 15px; background: #141414; border-bottom: 1px solid #333; display: flex; gap: 20px; justify-content: center; align-items: center; z-index: 9999999; flex-wrap: wrap; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }

            .rr-stage { display: flex; align-items: flex-start; gap: 40px; }
            .rr-master-pane { position: sticky; top: 0; z-index: 100; flex-shrink: 0; }
            .rr-grid { display: flex; flex-wrap: wrap; gap: 60px; justify-content: center; align-items: flex-start; flex: 1; }

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
          const getOffset = (dev: any, key: string) => {
            // 1. Check individual device overrides
            if (dev.offsets && typeof dev.offsets[key] !== 'undefined') {
              return dev.offsets[key] as number;
            }

            // 2. Check group defaults
            const groupName: string = dev.groups.find((g: string) => groupOffsets[g]) || 'Other';
            const set = groupOffsets[groupName] || groupOffsets['Other'] || {};

            return typeof set[key] !== 'undefined' ? (set[key] as number) : 0;
          };

          const updateAllShells = () => {
            document.querySelectorAll('.rr-shell').forEach((shell) => {
              const id = (shell as HTMLElement).dataset.id;
              if (id === 'master-controller') {
                  const toolbar = shell.querySelector('.rr-toolbar');
                  if (toolbar) toolbar.classList.toggle('hidden', !state.showToolbar);
                  const taskbar = shell.querySelector('.rr-taskbar');
                  if (taskbar) taskbar.classList.toggle('hidden', !state.showTaskbar);
                  const sideLeft = shell.querySelector('.rr-sidenav-left');
                  if (sideLeft) sideLeft.classList.toggle('hidden', !state.showSideLeft);
                  const sideRight = shell.querySelector('.rr-sidenav-right');
                  if (sideRight) sideRight.classList.toggle('hidden', !state.showSideRight);
                  return;
              }

              const dev = devices.find((d: any) => d.id === id);
              if (!dev) return;

              const toolbar = shell.querySelector('.rr-toolbar');
              if (toolbar) toolbar.classList.toggle('hidden', !state.showToolbar);

              const taskbar = shell.querySelector('.rr-taskbar');
              if (taskbar) taskbar.classList.toggle('hidden', !state.showTaskbar);

              const sideLeft = shell.querySelector('.rr-sidenav-left');
              if (sideLeft) sideLeft.classList.toggle('hidden', !state.showSideLeft);

              const sideRight = shell.querySelector('.rr-sidenav-right');
              if (sideRight) sideRight.classList.toggle('hidden', !state.showSideRight);
            });
          };

          const createShell = (dev: any, scale: number) => {
              const card = document.createElement('div');
              card.className = 'rr-card';
              card.dataset.devId = dev.id;

              // Device Label & Header Controls
              const header = document.createElement('div');
              header.className = 'rr-header';
              header.style.cssText = `width:${dev.width * scale}px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; color:#eee; font-size:11px;`;
              header.innerHTML = `<div class="rr-label"><strong>${dev.label}</strong> <span style="opacity:0.5; margin-left:5px;">${dev.width}x${dev.height}</span></div>`;

              if (dev.id !== 'master-controller') {
                  const rot = document.createElement('button');
                  rot.innerText = '🔄';
                  rot.title = 'Rotate Device';
                  rot.style.cssText =
                    'background:none; border:none; cursor:pointer; font-size:12px; filter:grayscale(1); opacity:0.6;';
                  rot.onclick = () => {
                    orientationState[dev.id] = orientationState[dev.id] === 'landscape' ? 'portrait' : 'landscape';
                    render();
                  };
                  header.appendChild(rot);
              }

              const zoomContainer = document.createElement('div');
              zoomContainer.className = 'rr-zoom-container';
              zoomContainer.style.width = `${dev.width * scale}px`;
              zoomContainer.style.height = `${dev.height * scale}px`;

              const shell = document.createElement('div');
              shell.className = 'rr-shell';
              shell.dataset.id = dev.id;
              shell.style.width = `${dev.width}px`;
              shell.style.height = `${dev.height}px`;
              shell.style.transform = `scale(${scale})`;

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

              const bodyWrapper = document.createElement('div');
              bodyWrapper.className = 'rr-body-wrapper';

              const sWidth = getOffset(dev, 'sideNav');
              const createSideNav = (cls: string) => {
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
              return card;
          };

          const updateCard = (card: HTMLElement, dev: any, scale: number) => {
             // Update Header Width
             const header = card.querySelector('.rr-header') as HTMLElement;
             if (header) {
                 header.style.width = `${dev.width * scale}px`;
                 // Update label text
                 const label = header.querySelector('.rr-label');
                 if (label) {
                     label.innerHTML = `<strong>${dev.label}</strong> <span style="opacity:0.5; margin-left:5px;">${dev.width}x${dev.height}</span>`;
                 }
             }

             // Update Zoom Container
             const zoomContainer = card.querySelector('.rr-zoom-container') as HTMLElement;
             if (zoomContainer) {
                 zoomContainer.style.width = `${dev.width * scale}px`;
                 zoomContainer.style.height = `${dev.height * scale}px`;
             }

             // Update Shell
             const shell = card.querySelector('.rr-shell') as HTMLElement;
             if (shell) {
                 shell.style.width = `${dev.width}px`;
                 shell.style.height = `${dev.height}px`;
                 shell.style.transform = `scale(${scale})`;
             }
          };

          const render = () => {
            // --- 1. HANDLE MASTER CONTROLLER ---
            const masterDev = {
                id: 'master-controller',
                label: 'Master Controller',
                width: 1920,
                height: 1080,
                groups: ['Master'],
                offsets: { toolbar: 85, taskbar: 48, sideNav: 80 }
            };

            // Check if master card exists
            let masterCard = masterPane.querySelector('.rr-card') as HTMLElement;
            if (!masterCard) {
                // Initial creation
                masterPane.innerHTML = ''; // Clear label if exists
                const masterLabel = document.createElement('div');
                masterLabel.innerText = 'CONTROLLER';
                masterLabel.style.cssText = 'color:#888; font-size:10px; font-weight:bold; letter-spacing:1px; margin-bottom:10px; padding-left:2px;';
                masterPane.appendChild(masterLabel);

                masterCard = createShell(masterDev, 0.25);
                (masterCard.querySelector('.rr-shell') as HTMLElement).style.border = '2px solid #646cff';
                masterPane.appendChild(masterCard);
            } else {
                // Update
                updateCard(masterCard, masterDev, 0.25);
            }

            // --- 2. HANDLE GRID DEVICES ---
            const maxAvailableW = window.innerWidth - 600;

            // Gather active devices
            const activeDevices: any[] = [];
            devices.forEach((dev: any) => {
                if (dev.groups.some((g: string) => state.activeGroups.has(g))) {
                    const isRotated = orientationState[dev.id] === 'landscape';
                    const w = isRotated ? dev.height : dev.width;
                    const h = isRotated ? dev.width : dev.height;

                    activeDevices.push({ ...dev, width: w, height: h });
                }
            });

            // Remove inactive cards
            const gridCards = Array.from(grid.children) as HTMLElement[];
            const activeIds = new Set(activeDevices.map(d => d.id));

            gridCards.forEach(card => {
                const id = card.dataset.devId;
                if (id && !activeIds.has(id)) {
                    card.remove();
                }
            });

            // Create or Update cards
            activeDevices.forEach(currentDev => {
                let scale = 1;
                if (state.autoScale && currentDev.width > maxAvailableW) scale = maxAvailableW / currentDev.width;

                const existingCard = grid.querySelector(`.rr-card[data-dev-id="${currentDev.id}"]`) as HTMLElement;

                if (existingCard) {
                    updateCard(existingCard, currentDev, scale);
                } else {
                    const card = createShell(currentDev, scale);
                    grid.appendChild(card);
                }
            });

            updateAllShells();
          };

          const buildControls = () => {
            filterBar.innerHTML = '';

            const groupPanel = document.createElement('div');
            groupPanel.style.display = 'flex';
            [...new Set(devices.flatMap((d: any) => d.groups))].sort().forEach((g) => {
              const t = document.createElement('button');
              t.innerText = g as string;
              const active = state.activeGroups.has(g);
              t.style.cssText = `padding:6px 12px; margin:2px; border-radius:6px; border:none; cursor:pointer; font-size:11px; background:${active ? '#444' : '#222'}; color:${active ? '#fff' : '#666'}; transition: 0.2s;`;
              t.onclick = () => {
                state.activeGroups.has(g) ? state.activeGroups.delete(g) : state.activeGroups.add(g);
                buildControls();
                render();
              };
              groupPanel.appendChild(t);
            });

            const simPanel = document.createElement('div');
            simPanel.style.cssText =
              'border-left: 1px solid #333; padding-left: 20px; margin-left: 10px; display:flex; gap:8px;';

            const toggles: any = [
              ['🌐 Toolbar', 'showToolbar'],
              ['⌨️ Taskbar', 'showTaskbar'],
              ['⬅️ Side L', 'showSideLeft'],
              ['➡️ Side R', 'showSideRight'],
              ['🔍 Auto Scale', 'autoScale'],
            ];

            toggles.forEach((item: any) => {
              const [label, key] = item;
              const t = document.createElement('button');
              t.innerText = label;
              const active = (state as any)[key];
              t.style.cssText = `padding:6px 12px; border-radius:6px; font-size:11px; cursor:pointer; transition:0.2s; border:1px solid ${active ? '#646cff' : '#333'}; background:${active ? '#333' : '#1a1a1a'}; color:${active ? '#fff' : '#888'};`;
              t.onclick = () => {
                // @ts-ignore
                (state as any)[key] = !state[key];
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

          stage.className = 'rr-stage';
          masterPane.className = 'rr-master-pane';
          grid.className = 'rr-grid';

          stage.append(masterPane, grid);
          overlay.append(filterBar, stage);
          document.body.append(btn, overlay);

          btn.className = 'rr-toggle-btn';
          btn.innerText = '📱 View Layouts';

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
          let resizeTimer: any;
          window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
              if (state.isOpen && state.autoScale) render();
            }, 200);
          });
      } catch (e) {
          console.error('[vite-responsive-review] Error initializing UI:', e);
      }
  };

  if (document.body) {
      init();
  } else {
      document.addEventListener('DOMContentLoaded', init);
  }
};
