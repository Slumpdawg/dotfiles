const { GLib } = imports.gi;
const { Notifications } = ags.Service;
const { lookUpIcon, timeout } = ags.Utils;
const { Widget } = ags;

const _icon = ({ appEntry, appIcon, image }) => {
    if (image) {
        return {
            type: 'box',
            style: `
                background-image: url(file://${image});
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
            `,
        };
    }

    let icon = 'dialog-information-symbolic';
    if (lookUpIcon(appIcon))
        icon = appIcon;

    if (lookUpIcon(appEntry))
        icon = appEntry;

    return {
        type: 'box',
        hexpand: false,
        children: [{
            type: 'icon', icon,
            halign: 'center', hexpand: true,
            valign: 'center', vexpand: true,
        }],
    };
};

const notification = ({ id, summary, body, actions, urgency, time, ...icon }) => Widget({
    type: 'box',
    className: `notification ${urgency}`,
    onHoverLeave: () => Notifications.dismiss(id),
    vexpand: false,
    orientation: 'vertical',
    children: [
        {
            type: 'box',
            hexpand: false,
            children: [
                {
                    className: 'icon',
                    valign: 'start',
                    hexpand: false,
                    vexpand: true,
                    ..._icon(icon),
                },
                {
                    type: 'box',
                    hexpand: true,
                    orientation: 'vertical',
                    children: [
                        {
                            type: 'box',
                            children: [
                                {
                                    className: 'title',
                                    xalign: 0,
                                    justify: 'left',
                                    hexpand: true,
                                    type: 'label',
                                    maxWidth: 24,
                                    wrap: true,
                                    label: summary,
                                },
                                {
                                    className: 'time',
                                    type: 'label',
                                    valign: 'start',
                                    label: GLib.DateTime.new_from_unix_local(time).format('%H:%M'),
                                },
                                {
                                    className: 'close-button',
                                    type: 'button',
                                    valign: 'start',
                                    child: Widget({ type: 'icon', icon: 'window-close-symbolic' }),
                                    onClick: () => Notifications.close(id),
                                },
                            ],
                        },
                        {
                            className: 'description',
                            hexpand: true,
                            markup: true,
                            xalign: 0,
                            justify: 'left',
                            type: 'label',
                            label: body.split(' ').map(word =>
                                word.split('').map((ch, i) => (i + 1) % 24 === 0 ? ch + ' ' : ch).join(''),
                            ).join(' '),
                            wrap: true,
                        },
                    ],
                },
            ],
        },
        {
            type: 'box',
            className: 'actions',
            children: actions.map(action => ({
                className: 'action-button',
                type: 'button',
                onClick: () => Notifications.invoke(id, action.id),
                hexpand: true,
                child: action.label,
            })),
        },
    ],
});

Widget.widgets['notifications/notification-list'] = props => Widget({
    ...props,
    type: 'box',
    orientation: 'vertical',
    connections: [[Notifications, box => {
        box.removeChildren();
        for (const [, n] of Notifications.notifications)
            box.append(notification(n));
    }]],
});

Widget.widgets['notifications/popup-list'] = ({ transition = 'slide_down' }) => Widget({
    type: 'revealer',
    transition,
    className: 'notifications-popup-list',
    connections: [[Notifications, revealer => {
        revealer.reveal_child = Notifications.popups.size > 0;
    }]],
    setup: w => w.reveal_child = true,
    child: {
        type: 'box',
        orientation: 'vertical',
        properties: [
            ['map', new Map()],
            ['close', (box, id) => {
                if (!id || !box._map.has(id))
                    return;

                timeout(200, () => {
                    box.remove(box._map.get(id));
                    box._map.delete(id);
                });
            }],
        ],
        connections: [
            [Notifications, (box, id) => {
                if (!id)
                    return;

                if (box._map.has(id)) {
                    box.remove(box._map.get(id));
                    box._map.delete(id);
                }

                const widget = notification(Notifications.notifications.get(id));
                box._map.set(id, widget);
                box.append(widget);
            }, 'notified'],
            [Notifications, (box, id) => box._close(box, id), 'dismissed'],
            [Notifications, (box, id) => box._close(box, id), 'closed'],
        ],
    },
});

Widget.widgets['notifications/placeholder'] = props => Widget({
    ...props,
    type: 'box',
    connections: [
        [Notifications, box => box.visible = Notifications.notifications.size === 0],
    ],
});

Widget.widgets['notifications/clear-button'] = props => Widget({
    ...props,
    type: 'button',
    onClick: Notifications.clear,
    connections: [[Notifications, button => button.sensitive = Notifications.notifications.size > 0]],
    child: {
        type: 'box',
        children: [
            'Clear ',
            {
                type: 'stack',
                items: [
                    ['full', { type: 'icon', icon: 'user-trash-full-symbolic' }],
                    ['empty', { type: 'icon', icon: 'user-trash-symbolic' }],
                ],
                connections: [
                    [Notifications, stack => stack.showChild(
                        Notifications.notifications.size > 0 ? 'full' : 'empty',
                    )],
                ],
            },
        ],
    },
});

Widget.widgets['notifications/dnd-indicator'] = ({
    silent = Widget({ type: 'icon', icon: 'notifications-disabled-symbolic' }),
    noisy = Widget({ type: 'icon', icon: 'preferences-system-notifications-symbolic' }),
}) => Widget({
    type: 'stack',
    items: [
        ['true', silent],
        ['false', noisy],
    ],
    connections: [[Notifications, stack => stack.showChild(`${Notifications.dnd}`)]],
});

Widget.widgets['notifications/dnd-toggle'] = props => Widget({
    ...props,
    type: 'button',
    onClick: () => { Notifications.dnd = !Notifications.dnd; },
    connections: [[Notifications, button => {
        button.toggleClassName('on', Notifications.dnd);
    }]],
});
