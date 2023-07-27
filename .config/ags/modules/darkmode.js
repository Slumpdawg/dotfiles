const { Widget } = ags;
const { Settings } = ags.Service;

Widget.widgets['darkmode/toggle'] = props => Widget({
    ...props,
    type: 'button',
    hexpand: true,
    onClick: () => Settings.darkmode = !Settings.darkmode,
    connections: [[Settings, button => {
        button.toggleClassName('on', Settings.darkmode);
    }]],
});

Widget.widgets['darkmode/indicator'] = props => Widget({
    ...props,
    type: 'stack',
    items: [
        ['on', { type: 'icon', icon: 'weather-clear-symbolic' }],
        ['off', { type: 'icon', icon: 'weather-clear-night-symbolic' }],
    ],
    connections: [[Settings, stack => stack.showChild(Settings.darkmode ? 'on' : 'off')]],
});
