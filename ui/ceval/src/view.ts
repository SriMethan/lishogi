import { Eval, CevalCtrl, ParentCtrl, NodeEvals } from './types';
import { renderEval, cubicRegressionEval } from './util';
import * as winningChances from './winningChances';
import { defined, pretendItsUsi } from 'common';
import { h } from 'snabbdom';
import { VNode } from 'snabbdom/vnode';
import { lishogiVariantRules } from 'shogiops/compat';
import { opposite, parseUsi } from 'shogiops/util';
import { parseSfen } from 'shogiops/sfen';
import { setupPosition } from 'shogiops/variant';
import { makeNotationLineWithPosition, Notation } from 'common/notation';

let gaugeLast = 0;
const gaugeTicks: VNode[] = [...Array(8).keys()].map(i =>
  h(i === 3 ? 'tick.zero' : 'tick', {
    attrs: { style: `height: ${(i + 1) * 12.5}%` },
  })
);

function localEvalInfo(ctrl: ParentCtrl, evs: NodeEvals): Array<VNode | string> {
  const ceval = ctrl.getCeval(),
    trans = ctrl.trans;
  if (!evs.client)
    return [evs.server && ctrl.nextNodeBest() ? trans.noarg('usingServerAnalysis') : trans.noarg('loadingEngine')];

  const t: Array<VNode | string> = evs.client.cloud
    ? [
        trans('depthX', evs.client.depth || 0),
        h('span.cloud', { attrs: { title: trans.noarg('cloudAnalysis') } }, 'Cloud'),
      ]
    : [trans('depthX', (evs.client.depth || 0) + '/' + evs.client.maxDepth)];
  if (ceval.canGoDeeper())
    t.push(
      h('a.deeper', {
        attrs: {
          title: trans.noarg('goDeeper'),
          'data-icon': 'O',
        },
        hook: {
          insert: vnode =>
            (vnode.elm as HTMLElement).addEventListener('click', () => {
              ceval.goDeeper();
              ceval.redraw();
            }),
        },
      })
    );
  else if (!evs.client.cloud && evs.client.knps) t.push(', ' + Math.round(evs.client.knps) + ' knodes/s');
  return t;
}

function threatInfo(ctrl: ParentCtrl, threat?: Tree.ClientEval | false): string {
  if (!threat) return ctrl.trans.noarg('loadingEngine');
  let t = ctrl.trans('depthX', (threat.depth || 0) + '/' + threat.maxDepth);
  if (threat.knps) t += ', ' + Math.round(threat.knps) + ' knodes/s';
  return t;
}

function threatButton(ctrl: ParentCtrl): VNode | null {
  if (ctrl.disableThreatMode && ctrl.disableThreatMode()) return null;
  return h('a.show-threat', {
    class: {
      active: ctrl.threatMode(),
      hidden: !!ctrl.getNode().check,
    },
    attrs: {
      'data-icon': '7',
      title: ctrl.trans.noarg('showThreat') + ' (x)',
    },
    hook: {
      insert: vnode => (vnode.elm as HTMLElement).addEventListener('click', ctrl.toggleThreatMode),
    },
  });
}

function engineName(ctrl: CevalCtrl): VNode[] {
  const version = ctrl.engineName();
  return [
    h('span', version ? { attrs: { title: version } } : {}, ctrl.technology == 'wasmx' ? 'Fairy-Stockfish' : ' - '),
    ctrl.technology == 'wasmx'
      ? h('span.native', { attrs: { title: 'Multi-threaded WebAssembly (experimental)' } }, 'wasmx')
      : ctrl.technology == 'wasm'
      ? h('span.native', { attrs: { title: 'WebAssembly' } }, 'wasm')
      : h('span.asmjs', { attrs: { title: 'JavaScript fallback' } }, 'asmjs'),
  ];
}

const serverNodes = 4e6;

export function getBestEval(evs: NodeEvals): Eval | undefined {
  const serverEv = evs.server,
    localEv = evs.client;

  if (!serverEv) return localEv;
  if (!localEv) return serverEv;

  // Prefer localEv if it exeeds fishnet node limit or finds a better mate.
  if (
    localEv.nodes > serverNodes ||
    (typeof localEv.mate !== 'undefined' &&
      (typeof serverEv.mate === 'undefined' || Math.abs(localEv.mate) < Math.abs(serverEv.mate)))
  )
    return localEv;

  return serverEv;
}

export function renderGauge(ctrl: ParentCtrl): VNode | undefined {
  if (ctrl.ongoing || !ctrl.showEvalGauge()) return;
  const bestEv = getBestEval(ctrl.currentEvals());
  let ev;
  if (bestEv) {
    ev = winningChances.povChances('sente', bestEv);
    gaugeLast = ev;
  } else ev = gaugeLast;
  return h(
    'div.eval-gauge',
    {
      class: {
        empty: ev === null,
        reverse: ctrl.getOrientation() === 'gote',
      },
    },
    [
      h('div.gote', {
        attrs: { style: `height: ${100 - cubicRegressionEval(ev) * 50}%` },
      }),
      ...gaugeTicks,
    ]
  );
}

export function renderCeval(ctrl: ParentCtrl): VNode | undefined {
  const instance = ctrl.getCeval(),
    trans = ctrl.trans;
  if (!instance.allowed() || !instance.possible || !ctrl.showComputer()) return;
  const enabled = instance.enabled(),
    evs = ctrl.currentEvals(),
    threatMode = ctrl.threatMode(),
    threat = threatMode && ctrl.getNode().threat,
    bestEv = threat || getBestEval(evs);
  let pearl: VNode | string, percent: number;
  // add impasse here - just the pearl, ceval can continue; also stalemate
  if (bestEv && typeof bestEv.cp !== 'undefined') {
    pearl = renderEval(bestEv.cp);
    percent = evs.client
      ? Math.min(100, Math.round((100 * evs.client.depth) / (evs.client.maxDepth || instance.effectiveMaxDepth())))
      : 0;
  } else if (bestEv && defined(bestEv.mate)) {
    pearl = '#' + bestEv.mate;
    percent = 100;
  } else if (ctrl.outcome()) {
    pearl = '-';
    percent = 0;
  } else {
    pearl = enabled ? h('i.ddloader') : h('i');
    percent = 0;
  }
  if (threatMode) {
    if (threat) percent = Math.min(100, Math.round((100 * threat.depth) / threat.maxDepth));
    else percent = 0;
  }

  const progressBar: VNode | null = enabled
    ? h(
        'div.bar',
        h('span', {
          class: { threat: threatMode },
          attrs: { style: `width: ${percent}%` },
          hook: {
            postpatch: (old, vnode) => {
              if (old.data!.percent > percent || !!old.data!.threatMode != threatMode) {
                const el = vnode.elm as HTMLElement;
                const p = el.parentNode as HTMLElement;
                p.removeChild(el);
                p.appendChild(el);
              }
              vnode.data!.percent = percent;
              vnode.data!.threatMode = threatMode;
            },
          },
        })
      )
    : null;

  const body: Array<VNode | null> = enabled
    ? [
        h('pearl', [pearl]),
        h('div.engine', [
          ...(threatMode ? [trans.noarg('showThreat')] : engineName(instance)),
          h(
            'span.info',
            ctrl.outcome()
              ? [trans.noarg('gameOver')]
              : threatMode
              ? [threatInfo(ctrl, threat)]
              : localEvalInfo(ctrl, evs)
          ),
        ]),
      ]
    : [
        pearl ? h('pearl', [pearl]) : null,
        h('help', [...engineName(instance), h('br'), trans.noarg('inLocalBrowser')]),
      ];

  const switchButton: VNode | null =
    ctrl.mandatoryCeval && ctrl.mandatoryCeval()
      ? null
      : h(
          'div.switch',
          {
            attrs: { title: trans.noarg('toggleLocalEvaluation') + ' (l)' },
          },
          [
            h('input#analyse-toggle-ceval.cmn-toggle.cmn-toggle--subtle', {
              attrs: {
                type: 'checkbox',
                checked: enabled,
              },
              hook: {
                insert: vnode => (vnode.elm as HTMLElement).addEventListener('change', ctrl.toggleCeval),
              },
            }),
            h('label', { attrs: { for: 'analyse-toggle-ceval' } }),
          ]
        );

  return h(
    'div.ceval' + (enabled ? '.enabled' : ''),
    {
      class: {
        computing: percent < 100 && instance.isComputing(),
      },
    },
    [progressBar, ...body, threatButton(ctrl), switchButton]
  );
}

function getElSfen(el: HTMLElement): string {
  return el.getAttribute('data-sfen')!;
}

function getElUsi(e: MouseEvent): string | undefined {
  return $(e.target as HTMLElement)
    .closest('div.pv')
    .attr('data-usi');
}

function checkHover(el: HTMLElement, instance: CevalCtrl): void {
  window.lishogi.requestIdleCallback(() => {
    instance.setHovering(getElSfen(el), $(el).find('div.pv:hover').attr('data-usi'));
  });
}

export function renderPvs(ctrl: ParentCtrl): VNode | undefined {
  const instance = ctrl.getCeval();
  if (!instance.allowed() || !instance.possible || !instance.enabled()) return;
  const multiPv = parseInt(instance.multiPv()),
    node = ctrl.getNode(),
    setup = parseSfen(node.sfen).unwrap();
  let pvs: Tree.PvData[],
    threat = false;
  if (ctrl.threatMode() && node.threat) {
    pvs = node.threat.pvs;
    threat = true;
  } else if (node.ceval) pvs = node.ceval.pvs;
  else pvs = [];
  if (threat) {
    setup.turn = opposite(setup.turn);
    setup.fullmoves += 1;
  }
  const position = setupPosition(lishogiVariantRules(instance.variant.key), setup, false);
  const turn = setup.fullmoves;
  const notation = ctrl.data.pref.pieceNotation ?? 0;
  return h(
    'div.pv_box',
    {
      attrs: { 'data-sfen': node.sfen },
      hook: {
        insert: vnode => {
          const el = vnode.elm as HTMLElement;
          el.addEventListener('mouseover', (e: MouseEvent) => {
            instance.setHovering(getElSfen(el), getElUsi(e));
          });
          el.addEventListener('mouseout', () => {
            instance.setHovering(getElSfen(el));
          });
          el.addEventListener('mousedown', (e: MouseEvent) => {
            const usi = getElUsi(e);
            if (usi) ctrl.playUsi(usi);
          });
          checkHover(el, instance);
        },
        postpatch: (_, vnode) => checkHover(vnode.elm as HTMLElement, instance),
      },
    },
    [...Array(multiPv).keys()].map(function (i) {
      if (!pvs[i]) return h('div.pv');
      return h(
        'div.pv',
        threat
          ? {}
          : {
              attrs: { 'data-usi': pvs[i].moves[0] },
            },
        [
          multiPv > 1 ? h('strong', defined(pvs[i].mate) ? '#' + pvs[i].mate : renderEval(pvs[i].cp!)) : null,
          h(
            'span',
            position.unwrap(
              pos =>
                makeNotationLineWithPosition(
                  notation as Notation,
                  pos,
                  pvs[i].moves.slice(0, 10).map(m => parseUsi(pretendItsUsi(m))!),
                  node.usi ? parseUsi(node.usi) : undefined
                ).map((m, i) => `${turn + i}. ${m} `),
              _ => '--'
            )
          ),
        ]
      );
    })
  );
}
