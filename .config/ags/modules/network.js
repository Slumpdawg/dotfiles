const { Widget } = ags;
const { Network } = ags.Service;

const icons = [
    ['100', { type: 'icon', icon: 'network-wireless-signal-excellent-symbolic' }],
    ['80', { type: 'icon', icon: 'network-wireless-signal-excellent-symbolic' }],
    ['60', { type: 'icon', icon: 'network-wireless-signal-good-symbolic' }],
    ['40', { type: 'icon', icon: 'network-wireless-signal-ok-symbolic' }],
    ['20', { type: 'icon', icon: 'network-wireless-signal-weak-symbolic' }],
    ['0', { type: 'icon', icon: 'network-wireless-signal-none-symbolic' }],
];

Widget.widgets['network/ssid-label'] = props => Widget({
    ...props,
    type: 'label',
    connections: [[Network, label => label.label = Network.wifi?.ssid || 'Not Connected']],
});

Widget.widgets['network/wifi-strength-label'] = props => Widget({
    ...props,
    type: 'label',
    connections: [[Network, label => label.label = `${Network.wifi?.strength || -1}`]],
});

Widget.widgets['network/wired-indicator'] = ({
    connecting = { type: 'icon', icon: 'network-wired-acquiring-symbolic' },
    disconnected = { type: 'icon', icon: 'network-wired-no-route-symbolic' },
    disabled = { type: 'icon', icon: 'network-wired-disconnected-symbolic' },
    connected = { type: 'icon', icon: 'network-wired-symbolic' },
    unknown = { type: 'icon', icon: 'content-loading-symbolic' },
}) => Widget({
    type: 'stack',
    items: [
        ['unknown', unknown],
        ['disconnected', disconnected],
        ['disabled', disabled],
        ['connected', connected],
        ['connecting', connecting],
    ],
    connections: [[Network, stack => stack.showChild(() => {
        if (!Network.wired)
            return 'unknown';

        const { internet } = Network.wired;
        if (internet === 'connected' || internet === 'connecting')
            internet;

        if (Network.connectivity !== 'full')
            'disconnected';

        return 'disabled';
    })]],
});

Widget.widgets['network/wifi-indicator'] = ({
    disabled = { type: 'icon', icon: 'network-wireless-disabled-symbolic' },
    disconnected = { type: 'icon', icon: 'network-wireless-offline-symbolic' },
    connecting = { type: 'icon', icon: 'network-wireless-acquiring-symbolic' },
    connected = icons,
}) => Widget({
    type: 'stack',
    items: [
        ['disabled', disabled],
        ['disconnected', disconnected],
        ['connecting', connecting],
        ...connected,
    ],
    connections: [[Network, stack => stack.showChild(() => {
        if (!Network.wifi)
            return 'disabled';

        const { internet, enabled, strength } = Network.wifi;
        if (internet === 'connected')
            return `${Math.floor(strength / 20) * 20}`;

        if (internet === 'connecting')
            return 'connecting';

        if (enabled)
            return 'disconnected';

        return 'disabled';
    })]],
});

Widget.widgets['network/indicator'] = ({
    wifi = { type: 'network/wifi-indicator' },
    wired = { type: 'network/wired-indicator' },
}) => Widget({
    type: 'stack',
    items: [
        ['wired', wired],
        ['wifi', wifi],
    ],
    connections: [[Network, stack => {
        stack.showChild(Network.primary || 'wifi');
    }]],
});

Widget.widgets['network/wifi-toggle'] = props => Widget({
    ...props,
    type: 'button',
    onClick: Network.toggleWifi,
    connections: [[Network, button => {
        button.toggleClassName('on', Network.wifi?.enabled);
    }]],
});

Widget.widgets['network/wifi-selection'] = props => Widget({
    ...props,
    type: 'box',
    orientation: 'vertical',
    connections: [[Network, box => {
        box.removeChildren();
        Network.wifi?.accessPoints.forEach(ap => {
            box.append(Widget({
                type: 'button',
                child: {
                    type: 'box',
                    children: [
                        icons.find(([value]) => Number(value) <= ap.strength).widget,
                        {
                            type: 'label',
                            label: ap.ssid,
                        },
                        ap.active ? {
                            type: 'icon',
                            icon: 'object-select-symbolic',
                            hexpand: true,
                            halign: 'end',
                        } : null,
                    ].filter(i => i),
                },
                onClick: `nmcli device wifi connect ${ap.bssid}`,
            }));
        });
    }]],
});
