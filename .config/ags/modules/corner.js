const { Widget } = ags;
const { Gtk } = imports.gi;

Widget.widgets['corner'] = ({ place }) => Widget({
    type: Gtk.DrawingArea.new,
    className: 'corner',
    hexpand: true,
    vexpand: true,
    halign: place.includes('left') ? 'start' : 'end',
    valign: place.includes('top') ? 'start' : 'end',
    setup: area => {
        area.set_draw_func((area, cr, w, h) => {
            const c = area.get_color();
            const r = Math.min(w, h);

            switch (place) {
            case 'topleft':
                cr.arc(r, r, r, Math.PI, 3 * Math.PI / 2);
                cr.lineTo(0, 0);
                break;

            case 'topright':
                cr.arc(0, r, r, 3 * Math.PI / 2, 2 * Math.PI);
                cr.lineTo(r, 0);
                break;

            case 'bottomleft':
                cr.arc(r, 0, r, Math.PI / 2, Math.PI);
                cr.lineTo(0, r);
                break;

            case 'bottomright':
                cr.arc(0, 0, r, 0, Math.PI / 2);
                cr.lineTo(r, r);
                break;
            }

            cr.closePath();
            cr.setSourceRGBA(c.red, c.green, c.blue, c.alpha);
            cr.fill();
        });
    },
});
