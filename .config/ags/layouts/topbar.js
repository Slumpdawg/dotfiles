const Shared = imports.layouts.shared;

// static windows
const dock = Shared.dock;
const notifications = monitor => Shared.notifications(monitor, 'slide_down', 'top');
const desktop = Shared.desktop;
const corners = Shared.corners;

// popups
const dashboard = {
    name: 'dashboard',
    visible: false,
    focusable: true,
    anchor: 'top bottom right left',
    child: {
        type: 'popup',
        layout: 'top',
        windowName: 'dashboard',
        child: { type: 'dashboard/popup-content' },
    },
};

const quicksettings = {
    name: 'quicksettings',
    visible: false,
    focusable: true,
    anchor: 'top bottom right left',
    child: {
        type: 'popup',
        layout: 'topright',
        windowName: 'quicksettings',
        child: { type: 'quicksettings/popup-content' },
    },
};

// bar
const separator = { type: 'separator', valign: 'center' };

const left = {
    type: 'box',
    className: 'left',
    hexpand: true,
    children: [
        { type: 'overview/panel-button', className: 'launcher' },
        separator,
        { type: 'workspaces/panel-button', className: 'workspaces' },
        separator,
        { type: 'client', className: 'client panel-button' },
        { type: 'media/panel-indicator', className: 'media panel-button', hexpand: true, halign: 'end' },
    ],
};

const center = {
    type: 'box',
    className: 'center',
    children: [
        { type: 'dashboard/panel-button' },
    ],
};

const right = {
    type: 'box',
    className: 'right',
    hexpand: true,
    children: [
        { type: 'notifications/panel-indicator', direction: 'right', className: 'notifications panel-button' },
        { type: 'box', hexpand: true },
        { type: 'recorder/indicator-button', className: 'recorder panel-button' },
        { type: 'colorpicker', className: 'colorpicker panel-button' },
        separator,
        { type: 'quicksettings/panel-button' },
        separator,
        { type: 'powermenu/panel-button' },
    ],
};

const bar = monitor => ({
    name: `bar${monitor}`,
    monitor,
    anchor: 'top left right',
    exclusive: true,
    child: {
        type: 'centerbox',
        className: 'panel',
        startWidget: left,
        centerWidget: center,
        endWidget: right,
    },
});

/* exported windows */
var windows = [
    ...ags.Service.Hyprland.HyprctlGet('monitors').map(({ id }) => ([
        dock(id),
        notifications(id),
        desktop(id),
        bar(id),
        ...corners(id),
    ])).flat(),
    dashboard,
    quicksettings,
];
