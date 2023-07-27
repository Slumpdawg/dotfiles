const { Widget } = ags;
const { Mpris, Settings } = ags.Service;
const { GLib } = imports.gi;
const { MEDIA_CACHE_PATH, execAsync, ensureDirectory, lookUpIcon } = ags.Utils;

var prefer = players => {
    const preferred = Settings.preferredMpris;
    let last;
    for (const [name, mpris] of players) {
        if (name.includes(preferred))
            return mpris;

        last = mpris;
    }

    return last;
};

Widget.widgets['mpris/box'] = ({ player = prefer, ...props }) => {
    const box = Widget({
        ...props,
        type: 'box',
        connections: [[Mpris, box => box.visible = Mpris.getPlayer(player)]],
    });
    return box;
};

Widget.widgets['mpris/cover-art'] = ({ player = prefer, ...props }) => Widget({
    ...props,
    type: 'box',
    connections: [[Mpris, box => {
        const url = Mpris.getPlayer(player)?.coverPath;
        if (!url)
            return;

        box.setStyle(`background-image: url(file://${url});`);
    }]],
});

Widget.widgets['mpris/blurred-cover-art'] = ({ player = prefer, ...props }) => Widget({
    ...props,
    type: 'box',
    connections: [[Mpris, box => {
        const url = Mpris.getPlayer(player)?.coverPath;
        if (!url)
            return;

        const blurredPath = MEDIA_CACHE_PATH + '/blurred';
        const blurred = blurredPath +
            url.substring(MEDIA_CACHE_PATH.length);

        if (GLib.file_test(blurred, GLib.FileTest.EXISTS)) {
            box.setStyle(`background-image: url(file://${blurred});`);
            return;
        }

        ensureDirectory(blurredPath);
        execAsync(['convert', url, '-blur', '0x22', blurred], () => {
            box.setStyle(`background-image: url(file://${blurred});`);
        });
    }]],
});

Widget.widgets['mpris/title-label'] = ({ player = prefer, ...props }) => Widget({
    ...props,
    type: 'label',
    connections: [[Mpris, label => {
        label.label = Mpris.getPlayer(player)?.trackTitle || '';
    }]],
});

Widget.widgets['mpris/artist-label'] = ({ player = prefer, ...props }) => Widget({
    ...props,
    type: 'label',
    connections: [[Mpris, label => {
        label.label = Mpris.getPlayer(player)?.trackArtists.join(', ') || '';
    }]],
});

Widget.widgets['mpris/player-label'] = ({ player = prefer, ...props }) => Widget({
    ...props,
    type: 'label',
    connections: [[Mpris, label => {
        label.label = Mpris.getPlayer(player)?.identity || '';
    }]],
});

Widget.widgets['mpris/player-icon'] = ({ symbolic = false, player = prefer, ...props }) => Widget({
    ...props,
    type: 'icon',
    connections: [[Mpris, icon => {
        const name = `${Mpris.getPlayer(player)?.entry}${symbolic ? '-symbolic' : ''}`;
        lookUpIcon(name)
            ? icon.icon_name = name
            : icon.icon_name = 'audio-x-generic-symbolic';
    }]],
});

Widget.widgets['mpris/volume-slider'] = ({ player = prefer, ...props }) => Widget({
    ...props,
    type: 'slider',
    onChange: (_w, value) => {
        const mpris = Mpris.getPlayer(player);
        if (mpris && mpris.volume >= 0)
            Mpris.getPlayer(player).volume = value;
    },
    connections: [[Mpris, slider => {
        if (slider._dragging)
            return;

        const mpris = Mpris.getPlayer(player);
        slider.visible = mpris;
        if (mpris) {
            slider.visible = mpris.volume >= 0;
            slider.adjustment.value = mpris.volume;
        }
    }]],
});

Widget.widgets['mpris/volume-icon'] = ({ player = prefer, items }) => Widget({
    type: 'stack',
    items: items || [
        [67, { type: 'icon', label: 'audio-volume-high-symbolic' }],
        [34, { type: 'icon', label: 'audio-volume-medium-symbolic' }],
        [1, { type: 'icon', label: 'audio-volume-low-symbolic' }],
        [0, { type: 'icon', label: 'audio-volume-muted-symbolic' }],
    ],
    connections: [[Mpris, stack => {
        const mpris = Mpris.getPlayer(player);
        stack.visible = mpris?.volume >= 0;
        const value = mpris?.volume * 100;
        stack.showChild(() => {
            if (value > 66)
                return '67';
            if (value > 33)
                return '34';
            if (value > 0)
                return '1';
            return '0';
        });
    }]],
});

Widget.widgets['mpris/position-slider'] = ({ player = prefer, ...props }) => {
    const update = slider => {
        if (slider._dragging)
            return;

        const mpris = Mpris.getPlayer(player);
        slider.visible = mpris?.length > 0;
        if (mpris && mpris.length > 0)
            slider.adjustment.value = mpris.position / mpris.length;
    };
    return Widget({
        ...props,
        type: 'slider',
        onChange: (_w, value) => {
            const mpris = Mpris.getPlayer(player);
            if (mpris && mpris.length >= 0)
                Mpris.getPlayer(player).position = mpris.length * value;
        },
        connections: [
            [Mpris, update],
            [1000, update],
        ],
    });
};

function _lengthStr(length) {
    const min = Math.floor(length / 60);
    const sec0 = Math.floor(length % 60) < 10 ? '0' : '';
    const sec = Math.floor(length % 60);
    return `${min}:${sec0}${sec}`;
}

Widget.widgets['mpris/position-label'] = ({ player = prefer, ...props }) => {
    const update = label => {
        const mpris = Mpris.getPlayer(player);

        if (mpris && !label._binding) {
            label._binding = mpris.connect('position', (_, time) => {
                label.label = _lengthStr(time);
            });
            label.connect('destroy', () => {
                if (mpris)
                    mpris.disconnect(label._binding);

                label._binding = null;
            });
        }

        mpris && mpris.length > 0
            ? label.label = _lengthStr(mpris.position)
            : label.visible = mpris;

        return true;
    };

    return Widget({
        ...props,
        type: 'label',
        connections: [
            [Mpris, update],
            [1000, update],
        ],
    });
};

Widget.widgets['mpris/length-label'] = ({ player = prefer, ...props }) => Widget({
    ...props,
    type: 'label',
    connections: [[Mpris, label => {
        const mpris = Mpris.getPlayer(player);
        mpris && mpris.length > 0
            ? label.label = _lengthStr(mpris.length)
            : label.visible = mpris;
    }]],
});

Widget.widgets['mpris/slash'] = ({ player = prefer, ...props }) => Widget({
    ...props,
    type: 'label',
    label: '/',
    className: 'slash',
    connections: [
        [Mpris, label => {
            const mpris = Mpris.getPlayer(player);
            label.visible = mpris && mpris.length > 0;
        }],
    ],
});

const _playerButton = ({ player = prefer, items, onClick, prop, canProp, cantValue, ...rest }) => Widget({
    ...rest,
    type: 'button',
    child: { type: 'stack', items },
    onClick: () => Mpris.getPlayer(player)?.[onClick](),
    connections: [[Mpris, button => {
        const mpris = Mpris.getPlayer(player);
        if (!mpris || mpris[canProp] === cantValue)
            return button.hide();

        button.visible = true;
        button.get_child().showChild(`${mpris[prop]}`);
    }]],
});

Widget.widgets['mpris/shuffle-button'] = ({
    player,
    enabled = { type: 'label', className: 'shuffle enabled', label: '󰒟' },
    disabled = { type: 'label', className: 'shuffle disabled', label: '󰒟' },
    ...props
}) => _playerButton({
    ...props,
    player,
    items: [
        ['true', enabled],
        ['false', disabled],
    ],
    onClick: 'shuffle',
    prop: 'shuffleStatus',
    canProp: 'shuffleStatus',
    cantValue: null,
});

Widget.widgets['mpris/loop-button'] = ({
    player,
    none = { type: 'label', className: 'loop none', label: '󰓦' },
    track = { type: 'label', className: 'loop track', label: '󰓦' },
    playlist = { type: 'label', className: 'loop playlist', label: '󰑐' },
    ...props
}) => _playerButton({
    ...props,
    player,
    items: [
        ['None', none],
        ['Track', track],
        ['Playlist', playlist],
    ],
    onClick: 'loop',
    prop: 'loopStatus',
    canProp: 'loopStatus',
    cantValue: null,
});

Widget.widgets['mpris/play-pause-button'] = ({
    player,
    playing = { type: 'label', className: 'playing', label: '󰏦' },
    paused = { type: 'label', className: 'paused', label: '󰐍' },
    stopped = { type: 'label', className: 'stopped', label: '󰐍' },
    ...props
}) => _playerButton({
    ...props,
    player,
    items: [
        ['Playing', playing],
        ['Paused', paused],
        ['Stopped', stopped],
    ],
    onClick: 'playPause',
    prop: 'playBackStatus',
    canProp: 'canPlay',
    cantValue: false,
});

Widget.widgets['mpris/previous-button'] = ({
    player,
    child = { type: 'label', className: 'previous', label: '󰒮' },
    ...props
}) => _playerButton({
    ...props,
    player,
    items: [
        ['true', child],
    ],
    onClick: 'previous',
    prop: 'canGoPrev',
    canProp: 'canGoPrev',
    cantValue: false,
});

Widget.widgets['mpris/next-button'] = ({
    player,
    child = { type: 'label', className: 'next', label: '󰒭' },
    ...props
}) => _playerButton({
    ...props,
    player,
    items: [
        ['true', child],
    ],
    onClick: 'next',
    prop: 'canGoNext',
    canProp: 'canGoNext',
    cantValue: false,
});
