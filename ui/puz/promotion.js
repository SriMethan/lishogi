'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const snabbdom_1 = require('snabbdom');
const util_1 = require('./util');
const cgUtil = require('shogiground/util');
function default_1(withGround, makeCgOpts, redraw) {
  let promoting = false;
  function start(orig, dest, callback) {
    return !!withGround(g => {
      const piece = g.state.pieces.get(dest);
      if (
        piece &&
        piece.role == 'pawn' &&
        ((dest[1] == '8' && g.state.turnColor == 'black') || (dest[1] == '1' && g.state.turnColor == 'white'))
      ) {
        promoting = {
          orig: orig,
          dest: dest,
          callback: callback,
        };
        redraw();
        return true;
      }
      return false;
    });
  }
  function promote(g, key, role) {
    const piece = g.state.pieces.get(key);
    if (piece && piece.role == 'pawn') {
      g.setPieces(
        new Map([
          [
            key,
            {
              color: piece.color,
              role,
              promoted: true,
            },
          ],
        ])
      );
    }
  }
  function finish(role) {
    if (promoting) withGround(g => promote(g, promoting.dest, role));
    if (promoting.callback) promoting.callback(promoting.orig, promoting.dest, role);
    promoting = false;
  }
  function cancel() {
    if (promoting) {
      promoting = false;
      withGround(g => g.set(makeCgOpts()));
      redraw();
    }
  }
  function renderPromotion(dest, pieces, color, orientation) {
    if (!promoting) return;
    let left = (7 - cgUtil.key2pos(dest)[0]) * 12.5;
    if (orientation === 'white') left = 87.5 - left;
    const vertical = color === orientation ? 'top' : 'bottom';
    return snabbdom_1.h(
      'div#promotion-choice.' + vertical,
      {
        hook: util_1.onInsert(el => {
          el.addEventListener('click', cancel);
          el.oncontextmenu = () => false;
        }),
      },
      pieces.map(function (serverRole, i) {
        const top = (color === orientation ? i : 7 - i) * 12.5;
        return snabbdom_1.h(
          'square',
          {
            attrs: {
              style: 'top: ' + top + '%;left: ' + left + '%',
            },
            hook: util_1.bind('click', e => {
              e.stopPropagation();
              finish(serverRole);
            }),
          },
          [snabbdom_1.h('piece.' + serverRole + '.' + color)]
        );
      })
    );
  }
  return {
    start,
    cancel,
    view() {
      if (!promoting) return;
      const pieces = ['knight', 'rook', 'bishop'];
      return (
        withGround(g =>
          renderPromotion(promoting.dest, pieces, cgUtil.opposite(g.state.turnColor), g.state.orientation)
        ) || null
      );
    },
  };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvbW90aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3JjL3Byb21vdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVDQUE2QjtBQUM3QixpQ0FBd0M7QUFHeEMsMkNBQTJDO0FBSTNDLG1CQUNFLFVBQWlELEVBQ2pELFVBQTBCLEVBQzFCLE1BQWM7SUFFZCxJQUFJLFNBQVMsR0FBUSxLQUFLLENBQUM7SUFFM0IsU0FBUyxLQUFLLENBQUMsSUFBUyxFQUFFLElBQVMsRUFBRSxRQUFtRDtRQUN0RixPQUFPLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDdEIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLElBQ0UsS0FBSztnQkFDTCxLQUFLLENBQUMsSUFBSSxJQUFJLE1BQU07Z0JBQ3BCLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsQ0FBQyxFQUN0RztnQkFDQSxTQUFTLEdBQUc7b0JBQ1YsSUFBSSxFQUFFLElBQUk7b0JBQ1YsSUFBSSxFQUFFLElBQUk7b0JBQ1YsUUFBUSxFQUFFLFFBQVE7aUJBQ25CLENBQUM7Z0JBQ0YsTUFBTSxFQUFFLENBQUM7Z0JBQ1QsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsU0FBUyxPQUFPLENBQUMsQ0FBUSxFQUFFLEdBQVEsRUFBRSxJQUFVO1FBQzdDLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxD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O1FBQ04sSUFBSTtZQUNGLElBQUksQ0FBQyxTQUFTO2dCQUFFLE9BQU87WUFDdkIsTUFBTSxNQUFNLEdBQVcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3BELE9BQU8sQ0FDTCxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FDYixlQUFlLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQ2pHLElBQUksSUFBSSxDQUNWLENBQUM7UUFDSixDQUFDO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUEzR0QsNEJBMkdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaCB9IGZyb20gJ3NuYWJiZG9tJztcbmltcG9ydCB7IGJpbmQsIG9uSW5zZXJ0IH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7IEFwaSBhcyBDZ0FwaSB9IGZyb20gJ3Nob2dpZ3JvdW5kL2FwaSc7XG5pbXBvcnQgeyBDb25maWcgYXMgQ2dDb25maWcgfSBmcm9tICdzaG9naWdyb3VuZC9jb25maWcnO1xuaW1wb3J0ICogYXMgY2dVdGlsIGZyb20gJ3Nob2dpZ3JvdW5kL3V0aWwnO1xuaW1wb3J0IHsgUm9sZSB9IGZyb20gJ3Nob2dpZ3JvdW5kL3R5cGVzJztcbmltcG9ydCB7IE1heWJlVk5vZGUsIFJlZHJhdywgUHJvbW90aW9uIH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKFxuICB3aXRoR3JvdW5kOiA8QT4oZjogKGNnOiBDZ0FwaSkgPT4gQSkgPT4gQSB8IGZhbHNlLFxuICBtYWtlQ2dPcHRzOiAoKSA9PiBDZ0NvbmZpZyxcbiAgcmVkcmF3OiBSZWRyYXdcbik6IFByb21vdGlvbiB7XG4gIGxldCBwcm9tb3Rpbmc6IGFueSA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIHN0YXJ0KG9yaWc6IEtleSwgZGVzdDogS2V5LCBjYWxsYmFjazogKG9yaWc6IEtleSwga2V5OiBLZXksIHByb206IFJvbGUpID0+IHZvaWQpIHtcbiAgICByZXR1cm4gISF3aXRoR3JvdW5kKGcgPT4ge1xuICAgICAgY29uc3QgcGllY2UgPSBnLnN0YXRlLnBpZWNlcy5nZXQoZGVzdCk7XG4gICAgICBpZiAoXG4gICAgICAgIHBpZWNlICYmXG4gICAgICAgIHBpZWNlLnJvbGUgPT0gJ3Bhd24nICYmXG4gICAgICAgICgoZGVzdFsxXSA9PSAnOCcgJiYgZy5zdGF0ZS50dXJuQ29sb3IgPT0gJ2JsYWNrJykgfHwgKGRlc3RbMV0gPT0gJzEnICYmIGcuc3RhdGUudHVybkNvbG9yID09ICd3aGl0ZScpKVxuICAgICAgKSB7XG4gICAgICAgIHByb21vdGluZyA9IHtcbiAgICAgICAgICBvcmlnOiBvcmlnLFxuICAgICAgICAgIGRlc3Q6IGRlc3QsXG4gICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrLFxuICAgICAgICB9O1xuICAgICAgICByZWRyYXcoKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwcm9tb3RlKGc6IENnQXBpLCBrZXk6IEtleSwgcm9sZTogUm9sZSk6IHZvaWQge1xuICAgIGNvbnN0IHBpZWNlID0gZy5zdGF0ZS5waWVjZXMuZ2V0KGtleSk7XG4gICAgaWYgKHBpZWNlICYmIHBpZWNlLnJvbGUgPT0gJ3Bhd24nKSB7XG4gICAgICBnLnNldFBpZWNlcyhcbiAgICAgICAgbmV3IE1hcChbXG4gICAgICAgICAgW1xuICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjb2xvcjogcGllY2UuY29sb3IsXG4gICAgICAgICAgICAgIHJvbGUsXG4gICAgICAgICAgICAgIHByb21vdGVkOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICBdKVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBmaW5pc2gocm9sZTogUm9sZSk6IHZvaWQge1xuICAgIGlmIChwcm9tb3RpbmcpIHdpdGhHcm91bmQoZyA9PiBwcm9tb3RlKGcsIHByb21vdGluZy5kZXN0LCByb2xlKSk7XG4gICAgaWYgKHByb21vdGluZy5jYWxsYmFjaykgcHJvbW90aW5nLmNhbGxiYWNrKHByb21vdGluZy5vcmlnLCBwcm9tb3RpbmcuZGVzdCwgcm9sZSk7XG4gICAgcHJvbW90aW5nID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBjYW5jZWwoKTogdm9pZCB7XG4gICAgaWYgKHByb21vdGluZykge1xuICAgICAgcHJvbW90aW5nID0gZmFsc2U7XG4gICAgICB3aXRoR3JvdW5kKGcgPT4gZy5zZXQobWFrZUNnT3B0cygpKSk7XG4gICAgICByZWRyYXcoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJQcm9tb3Rpb24oZGVzdDogS2V5LCBwaWVjZXM6IFJvbGVbXSwgY29sb3I6IENvbG9yLCBvcmllbnRhdGlvbjogQ29sb3IpOiBNYXliZVZOb2RlIHtcbiAgICBpZiAoIXByb21vdGluZykgcmV0dXJuO1xuXG4gICAgbGV0IGxlZnQgPSAoNyAtIGNnVXRpbC5rZXkycG9zKGRlc3QpWzBdKSAqIDEyLjU7XG4gICAgaWYgKG9yaWVudGF0aW9uID09PSAnd2hpdGUnKSBsZWZ0ID0gODcuNSAtIGxlZnQ7XG5cbiAgICBjb25zdCB2ZXJ0aWNhbCA9IGNvbG9yID09PSBvcmllbnRhdGlvbiA/ICd0b3AnIDogJ2JvdHRvbSc7XG5cbiAgICByZXR1cm4gaChcbiAgICAgICdkaXYjcHJvbW90aW9uLWNob2ljZS4nICsgdmVydGljYWwsXG4gICAgICB7XG4gICAgICAgIGhvb2s6IG9uSW5zZXJ0KGVsID0+IHtcbiAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNhbmNlbCk7XG4gICAgICAgICAgZWwub25jb250ZXh0bWVudSA9ICgpID0+IGZhbHNlO1xuICAgICAgICB9KSxcbiAgICAgIH0sXG4gICAgICBwaWVjZXMubWFwKGZ1bmN0aW9uIChzZXJ2ZXJSb2xlLCBpKSB7XG4gICAgICAgIGNvbnN0IHRvcCA9IChjb2xvciA9PT0gb3JpZW50YXRpb24gPyBpIDogNyAtIGkpICogMTIuNTtcbiAgICAgICAgcmV0dXJuIGgoXG4gICAgICAgICAgJ3NxdWFyZScsXG4gICAgICAgICAge1xuICAgICAgICAgICAgYXR0cnM6IHtcbiAgICAgICAgICAgICAgc3R5bGU6ICd0b3A6ICcgKyB0b3AgKyAnJTtsZWZ0OiAnICsgbGVmdCArICclJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBob29rOiBiaW5kKCdjbGljaycsIGUgPT4ge1xuICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICBmaW5pc2goc2VydmVyUm9sZSk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIFtoKCdwaWVjZS4nICsgc2VydmVyUm9sZSArICcuJyArIGNvbG9yKV1cbiAgICAgICAgKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3RhcnQsXG4gICAgY2FuY2VsLFxuICAgIHZpZXcoKSB7XG4gICAgICBpZiAoIXByb21vdGluZykgcmV0dXJuO1xuICAgICAgY29uc3QgcGllY2VzOiBSb2xlW10gPSBbJ2tuaWdodCcsICdyb29rJywgJ2Jpc2hvcCddO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgd2l0aEdyb3VuZChnID0+XG4gICAgICAgICAgcmVuZGVyUHJvbW90aW9uKHByb21vdGluZy5kZXN0LCBwaWVjZXMsIGNnVXRpbC5vcHBvc2l0ZShnLnN0YXRlLnR1cm5Db2xvciksIGcuc3RhdGUub3JpZW50YXRpb24pXG4gICAgICAgICkgfHwgbnVsbFxuICAgICAgKTtcbiAgICB9LFxuICB9O1xufVxuIl19
