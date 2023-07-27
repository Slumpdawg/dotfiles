const { App, Widget } = ags;

const padding = windowName => ({
    type: 'box',
    className: 'padding',
    hexpand: true,
    vexpand: true,
    onButtonPressed: () => App.toggleWindow(windowName),
});

const revealer = (windowName, transition, child) => ({
    type: 'revealer',
    style: 'padding: 1px;',
    transition,
    child,
    duration: 350,
    connections: [[App, (revealer, name, visible) => {
        if (name === windowName)
            revealer.reveal_child = visible;
    }]],
});

const layouts = {
    'center': (windowName, child) => ({
        type: 'centerbox',
        className: 'shader',
        startWidget: padding(windowName),
        endWidget: padding(windowName),
        centerWidget: {
            type: 'centerbox',
            orientation: 'vertical',
            startWidget: padding(windowName),
            centerWidget: child,
            endWidget: padding(windowName),
        },
    }),
    'top': (windowName, child) => ({
        type: 'centerbox',
        startWidget: padding(windowName),
        endWidget: padding(windowName),
        centerWidget: {
            type: 'box',
            orientation: 'vertical',
            halign: 'center',
            children: [
                revealer(windowName, 'slide_down', child),
                padding(windowName),
            ],
        },
    }),
    'topright': (windowName, child) => ({
        type: 'box',
        children: [
            padding(windowName),
            {
                type: 'box',
                hexpand: false,
                orientation: 'vertical',
                children: [
                    revealer(windowName, 'slide_down', child),
                    padding(windowName),
                ],
            },
        ],
    }),
    'bottomright': (windowName, child) => ({
        type: 'box',
        children: [
            padding(windowName),
            {
                type: 'box',
                hexpand: false,
                orientation: 'vertical',
                children: [
                    padding(windowName),
                    revealer(windowName, 'slide_up', child),
                ],
            },
        ],
    }),
};

Widget.widgets['popup'] = ({ layout, windowName, child }) => Widget({
    ...layouts[layout](windowName, child),
    onKeyPressed: (_w, key) => {
        if (key === imports.gi.Gdk.KEY_Escape) {
            App.closeWindow(windowName);
            return true;
        }
    },
});
