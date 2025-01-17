// import RoundController from './ctrl';
import { RoundSocket } from './socket';

/* Tracks moves that were played on the board,
 * sent to the server, possibly acked,
 * but without a move response from the server yet.
 * After a delay, it will trigger a reload.
 * This might fix bugs where the board is in a
 * transient, dirty state, where clocks don't tick,
 * eventually causing the player to flag.
 * It will also help with lila-ws restarts.
 */
export default class TransientMove {
  constructor(readonly socket: RoundSocket) {}

  current: number | undefined = undefined;

  register = () => {
    this.current = setTimeout(this.expire, 7500);
  };

  clear = () => {
    if (this.current) clearTimeout(this.current);
  };

  expire = () => {
    this.socket.reload({});
  };
}
