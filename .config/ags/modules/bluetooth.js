const { Widget } = ags;
const { Bluetooth } = ags.Service;

Widget.widgets['bluetooth/indicator'] = ({
    enabled = { type: 'icon', icon: 'bluetooth-active-symbolic', className: 'enabled' },
    disabled = { type: 'icon', icon: 'bluetooth-disabled-symbolic', className: 'disabled' },
    ...props
}) => Widget({
    ...props,
    type: 'stack',
    items: [
        ['enabled', enabled],
        ['disabled', disabled],
    ],
    connections: [[Bluetooth, stack => stack.showChild(Bluetooth.enabled ? 'enabled' : 'disabled')]],
});

Widget.widgets['bluetooth/toggle'] = props => Widget({
    ...props,
    type: 'button',
    onClick: () => Bluetooth.enabled = !Bluetooth.enabled,
    connections: [[Bluetooth, button => button.toggleClassName('on', Bluetooth.enabled)]],
});

Widget.widgets['bluetooth/label'] = props => Widget({
    ...props,
    type: 'label',
    connections: [[Bluetooth, label => {
        if (!Bluetooth.enabled)
            return label.label = 'Disabled';

        if (Bluetooth.connectedDevices.size === 0)
            return label.label = 'Not Connected';

        if (Bluetooth.connectedDevices.size === 1)
            return label.label = Bluetooth.connectedDevices.entries().next().value[1].alias;

        label.label = `${Bluetooth.connectedDevices.size} Connected`;
    }]],
});

Widget.widgets['bluetooth/devices'] = props => Widget({
    ...props,
    type: 'box',
    orientation: 'vertical',
    connections: [[Bluetooth, box => {
        box.removeChildren();
        for (const [, device] of Bluetooth.devices) {
            box.append(Widget({
                type: 'box',
                hexpand: false,
                children: [
                    {
                        type: 'icon',
                        icon: device.iconName + '-symbolic',
                    },
                    {
                        type: 'label',
                        label: device.name,
                    },
                    { type: 'box', hexpand: true },
                    device._connecting ? { type: 'spinner' } : {
                        type: 'switch',
                        active: device.connected,
                        onActivate: ({ active }) => device.setConnection(active),
                    },
                ],
            }));
        }
    }]],
});
