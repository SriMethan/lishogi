var util = require('./util');

var apple = 50;
var capture = 50;
var scenario = 50;

var levelBonus = {
  1: 500,
  2: 300,
  3: 100,
};

function getLevelBonus(l, nbMoves) {
  var late = nbMoves - l.nbMoves;
  if (l.nbMoves == 0) return levelBonus[1];
  if (late <= 0) return levelBonus[1];
  if (late <= Math.max(1, l.nbMoves / 8)) return levelBonus[2];
  return levelBonus[3];
}

function getLevelMaxScore(l) {
  var score = util.readKeys(l.apples).length * apple;
  if (l.pointsForCapture) score += (l.captures || 0) * capture;
  // console.log('score.js: getLevelMaxScore of', l);
  // console.log(score + levelBonus[1]);
  return score + levelBonus[1];
}

function getLevelRank(l, score) {
  var max = getLevelMaxScore(l);
  if (score >= max) return 1;
  if (score >= max - 200) return 2;
  return 3;
}

function getStageMaxScore(s) {
  return s.levels.reduce(function (sum, s) {
    return sum + getLevelMaxScore(s);
  }, 0);
}

function getStageRank(s, score) {
  var max = getStageMaxScore(s);
  if (typeof score !== 'number') score = score.reduce((a, b) => a + b, 0);
  if (score >= max) return 1;
  if (score >= max - Math.max(200, s.levels.length * 150)) return 2;
  return 3;
}

var pieceValues = {
  r: 50,
  l: 20,
  g: 30,
  s: 30,
  b: 30,
  n: 30,
  p: 10,
};

module.exports = {
  apple: apple,
  capture: capture,
  scenario: scenario,
  getLevelRank: getLevelRank,
  getLevelBonus: getLevelBonus,
  getStageRank: getStageRank,
  pieceValue: function (p) {
    return pieceValues[p] || 0;
  },
  gtz: function (s) {
    return s > 0;
  },
};
