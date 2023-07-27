const { Widget } = ags;
const { timeout, exec } = ags.Utils;
const { Settings } = ags.Service;

Widget.widgets['separator'] = props => Widget({
    ...props,
    type: 'box',
    className: 'separator',
});

Widget.widgets['font-icon'] = ({
    icon,
}) => Widget({
    type: 'box',
    hexpand: false, vexpand: false,
    className: 'font-icon',
    children: [{
        type: 'overlay',
        child: {
            hexpand: true, vexpand: true,
            type: 'box',
            className: 'size-box',
        },
        overlays: [{
            type: 'label',
            label: icon,
            halign: 'center', valign: 'center',
            clip: true,
        }],
    }],
});

Widget.widgets['distro-icon'] = props => Widget({
    ...props,
    type: 'font-icon',
    className: 'distro-icon',
    icon: (() => {
        // eslint-disable-next-line quotes
        const distro = exec(`bash -c "cat /etc/os-release | grep '^ID' | head -n 1 | cut -d '=' -f2"`)
            .trim().toLowerCase();
        switch (distro) {
        case 'fedora': return '';
        case 'arch': return '';
        case 'nixos': return '';
        case 'debian': return '';
        case 'opensuse-tumbleweed': return '';
        case 'ubuntu': return '';
        case 'endeavouros': return '';
        default: return '';
        }
    })(),
});

Widget.widgets['avatar'] = ({ child, ...props }) => Widget({
    ...props,
    type: 'box',
    className: 'image',
    connections: [[Settings, box => {
        box.setStyle(`
            background-image: url(file://${Settings.avatar});
            background-size: cover;
            `);
    }]],
    children: [{
        type: 'box',
        className: 'shader',
        hexpand: true,
        children: [child],
    }],
});

Widget.widgets['spinner'] = ({ icon = 'process-working-symbolic' }) => Widget({
    type: 'icon',
    icon,
    properties: [['deg', 0]],
    connections: [[10, w => {
        w.setStyle(`-gtk-icon-transform: rotate(${w._deg++ % 360}deg);`);
    }]],
});

Widget.widgets['progress'] = ({ height = 18, width = 180, vertical = false, child, ...props }) => {
    const fill = Widget({
        type: 'box',
        className: 'fill',
        hexpand: vertical,
        vexpand: !vertical,
        halign: vertical ? 'fill' : 'start',
        valign: vertical ? 'end' : 'fill',
        children: [{
            type: 'overlay',
            halign: 'end',
            valign: 'start',
            style: `
                min-width: ${vertical ? width : height}px;
                min-height: ${vertical ? width : height}px;
            `,
            child: {
                type: 'box',
                hexpand: true,
                vexpand: true,
            },
            overlays: [{
                type: 'box',
                children: [child],
                halign: 'center',
                valign: 'center',
            }],
        }],
    });
    const progress = Widget({
        ...props,
        type: 'box',
        className: 'progress',
        style: `
            min-width: ${width}px;
            min-height: ${height}px;
        `,
        children: [fill],
    });
    progress.setValue = value => {
        if (value < 0 || typeof value !== 'number')
            return;

        const axis = vertical ? 'height' : 'width';
        const axisv = vertical ? height : width;
        const min = vertical ? width : height;
        const max = vertical ? height : width;
        const preferred = Math.min((axisv - min) * value + min, max);

        if (!fill._size) {
            fill._size = preferred;
            fill.setStyle(`min-${axis}: ${preferred}px;`);
            return;
        }

        const frames = 10;
        const goal = preferred - fill._size;
        const step = goal / frames;

        for (let i = 0; i < frames; ++i) {
            timeout(5 * i, () => {
                fill._size += step;
                fill.setStyle(`min-${axis}: ${fill._size}px;`);
            });
        }
    };
    return progress;
};

Widget.widgets['hover-revealer'] = ({ indicator, child, direction = 'left', connection, duration = 300, ...rest }) => Widget({
    ...rest,
    type: 'box',
    onHoverEnter: w => {
        if (w._open)
            return;

        w[`get_${direction === 'down' || direction === 'right' ? 'last' : 'first'}_child`]().reveal_child = true;
        timeout(duration, () => w._open = true);
    },
    onHoverLeave: w => {
        if (!w._open)
            return;

        w[`get_${direction === 'down' || direction === 'right' ? 'last' : 'first'}_child`]().reveal_child = false;
        w._open = false;
    },
    orientation: direction === 'down' || direction === 'up' ? 'vertical' : 'horizontal',
    children: [
        direction === 'down' || direction === 'right' ? indicator : null,
        {
            type: 'revealer',
            transition: `slide_${direction}`,
            connections: connection ? [connection] : undefined,
            duration,
            child,
        },
        direction === 'up' || direction === 'left' ? indicator : null,
    ].filter(i => i),
});
