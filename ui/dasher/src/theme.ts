import { h } from 'snabbdom';
import { VNode } from 'snabbdom/vnode';
import changeColorHandle from 'common/coordsColor';

import { Redraw, Open, bind, header } from './util';

type Theme = string;

interface ThemeDimData {
  current: Theme;
  list: Theme[];
}

export interface ThemeData {
  square: ThemeDimData;
  tall: ThemeDimData;
}

export interface ThemeCtrl {
  dimension: () => keyof ThemeData;
  data: () => ThemeDimData;
  trans: Trans;
  set(t: Theme): void;
  open: Open;
}

export function ctrl(
  data: ThemeData,
  trans: Trans,
  dimension: () => keyof ThemeData,
  redraw: Redraw,
  open: Open
): ThemeCtrl {
  function dimensionData() {
    return data[dimension()];
  }

  return {
    dimension,
    trans,
    data: dimensionData,
    set(t: Theme) {
      const d = dimensionData();
      d.current = t;
      applyTheme(t, d.list);
      $.post('/pref/theme' + (dimension() === 'tall' ? 'Tall' : ''), {
        theme: t,
      }).fail(() => window.lishogi.announce({ msg: 'Failed to save theme preference' }));
      redraw();
    },
    open,
  };
}

export function view(ctrl: ThemeCtrl): VNode {
  const d = ctrl.data();

  return h('div.sub.theme.' + ctrl.dimension(), [
    header(ctrl.trans.noarg('boardTheme'), () => ctrl.open('links')),
    h('div.list', d.list.map(themeView(d.current, ctrl.set))),
  ]);
}

function themeView(current: Theme, set: (t: Theme) => void) {
  return (t: Theme) =>
    h(
      'a',
      {
        hook: bind('click', () => set(t)),
        attrs: { title: t },
        class: { active: current === t },
      },
      [h('span.' + t)]
    );
}

function applyTheme(t: Theme, list: Theme[]) {
  $('body').removeClass(list.join(' ')).addClass(t);
  changeColorHandle();
}
