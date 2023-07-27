const { Widget } = ags;
const { Hyprland, Applications, Settings } = ags.Service;
const { timeout, execAsync } = ags.Utils;

const _appButton = (icon, tooltip) => ({
    type: 'button',
    // tooltips currently crash on Hyprland
    // tooltip,
    child: {
        type: 'box',
        children: [{
            type: 'overlay',
            child: typeof icon === 'string'
                ? {
                    type: 'icon',
                    icon,
                } : icon,
            overlays: [{
                type: 'box',
                className: 'indicator',
                valign: Settings.layout === 'unity' ? 'center' : 'end',
                halign: Settings.layout === 'unity' ? 'start' : 'center',
            }],
        }],
    },
});

const _pins = ({ list, orientation }) => ({
    type: 'box',
    homogeneous: true,
    orientation,
    children: list
        .map(([term, single]) => ({ app: Applications.query(term)?.[0], term, single }))
        .filter(({ app }) => app !== undefined)
        .map(({ app, term, single = true }) => ({
            ..._appButton(app.iconName, app.name),
            onClick: () => {
                if (!single)
                    return app.launch();

                for (const [, client] of Hyprland.clients) {
                    if (client.class.toLowerCase().includes(term))
                        return execAsync(`hyprctl dispatch focuswindow address:${client.address}`);
                }

                app.launch();
            },
            className: !single ? 'single' : '',
            connections: [[Hyprland, button => {
                if (!single)
                    return;

                let running = false;
                for (const [, client] of Hyprland.clients) {
                    if (client.class.toLowerCase().includes(term))
                        running = client;
                }

                button.toggleClassName('nonrunning', !running);
                button.toggleClassName('focused', Hyprland.active.client.address === running.address?.substring(2));
                // button.set_tooltip_text(running ? running.title : app.name);
            }]],
        })),
});

Widget.widgets['dock'] = ({
    launcher = 'view-app-grid-symbolic',
    orientation,
    ...props
}) => Widget({
    ...props,
    type: 'box',
    orientation,
    children: [
        ...(launcher ? [{
            onClick: () => ags.App.toggleWindow('applauncher'),
            ..._appButton(launcher, 'Applications'),
            className: 'launcher nonrunning',
        }] : []),
        _pins({
            orientation,
            list: [
                ['firefox', false],
                ['wezterm', false],
                ['nautilus'],
                ['spotify'],
                ['caprine'],
                ['discord'],
                ['transmission'],
                ['bottles'],
            ],
        }),
        {
            type: 'box',
            valign: 'center',
            className: 'separator',
            connections: [[Hyprland, box => {
                box.visible = !!box.get_parent().get_last_child().get_first_child();
            }]],
        },
        {
            type: 'hyprland/taskbar',
            orientation,
            skip: ['discord', 'caprine', 'nautilus', 'spotify', 'transmission'],
            item: ({ iconName }, { address, title }) => ({
                ..._appButton(iconName, title),
                className: Hyprland.active.client.address === address.substring(2) ? 'focused' : 'nonfocused',
                onClick: () => execAsync(`hyprctl dispatch focuswindow address:${address}`),
            }),
        },
    ],
});

Widget.widgets['floating-dock'] = () => Widget({
    transition: 'slide_up',
    style: 'padding: 3px; border-top: 3px solid transparent;',
    duration: 300,
    type: 'revealer',
    className: 'floating-dock',
    onHoverEnter: revealer => {
        timeout(300, () => revealer._revealed = true);
        revealer.reveal_child = true;
    },
    onHoverLeave: revealer => {
        if (!revealer._revealed)
            return;

        timeout(300, () => revealer._revealed = false);
        revealer.reveal_child = false;
    },
    child: { type: 'dock', className: 'dock' },
});
