import { Prop } from 'common';

export interface ForecastData {
  onMyTurn?: boolean;
  steps?: ForecastStep[][];
}

export interface ForecastStep {
  ply: Ply;
  usi: Usi;
  sfen: Sfen;
  check?: Key;
}

export interface ForecastCtrl {
  addNodes(fc);
  reloadToLastPly();
  truncate(fc: ForecastStep[]): ForecastStep[];
  playAndSave(node: ForecastStep);
  findStartingWithNode(node: ForecastStep): ForecastStep[][];
  isCandidate(fc: ForecastStep[]): boolean;
  addNodes(fc: ForecastStep[]);
  removeIndex(index: number);
  list(): ForecastStep[][];
  loading: Prop<boolean>;
  onMyTurn: boolean;
}
