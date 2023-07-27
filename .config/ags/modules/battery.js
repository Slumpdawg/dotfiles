const { Widget } = ags;
const { Battery } = ags.Service;

function _default(charging) {
    const items = [];
    for (let i = 0; i <= 90; i += 10) {
        items.push([`${i}`, {
            type: 'icon',
            className: `${i} ${charging ? 'charging' : 'discharging'}`,
            icon: `battery-level-${i}${charging ? '-charging' : ''}-symbolic`,
        }]);
    }
    items.push(['100', {
        type: 'icon',
        className: `100 ${charging ? 'charging' : 'discharging'}`,
        icon: `battery-level-100${charging ? '-charged' : ''}-symbolic`,
    }]);
    return items.reverse();
}

const _indicators = items => Widget({
    type: 'stack',
    items,
    connections: [[Battery, stack => {
        stack.showChild(`${Math.floor(Battery.percent / 10) * 10}`);
    }]],
});

Widget.widgets['battery/indicator'] = ({
    charging = _indicators(_default(true)),
    discharging = _indicators(_default(false)),
    ...props
}) => Widget({
    ...props,
    type: 'stack',
    items: [
        ['true', charging],
        ['false', discharging],
    ],
    connections: [[Battery, stack => {
        const { charging, charged } = Battery;
        stack.showChild(`${charging || charged}`);
        stack.toggleClassName('charging', Battery.charging);
        stack.toggleClassName('charged', Battery.charged);
        stack.toggleClassName('low', Battery.percent < 30);
    }]],
});

Widget.widgets['battery/level-label'] = props => Widget({
    ...props,
    type: 'label',
    connections: [[Battery, label => label.label = `${Battery.percent}`]],
});

Widget.widgets['battery/progress'] = props => Widget({
    ...props,
    type: 'progressbar',
    connections: [[Battery, progress => {
        progress.fraction = Battery.percent / 100;
        progress.toggleClassName('charging', Battery.charging);
        progress.toggleClassName('charged', Battery.charged);
        progress.toggleClassName('low', Battery.percent < 30);
    }]],
});
