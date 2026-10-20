(() => {
    const MIN_WIDTH = 260;
    const MIN_HEIGHT = 240;
    const BAR_HEIGHT = 36;
    const GRIP = 6;
    const EDGE = 16;
    const KEY_STEP = 20;
    const DOCK_GRACE_MS = 4000;
    const DOCK_MIN_WIDTH = 300;
    const DOCK_MAX_WIDTH = 900;
    const VIDEO_MIN_WIDTH = 480;
    const RESIZER_WIDTH = 8;
    const WIDTH_PROPERTIES = ["width", "min-width", "max-width", "flex-basis"];
    // Phone-sized layouts, where Patreon stacks the chat under the video.
    const NARROW_QUERY = window.matchMedia("(max-width: 767px)");
    const PANEL_ID = "hydettv";
    const DOCK_ID = "hydettv-dock";
    const DOCK_CHAT_ID = "hydettv-dock-chat";
    const PAGE_STYLE_ID = "hydettv-page-style";
    const TAB_ATTRIBUTE = "data-hydettv-tab";

    // Header of Patreon's live chat column. The class comes from a CSS module
    // whose hash changes between Patreon builds, so match the stable parts.
    const PATREON_CHAT_HEADER =
        '[class*="Chat-module__"][class*="__sidebarHeader"]';

    const ICONS = {
        popout:
            '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 ' +
            '1-1-1V7a1 1 0 0 1 1-1h5"/>',
        reload: '<path d="M20 12a8 8 0 1 1-2.34-5.66L20 8M20 4v4h-4"/>',
        toggle: '<path d="M6 15l6-6 6 6"/>',
    };

    // Icon buttons shared by the floating panel and the docked tabs. Each
    // context defines --text, --muted, --hover and --accent.
    const BUTTON_STYLES = `
        .icon-button {
            display: grid;
            flex: none;
            place-items: center;
            width: 28px;
            height: 28px;
            padding: 0;
            border: 0;
            border-radius: 6px;
            background: transparent;
            color: var(--muted);
            cursor: pointer;
            transition:
                background-color 100ms ease-in-out,
                color 100ms ease-in-out;
        }
        .icon-button:hover {
            background: var(--hover);
            color: var(--text);
        }
        .icon-button:focus-visible {
            outline: 2px solid var(--accent);
            outline-offset: -2px;
        }
        svg {
            width: 16px;
            height: 16px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        iframe {
            display: block;
            width: 100%;
            height: 100%;
            border: 0;
        }
    `;

    // Twitch disables chatting for the channel owner and mods unless the chat
    // iframe is fully visible, so nothing (not even the invisible resize
    // grips) may overlap it and the panel doesn't clip it. The grips live in
    // a GRIP-wide frame around the iframe instead.
    const PANEL_STYLES = `
        ${BUTTON_STYLES}
        .panel {
            --accent: #9147ff;
            position: fixed;
            z-index: 2147483647;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--bg);
            color: var(--text);
            font: 600 13px/1 "Open Sans", system-ui, sans-serif;
        }
        .panel[data-theme="dark"] {
            --bg: #18181b;
            --bar: #1f1f23;
            --border: #3a3a3d;
            --text: #efeff1;
            --muted: #adadb8;
            --hover: #2f2f35;
        }
        .panel[data-theme="light"] {
            --bg: #ffffff;
            --bar: #f7f7f8;
            --border: #dedee3;
            --text: #0e0e10;
            --muted: #53535f;
            --hover: #e6e6ea;
        }
        .bar {
            display: flex;
            flex: none;
            align-items: center;
            gap: 2px;
            height: ${BAR_HEIGHT}px;
            box-sizing: border-box;
            padding: 0 4px 0 10px;
            border-radius: 5px 5px 0 0;
            background: var(--bar);
            cursor: grab;
            user-select: none;
            touch-action: none;
        }
        .panel.is-busy .bar {
            cursor: grabbing;
        }
        .handle {
            display: flex;
            flex: 1;
            align-items: center;
            gap: 8px;
            min-width: 0;
            padding: 4px 2px;
            border-radius: 4px;
            outline: none;
        }
        .handle:focus-visible {
            outline: 2px solid var(--accent);
        }
        .dot {
            flex: none;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent);
        }
        .name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .panel.is-minimized .bar {
            border-radius: 5px;
        }
        .panel.is-minimized [data-action="toggle"] svg {
            transform: rotate(180deg);
        }
        .body {
            flex: 1;
            min-height: 0;
            padding: 0 ${GRIP}px ${GRIP}px;
            border-top: 1px solid var(--border);
        }
        .panel.is-busy iframe {
            pointer-events: none;
        }
        .panel.is-minimized .body,
        .panel.is-minimized .grip {
            display: none;
        }
        .grip {
            position: absolute;
            touch-action: none;
        }
        .grip[data-edge="w"],
        .grip[data-edge="e"] {
            top: ${BAR_HEIGHT}px;
            bottom: ${GRIP * 2}px;
            width: ${GRIP}px;
            cursor: ew-resize;
        }
        .grip[data-edge="w"] {
            left: 0;
        }
        .grip[data-edge="e"] {
            right: 0;
        }
        .grip[data-edge="s"] {
            right: ${GRIP * 2}px;
            bottom: 0;
            left: ${GRIP * 2}px;
            height: ${GRIP}px;
            cursor: ns-resize;
        }
        /* Each corner is an L of two grips so it stays inside the frame. */
        .grip[data-edge="sw"],
        .grip[data-edge="se"] {
            bottom: 0;
            width: ${GRIP}px;
            height: ${GRIP * 2}px;
        }
        .grip[data-edge="sw"].is-wide,
        .grip[data-edge="se"].is-wide {
            width: ${GRIP * 2}px;
            height: ${GRIP}px;
        }
        .grip[data-edge="sw"] {
            left: 0;
            cursor: nesw-resize;
        }
        .grip[data-edge="se"] {
            right: 0;
            cursor: nwse-resize;
        }
    `;

    // Mirrors Patreon's own chat tabs (Chat-module tabsWrapper / liveTab)
    // using the theme variables Patreon defines on the page.
    const DOCK_STYLES = `
        ${BUTTON_STYLES}
        :host {
            --accent: #9147ff;
            --text: var(--global-content-regular-default, #f5f5f5);
            --muted: var(--global-content-muted-default, #a3a3a3);
            --border: var(--global-border-muted-default, #ffffff1f);
            --hover: color-mix(in srgb, var(--text) 12%, transparent);
            display: flex;
            flex: none;
            flex-direction: column;
            min-height: 0;
        }
        :host([data-tab="twitch"]) {
            flex: 1 1 auto;
            height: 100%;
        }
        .tabs {
            display: flex;
            flex: none;
            align-items: flex-end;
            gap: 32px;
            min-height: 56px;
            box-sizing: border-box;
            padding: 0 8px 0 20px;
            border-bottom: 1px solid var(--border);
            background: var(--global-bg-page-default, transparent);
        }
        [role="tab"] {
            margin-bottom: -1px;
            padding: 8px 0;
            border: 0;
            border-bottom: 2px solid transparent;
            background: none;
            color: var(--muted);
            font-family: var(--type-heading-fontStack, inherit);
            font-size: var(--type-heading-fontSizes-md, 16px);
            font-weight: var(--type-heading-fontWeights-medium, 500);
            letter-spacing: var(--type-heading-letterSpacing, normal);
            line-height: var(--type-heading-lineHeight, 1.25);
            cursor: pointer;
            transition:
                color 100ms ease-in-out,
                border-color 100ms ease-in-out;
        }
        [role="tab"]:hover,
        [role="tab"][aria-selected="true"] {
            color: var(--text);
        }
        [role="tab"][aria-selected="true"] {
            border-bottom-color: var(--text);
        }
        [role="tab"]:focus-visible {
            border-radius: 2px;
            outline: 2px solid var(--accent);
            outline-offset: 2px;
        }
        .actions {
            display: flex;
            align-self: center;
            gap: 4px;
            margin-left: auto;
        }
        .slot {
            flex: 1;
            min-height: 0;
        }
        :host([data-tab="patreon"]) .actions,
        :host([data-tab="patreon"]) .slot {
            display: none;
        }
    `;

    // The docked chat iframe lives in its own top-level layer positioned over
    // the slot below the tabs, not inside Patreon's chat column. Twitch
    // disables chatting for the channel owner and mods unless the iframe is
    // fully visible, and Patreon keeps invisible full-page layers (page frame,
    // toasts) above its chat column, so the iframe has to sit above them.
    const DOCK_CHAT_STYLES = `
        .frame {
            position: fixed;
            z-index: 2147483647;
        }
        .frame[hidden] {
            display: none;
        }
        .frame[data-theme="dark"] {
            background: #18181b;
        }
        .frame[data-theme="light"] {
            background: #ffffff;
        }
        iframe {
            display: block;
            width: 100%;
            height: 100%;
            border: 0;
        }
        /* Sits just left of the sidebar, over the video's edge, so it never
           covers the chat iframe. */
        .resizer {
            position: fixed;
            z-index: 2147483647;
            cursor: col-resize;
            outline: none;
            touch-action: none;
        }
        .resizer::after {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            width: 2px;
            background: #9147ff;
            content: "";
            opacity: 0;
            transition: opacity 100ms ease-in-out;
        }
        .resizer:hover::after,
        .resizer:focus-visible::after,
        .resizer.is-dragging::after {
            opacity: 1;
        }
        /* Covers the page while dragging so the iframe can't swallow it. */
        .shield {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            cursor: col-resize;
        }
        .resizer[hidden],
        .shield[hidden] {
            display: none;
        }
    `;

    let settings = { ...DEFAULT_SETTINGS };
    let layout = null;
    let dockTab = "twitch";
    let dockMissingSince = 0;
    let dockTrackingFrame = 0;
    // Docked sidebar width set by dragging, or null for Patreon's default.
    let dockWidth = null;
    const widthOverrides = new Set();
    let isSyncQueued = false;
    let panel = null;
    let dock = null;
    // Twitch channel for the creator whose page is open, or null.
    let channel = null;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function icon(name) {
        return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
    }

    function actionButtons() {
        return `
            <button type="button" class="icon-button" data-action="popout"
                aria-label="Open Twitch chat in a new window"
                title="Pop out">${icon("popout")}</button>
            <button type="button" class="icon-button" data-action="reload"
                aria-label="Reload Twitch chat"
                title="Reload">${icon("reload")}</button>
        `;
    }

    function defaultLayout() {
        if (NARROW_QUERY.matches) {
            // Phones: across the bottom half, under the video.
            const height = Math.round(window.innerHeight / 2);
            return {
                left: 0,
                top: window.innerHeight - height,
                width: window.innerWidth,
                height,
                isMinimized: false,
            };
        }
        const width = 340;
        return {
            left: window.innerWidth - width - EDGE,
            top: 88,
            width,
            height: Math.max(MIN_HEIGHT, Math.min(620, window.innerHeight - 120)),
            isMinimized: false,
        };
    }

    function normalizeSettings(stored) {
        const channels = Object.entries(stored.channels ?? {})
            .map(([key, value]) => [key, parseChannel(value)])
            .filter(([, value]) => value);
        return {
            ...stored,
            channels: Object.fromEntries(channels),
            theme: stored.theme === "light" ? "light" : "dark",
            placement: stored.placement === "float" ? "float" : "dock",
        };
    }

    function isLivestreamPage() {
        return /\/events\/\d+/.test(location.pathname);
    }

    function chatUrl() {
        const darkParam = settings.theme === "dark" ? "&darkpopout" : "";
        return (
            `https://www.twitch.tv/embed/${channel}/chat` +
            `?parent=${location.hostname}${darkParam}`
        );
    }

    function popoutUrl() {
        return `https://www.twitch.tv/popout/${channel}/chat?popout=`;
    }

    function updateFrame(iframe) {
        const src = chatUrl();
        if (iframe.dataset.src !== src) {
            iframe.dataset.src = src;
            iframe.src = src;
        }
    }

    function saveLocal(values) {
        try {
            ext.storage.local.set(values);
        } catch {
            // Extension was reloaded; this page's script is orphaned.
        }
    }

    function handleAction(action, iframe) {
        if (action === "popout") {
            window.open(
                popoutUrl(),
                "twitch-chat-popout",
                "width=400,height=720"
            );
        } else if (action === "reload") {
            iframe.src = iframe.dataset.src;
        } else if (action === "toggle") {
            layout.isMinimized = !layout.isMinimized;
            applyLayout();
            saveLocal({ layout });
        }
    }

    // ---- Floating panel ----

    // Keeps the panel on screen without overwriting the saved size, so
    // shrinking the window and growing it again restores the original layout.
    function applyLayout() {
        const width = clamp(layout.width, MIN_WIDTH, window.innerWidth);
        const height = clamp(layout.height, MIN_HEIGHT, window.innerHeight);
        const visibleHeight = layout.isMinimized ? BAR_HEIGHT : height;
        layout.left = clamp(layout.left, 0, window.innerWidth - width);
        layout.top = clamp(layout.top, 0, window.innerHeight - visibleHeight);

        const { box, toggle } = panel;
        box.style.left = `${layout.left}px`;
        box.style.top = `${layout.top}px`;
        box.style.width = `${width}px`;
        box.style.height = layout.isMinimized ? "" : `${height}px`;
        box.classList.toggle("is-minimized", layout.isMinimized);
        toggle.setAttribute("aria-expanded", String(!layout.isMinimized));
        toggle.setAttribute(
            "aria-label",
            layout.isMinimized ? "Expand chat" : "Minimize chat"
        );
        toggle.title = layout.isMinimized ? "Expand" : "Minimize";
    }

    // Shared drag/resize plumbing. The iframe stops taking pointer events
    // while busy so moving over it doesn't swallow the gesture.
    function startPointerAction(event, onMove) {
        event.preventDefault();
        const target = event.currentTarget;
        const startX = event.clientX;
        const startY = event.clientY;
        const start = { ...layout };
        target.setPointerCapture(event.pointerId);
        panel.box.classList.add("is-busy");

        const move = (moveEvent) => {
            onMove(moveEvent.clientX - startX, moveEvent.clientY - startY, start);
            applyLayout();
        };
        const end = () => {
            target.removeEventListener("pointermove", move);
            target.removeEventListener("pointerup", end);
            target.removeEventListener("pointercancel", end);
            panel.box.classList.remove("is-busy");
            saveLocal({ layout });
        };
        target.addEventListener("pointermove", move);
        target.addEventListener("pointerup", end);
        target.addEventListener("pointercancel", end);
    }

    function resizeFromEdge(edge, dx, dy, start) {
        if (edge.includes("e")) {
            layout.width = clamp(
                start.width + dx,
                MIN_WIDTH,
                window.innerWidth - start.left
            );
        }
        if (edge.includes("w")) {
            const right = start.left + start.width;
            const width = clamp(start.width - dx, MIN_WIDTH, right);
            layout.width = width;
            layout.left = right - width;
        }
        if (edge.includes("s")) {
            layout.height = clamp(
                start.height + dy,
                MIN_HEIGHT,
                window.innerHeight - start.top
            );
        }
    }

    function handleKeyboardMove(event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleAction("toggle");
            return;
        }
        const delta = {
            ArrowLeft: [-KEY_STEP, 0],
            ArrowRight: [KEY_STEP, 0],
            ArrowUp: [0, -KEY_STEP],
            ArrowDown: [0, KEY_STEP],
        }[event.key];
        if (!delta) {
            return;
        }
        event.preventDefault();
        if (event.shiftKey) {
            layout.width = Math.max(MIN_WIDTH, layout.width + delta[0]);
            layout.height = Math.max(MIN_HEIGHT, layout.height + delta[1]);
        } else {
            layout.left += delta[0];
            layout.top += delta[1];
        }
        applyLayout();
        saveLocal({ layout });
    }

    function createPanel() {
        const host = document.createElement("div");
        host.id = PANEL_ID;
        const root = host.attachShadow({ mode: "open" });
        root.innerHTML = `
            <style>${PANEL_STYLES}</style>
            <section class="panel" aria-label="Twitch chat">
                <div class="bar">
                    <div class="handle" tabindex="0" role="button"
                        aria-roledescription="drag handle"
                        aria-label="Move chat panel. Arrow keys move,
                            Shift and arrow keys resize, Enter minimizes.">
                        <span class="dot"></span>
                        <span class="name"></span>
                    </div>
                    ${actionButtons()}
                    <button type="button" class="icon-button"
                        data-action="toggle">${icon("toggle")}</button>
                </div>
                <div class="body">
                    <iframe title="Twitch chat"
                        allow="clipboard-write"></iframe>
                </div>
                <div class="grip" data-edge="w"></div>
                <div class="grip" data-edge="e"></div>
                <div class="grip" data-edge="s"></div>
                <div class="grip" data-edge="sw"></div>
                <div class="grip is-wide" data-edge="sw"></div>
                <div class="grip" data-edge="se"></div>
                <div class="grip is-wide" data-edge="se"></div>
            </section>
        `;

        panel = {
            host,
            box: root.querySelector(".panel"),
            bar: root.querySelector(".bar"),
            handle: root.querySelector(".handle"),
            name: root.querySelector(".name"),
            toggle: root.querySelector('[data-action="toggle"]'),
            iframe: root.querySelector("iframe"),
        };

        panel.bar.addEventListener("pointerdown", (event) => {
            if (event.button !== 0 || event.target.closest("button")) {
                return;
            }
            startPointerAction(event, (dx, dy, start) => {
                layout.left = start.left + dx;
                layout.top = start.top + dy;
            });
        });
        panel.bar.addEventListener("dblclick", (event) => {
            if (!event.target.closest("button")) {
                handleAction("toggle");
            }
        });
        panel.handle.addEventListener("keydown", handleKeyboardMove);

        for (const button of root.querySelectorAll("[data-action]")) {
            button.addEventListener("click", () => {
                handleAction(button.dataset.action, panel.iframe);
            });
        }

        for (const grip of root.querySelectorAll(".grip")) {
            grip.addEventListener("pointerdown", (event) => {
                if (event.button !== 0) {
                    return;
                }
                startPointerAction(event, (dx, dy, start) => {
                    resizeFromEdge(grip.dataset.edge, dx, dy, start);
                });
            });
        }
    }

    function mountPanel() {
        if (!panel) {
            createPanel();
        }
        if (!panel.host.isConnected) {
            document.body.append(panel.host);
            applyLayout();
        }
        updateFrame(panel.iframe);
        panel.name.textContent = channel;
        panel.box.dataset.theme = settings.theme;
    }

    function unmountPanel() {
        panel?.host.remove();
    }

    // ---- Docked into Patreon's chat ----

    function findChatColumn() {
        for (const header of document.querySelectorAll(PATREON_CHAT_HEADER)) {
            const column = header.parentElement;
            if (
                column &&
                column.getClientRects().length > 0 &&
                getComputedStyle(column).visibility !== "hidden"
            ) {
                return column;
            }
        }
        return null;
    }

    // Hides Patreon's chat (everything in the column except our tabs) while
    // the Twitch tab is selected. Uses an attribute React doesn't manage.
    function ensurePageStyles() {
        if (document.getElementById(PAGE_STYLE_ID)) {
            return;
        }
        const style = document.createElement("style");
        style.id = PAGE_STYLE_ID;
        style.textContent =
            `[${TAB_ATTRIBUTE}="twitch"] > :not(#${DOCK_ID}) ` +
            "{ display: none !important; }";
        document.head.append(style);
    }

    function isDockChatShown() {
        return Boolean(dock?.host.isConnected) && dockTab === "twitch";
    }

    // Patreon's chat sidebar from the column up to the element that sits next
    // to the video, or [] on phone-sized layouts where chat isn't a sidebar.
    function sidebarChain(column) {
        const width = column.getBoundingClientRect().width;
        if (NARROW_QUERY.matches || width > window.innerWidth * 0.7) {
            return [];
        }
        const chain = [column];
        for (
            let element = column.parentElement;
            element && chain.length < 8;
            element = element.parentElement
        ) {
            if (Math.abs(element.getBoundingClientRect().width - width) >= 1) {
                break;
            }
            chain.push(element);
        }
        return chain;
    }

    function maxDockWidth() {
        return Math.max(
            DOCK_MIN_WIDTH,
            Math.min(DOCK_MAX_WIDTH, window.innerWidth - VIDEO_MIN_WIDTH)
        );
    }

    // Patreon sizes the sidebar in more than one place (a 500px chat box in a
    // flex wrapper next to the video, which takes the rest), so the width is
    // set on every element of the chain.
    function applyDockWidth() {
        const chain = dockWidth === null ? [] : dock.chain;
        const value = `${clamp(dockWidth, DOCK_MIN_WIDTH, maxDockWidth())}px`;
        for (const element of widthOverrides) {
            if (!chain.includes(element)) {
                for (const property of WIDTH_PROPERTIES) {
                    element.style.removeProperty(property);
                }
                widthOverrides.delete(element);
            }
        }
        for (const element of chain) {
            if (element.style.getPropertyValue("width") === value) {
                continue;
            }
            for (const property of WIDTH_PROPERTIES) {
                element.style.setProperty(property, value, "important");
            }
            widthOverrides.add(element);
        }
    }

    function setDockWidth(width) {
        dockWidth =
            width === null
                ? null
                : clamp(Math.round(width), DOCK_MIN_WIDTH, maxDockWidth());
        applyDockWidth();
    }

    function saveDockWidth() {
        try {
            if (dockWidth === null) {
                ext.storage.local.remove("dockWidth");
            } else {
                ext.storage.local.set({ dockWidth });
            }
        } catch {
            // Extension was reloaded; this page's script is orphaned.
        }
    }

    function placeElement(element, { left, top, width, height }) {
        Object.assign(element.style, {
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
        });
    }

    // Keeps the chat layer over the slot below the tabs and the resize handle
    // along the sidebar's left edge, following Patreon's layout frame by
    // frame while docked.
    function trackDock() {
        dockTrackingFrame = 0;
        if (!dock?.host.isConnected) {
            return;
        }
        const slot = isDockChatShown() ? dock.slot.getBoundingClientRect() : null;
        const area = dock.chain.at(-1)?.getBoundingClientRect() ?? null;
        const box = JSON.stringify([slot, area]);
        if (box !== dock.box) {
            dock.box = box;
            if (slot) {
                placeElement(dock.frame, slot);
            }
            dock.resizer.hidden = !area;
            if (area) {
                placeElement(dock.resizer, {
                    left: area.left - RESIZER_WIDTH,
                    top: area.top,
                    width: RESIZER_WIDTH,
                    height: area.height,
                });
                dock.resizer.setAttribute(
                    "aria-valuenow",
                    String(Math.round(area.width))
                );
                dock.resizer.setAttribute("aria-valuemax", String(maxDockWidth()));
            }
        }
        dockTrackingFrame = requestAnimationFrame(trackDock);
    }

    function applyDockTab() {
        dock.host.dataset.tab = dockTab;
        dock.host.parentElement?.setAttribute(TAB_ATTRIBUTE, dockTab);
        for (const tab of dock.tabs) {
            const isSelected = tab.dataset.tab === dockTab;
            tab.setAttribute("aria-selected", String(isSelected));
            tab.tabIndex = isSelected ? 0 : -1;
        }
        dock.frame.hidden = !isDockChatShown();
        if (!dockTrackingFrame) {
            trackDock();
        }
    }

    function startDockResize(event) {
        if (event.button !== 0) {
            return;
        }
        event.preventDefault();
        const { resizer, shield } = dock;
        const startX = event.clientX;
        const startWidth = dock.chain.at(-1).getBoundingClientRect().width;
        resizer.setPointerCapture(event.pointerId);
        resizer.classList.add("is-dragging");
        shield.hidden = false;

        // The sidebar is on the right, so dragging left makes it wider.
        const move = (moveEvent) => {
            setDockWidth(startWidth + startX - moveEvent.clientX);
        };
        const end = () => {
            resizer.removeEventListener("pointermove", move);
            resizer.removeEventListener("pointerup", end);
            resizer.removeEventListener("pointercancel", end);
            resizer.classList.remove("is-dragging");
            shield.hidden = true;
            saveDockWidth();
        };
        resizer.addEventListener("pointermove", move);
        resizer.addEventListener("pointerup", end);
        resizer.addEventListener("pointercancel", end);
    }

    function handleResizerKey(event) {
        const currentWidth = dock.chain.at(-1)?.getBoundingClientRect().width;
        if (!currentWidth) {
            return;
        }
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            const step = event.key === "ArrowLeft" ? KEY_STEP : -KEY_STEP;
            setDockWidth(currentWidth + step);
            saveDockWidth();
        } else if (event.key === "Enter") {
            event.preventDefault();
            setDockWidth(null);
            saveDockWidth();
        }
    }

    function selectDockTab(tab) {
        dockTab = tab;
        applyDockTab();
        saveLocal({ dockTab });
    }

    function createDock() {
        const host = document.createElement("div");
        host.id = DOCK_ID;
        const root = host.attachShadow({ mode: "open" });
        root.innerHTML = `
            <style>${DOCK_STYLES}</style>
            <div class="tabs" role="tablist" aria-label="Chat">
                <button type="button" role="tab"
                    data-tab="patreon">Patreon</button>
                <button type="button" role="tab"
                    data-tab="twitch">Twitch</button>
                <div class="actions">${actionButtons()}</div>
            </div>
            <div class="slot"></div>
        `;

        const layer = document.createElement("div");
        layer.id = DOCK_CHAT_ID;
        const layerRoot = layer.attachShadow({ mode: "open" });
        layerRoot.innerHTML = `
            <style>${DOCK_CHAT_STYLES}</style>
            <div class="frame" role="region" aria-label="Twitch chat" hidden>
                <iframe title="Twitch chat" allow="clipboard-write"></iframe>
            </div>
            <div class="resizer" tabindex="0" role="separator"
                aria-orientation="vertical" aria-label="Resize chat. Arrow
                    keys change the width, Enter resets it."
                aria-valuemin="${DOCK_MIN_WIDTH}"
                title="Drag to resize, double-click to reset" hidden></div>
            <div class="shield" hidden></div>
        `;

        dock = {
            host,
            tabs: [...root.querySelectorAll('[role="tab"]')],
            slot: root.querySelector(".slot"),
            layer,
            frame: layerRoot.querySelector(".frame"),
            iframe: layerRoot.querySelector("iframe"),
            resizer: layerRoot.querySelector(".resizer"),
            shield: layerRoot.querySelector(".shield"),
            chain: [],
            box: "",
        };

        dock.resizer.addEventListener("pointerdown", startDockResize);
        dock.resizer.addEventListener("keydown", handleResizerKey);
        dock.resizer.addEventListener("dblclick", () => {
            setDockWidth(null);
            saveDockWidth();
        });

        for (const tab of dock.tabs) {
            tab.addEventListener("click", () => selectDockTab(tab.dataset.tab));
            tab.addEventListener("keydown", (event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                    return;
                }
                event.preventDefault();
                const other = dock.tabs.find((candidate) => candidate !== tab);
                other.focus();
                selectDockTab(other.dataset.tab);
            });
        }

        for (const button of root.querySelectorAll("[data-action]")) {
            button.addEventListener("click", () => {
                handleAction(button.dataset.action, dock.iframe);
            });
        }
    }

    // Takes the tabs out of Patreon's chat but keeps the chat layer loaded
    // (hidden) in case Patreon is only re-rendering the column.
    function unmountDock() {
        if (!dock) {
            return;
        }
        dock.chain = [];
        applyDockWidth();
        dock.frame.hidden = true;
        dock.resizer.hidden = true;
        if (dock.host.isConnected) {
            dock.host.parentElement.removeAttribute(TAB_ATTRIBUTE);
            dock.host.remove();
        }
    }

    function mountDock(column) {
        if (!dock) {
            createDock();
        }
        if (dock.host.parentElement !== column) {
            unmountDock();
            column.prepend(dock.host);
        }
        if (!dock.layer.isConnected) {
            document.body.append(dock.layer);
        }
        ensurePageStyles();
        dock.chain = sidebarChain(column);
        applyDockWidth();
        applyDockTab();
        updateFrame(dock.iframe);
        dock.frame.dataset.theme = settings.theme;
    }

    // ---- Sync ----

    // Patreon is a single-page app that re-renders freely, so this runs on an
    // interval and on DOM changes: it re-mounts whatever was removed, docks
    // into Patreon's chat when it can, and otherwise floats.
    function sync() {
        const creator = parseCreator(location.href);
        channel = creator ? channelFor(creator, settings.channels) : null;
        const isVisible =
            settings.isEnabled &&
            Boolean(channel) &&
            (settings.isOnAllPages || isLivestreamPage());
        const column =
            isVisible && settings.placement === "dock" ? findChatColumn() : null;

        if (column) {
            dockMissingSince = 0;
            unmountPanel();
            mountDock(column);
            return;
        }
        unmountDock();
        if (!isVisible) {
            dockMissingSince = 0;
            unmountPanel();
            dock?.layer.remove();
            return;
        }
        // Patreon's chat loads after the page, so give it a moment before
        // falling back to the floating panel. On phone-sized layouts Patreon
        // opens its chat as a sheet over the video when asked, and the tabs
        // show up there, so a panel isn't put over the video meanwhile.
        if (settings.placement === "dock") {
            if (NARROW_QUERY.matches) {
                unmountPanel();
                return;
            }
            dockMissingSince ||= Date.now();
            if (Date.now() - dockMissingSince < DOCK_GRACE_MS) {
                unmountPanel();
                return;
            }
        }
        dock?.layer.remove();
        mountPanel();
    }

    function queueSync() {
        if (isSyncQueued || settings.placement !== "dock") {
            return;
        }
        isSyncQueued = true;
        requestAnimationFrame(() => {
            isSyncQueued = false;
            sync();
        });
    }

    ext.storage.onChanged.addListener((changes, area) => {
        if (area === "sync") {
            const next = { ...settings };
            for (const [key, { newValue }] of Object.entries(changes)) {
                next[key] = newValue ?? DEFAULT_SETTINGS[key];
            }
            settings = normalizeSettings(next);
            sync();
        } else if (area === "local" && changes.layout && !changes.layout.newValue) {
            layout = defaultLayout();
            if (panel?.host.isConnected) {
                applyLayout();
            }
        }
    });

    window.addEventListener("resize", () => {
        if (panel?.host.isConnected) {
            applyLayout();
        }
        queueSync();
    });

    Promise.all([
        ext.storage.sync.get(DEFAULT_SETTINGS),
        ext.storage.local.get(["layout", "dockTab", "dockWidth"]),
    ]).then(([stored, local]) => {
        settings = normalizeSettings(stored);
        layout = { ...defaultLayout(), ...local.layout };
        dockTab = local.dockTab === "patreon" ? "patreon" : "twitch";
        dockWidth = Number.isFinite(local.dockWidth) ? local.dockWidth : null;
        sync();
        setInterval(sync, 1000);
        new MutationObserver(queueSync).observe(document.body, {
            childList: true,
            subtree: true,
        });
    });
})();
