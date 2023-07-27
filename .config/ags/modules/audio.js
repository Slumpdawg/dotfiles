const { Widget } = ags;
const { Audio } = ags.Service;

const iconSubstitute = item => {
    const substitues = [
        { from: 'audio-headset-bluetooth', to: 'audio-headphones-symbolic' },
        { from: 'audio-card-analog-usb', to: 'audio-speakers-symbolic' },
        { from: 'audio-card-analog-pci', to: 'audio-card-symbolic' },
    ];

    for (const { from, to } of substitues) {
        if (from === item)
            return to;
    }
    return item;
};

Widget.widgets['audio/speaker-indicator'] = ({
    items = [
        ['101', { type: 'icon', icon: 'audio-volume-overamplified-symbolic' }],
        ['67', { type: 'icon', icon: 'audio-volume-overamplified-symbolic' }],
        ['34', { type: 'icon', icon: 'audio-volume-medium-symbolic' }],
        ['1', { type: 'icon', icon: 'audio-volume-low-symbolic' }],
        ['0', { type: 'icon', icon: 'audio-volume-muted-symbolic' }],
    ],
    ...props
}) => Widget({
    ...props,
    type: 'stack',
    items,
    connections: [[Audio, stack => stack.showChild(() => {
        stack.visible = !!Audio.speaker;
        if (!Audio.speaker || Audio.speaker.isMuted)
            return '0';

        const vol = Audio.speaker.volume * 100;
        if (vol > 100)
            return '101';

        if (vol > 66)
            return '67';

        if (vol > 33)
            return '34';

        if (vol > 0)
            return '1';

        return '0';
    }), 'speaker-changed']],
});

Widget.widgets['audio/speaker-type-indicator'] = props => Widget({
    ...props,
    type: 'icon',
    connections: [[Audio, icon => {
        if (Audio.speaker)
            icon.icon_name = iconSubstitute(Audio.speaker.iconName);
    }]],
});

Widget.widgets['audio/speaker-percent-label'] = props => Widget({
    ...props,
    type: 'label',
    connections: [[Audio, label => {
        if (!Audio.speaker)
            return;

        label.label = `${Math.floor(Audio.speaker.volume * 100)}`;
    }, 'speaker-changed']],
});

Widget.widgets['audio/speaker-slider'] = props => Widget({
    ...props,
    type: 'slider',
    onChange: (_w, value) => Audio.speaker.volume = value,
    connections: [[Audio, slider => {
        if (!Audio.speaker)
            return;

        slider.sensitive = !Audio.speaker.isMuted;
        slider.adjustment.value = Audio.speaker.volume;
    }, 'speaker-changed']],
});

Widget.widgets['audio/microphone-mute-indicator'] = ({
    muted = Widget({ type: 'icon', icon: 'microphone-disabled-symbolic' }),
    unmuted = Widget({ type: 'icon', icon: 'microphone-sensitivity-high-symbolic' }),
    ...props
}) => Widget({
    ...props,
    type: 'stack',
    items: [
        ['muted', muted],
        ['unmuted', unmuted],
    ],
    connections: [[Audio, stack => stack.showChild(
        Audio.microphone?.isMuted ? 'muted' : 'unmuted',
    ), 'microphone-changed']],
});

Widget.widgets['audio/microphone-mute-toggle'] = props => Widget({
    ...props,
    type: 'button',
    onClick: 'pactl set-source-mute @DEFAULT_SOURCE@ toggle',
    connections: [[Audio, button => {
        if (!Audio.microphone)
            return;

        button.toggleClassName('on', Audio.microphone.isMuted);
    }, 'microphone-changed']],
});

Widget.widgets['audio/app-mixer'] = ({ item, ...props }) => {
    item ||= stream => {
        const icon = Widget({ type: 'icon' });
        const label = Widget({ type: 'label', xalign: 0, justify: 'left', wrap: true });
        const percent = Widget({ type: 'label', xalign: 1 });
        const slider = Widget({
            type: 'slider',
            hexpand: true,
            onChange: (_w, value) => stream.volume = value,
        });
        const box = Widget({
            type: 'box',
            hexpand: true,
            children: [
                icon,
                Widget({
                    type: 'box',
                    children: [
                        {
                            type: 'box',
                            orientation: 'vertical',
                            children: [
                                label,
                                slider,
                            ],
                        },
                        percent,
                    ],
                }),
            ],
        });
        box.update = () => {
            icon.icon_name = stream.iconName;
            // icon.set_tooltip_text(stream.name);
            slider.set_value(stream.volume);
            percent.label = `${Math.floor(stream.volume * 100)}%`;
            stream.description?.length > 40
                ? label.label = stream.description.substring(0, 40) + '..'
                : label.label = stream.description || '';
        };
        return box;
    };

    return Widget({
        ...props,
        type: 'box',
        orientation: 'vertical',
        connections: [[Audio, box => {
            box.removeChildren();
            for (const [, stream] of Audio.apps) {
                const app = item(stream);
                box.append(app);
                const id = stream.connect('changed', () => app.update());
                app.connect('destroy', () => stream.disconnect(id));
                app.update();
            }
        }]],
    });
};

Widget.widgets['audio/stream-selector'] = ({ streams = 'speakers', ...props }) => Widget({
    ...props,
    type: 'box',
    orientation: 'vertical',
    connections: [[Audio, box => {
        box.removeChildren();
        for (const [, stream] of Audio[streams]) {
            box.append(Widget({
                type: 'button',
                child: {
                    type: 'box',
                    children: [
                        {
                            type: 'icon',
                            icon: iconSubstitute(stream.iconName),
                            // tooltip: stream.iconName,
                        },
                        {
                            type: 'label',
                            label: stream.description.split(' ').slice(0, 4).join(' '),
                        },
                        {
                            type: 'icon',
                            icon: 'object-select-symbolic',
                            hexpand: true,
                            halign: 'end',
                            visible: Audio.speaker === stream,
                        },
                    ],
                },
                onClick: () => {
                    if (streams === 'speakers')
                        Audio.speaker = stream;

                    if (streams === 'microphones')
                        Audio.microphone = stream;
                },
            }));
        }
    }]],
});
