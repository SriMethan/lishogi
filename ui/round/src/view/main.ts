import { h } from 'snabbdom';
import { VNode } from 'snabbdom/vnode';
import { renderTable } from './table';
import * as promotion from '../promotion';
import { render as renderGround } from '../ground';
import * as util from '../util';
import * as keyboard from '../keyboard';
import handView from '../hands/handView';
import { render as keyboardMove } from '../keyboardMove';
import RoundController from '../ctrl';

function wheel(ctrl: RoundController, e: WheelEvent): boolean {
  if (ctrl.isPlaying()) return true;
  e.preventDefault();
  if (e.deltaY > 0) keyboard.next(ctrl);
  else if (e.deltaY < 0) keyboard.prev(ctrl);
  ctrl.redraw();
  return false;
}

export function main(ctrl: RoundController): VNode {
  const d = ctrl.data,
    topColor = d[ctrl.flip ? 'player' : 'opponent'].color,
    bottomColor = d[ctrl.flip ? 'opponent' : 'player'].color;

  return ctrl.nvui
    ? ctrl.nvui.render(ctrl)
    : h(
        'div.round__app.variant-' + d.game.variant.key,
        {
          class: { 'move-confirm': !!(ctrl.moveToSubmit || ctrl.dropToSubmit) },
        },
        [
          h(
            'div.round__app__board.main-board' + (ctrl.data.pref.blindfold ? '.blindfold' : ''),
            {
              hook: window.lishogi.hasTouchEvents
                ? undefined
                : util.bind('wheel', (e: WheelEvent) => wheel(ctrl, e), undefined, false),
            },
            [renderGround(ctrl), promotion.view(ctrl)]
          ),
          handView(ctrl, topColor, 'top'),
          ...renderTable(ctrl),
          handView(ctrl, bottomColor, 'bottom'),
          ctrl.keyboardMove ? keyboardMove(ctrl.keyboardMove) : null,
        ]
      );
}
