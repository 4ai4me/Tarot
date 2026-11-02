// 실행: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/reading.js');

function card(id, element, extra) {
  return Object.assign({ id, element, arcana: element ? 'minor' : 'major' }, extra || {});
}

// 0, 0.5, 0.99 … 를 순서대로 돌려주는 가짜 난수
function seq(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

test('draw: 서로 다른 카드를 요청한 장수만큼 뽑는다', () => {
  const deck = Array.from({ length: 78 }, (_, i) => ({ id: 'c' + i }));
  for (let t = 0; t < 500; t++) {
    const hand = R.draw(deck, 3);
    assert.equal(hand.length, 3);
    assert.equal(new Set(hand.map((c) => c.id)).size, 3);
  }
});

test('draw: 원본 덱을 바꾸지 않는다', () => {
  const deck = Array.from({ length: 10 }, (_, i) => ({ id: 'c' + i }));
  const before = deck.map((c) => c.id).join();
  R.draw(deck, 3, seq([0.9, 0.1, 0.5]));
  assert.equal(deck.map((c) => c.id).join(), before);
});

test('draw: 난수가 0이나 1에 가까워도 범위를 벗어나지 않는다', () => {
  const deck = Array.from({ length: 5 }, (_, i) => ({ id: 'c' + i }));
  assert.equal(new Set(R.draw(deck, 5, () => 0).map((c) => c.id)).size, 5);
  assert.equal(new Set(R.draw(deck, 5, () => 0.9999999).map((c) => c.id)).size, 5);
  assert.equal(new Set(R.draw(deck, 5, () => 1).map((c) => c.id)).size, 5);
});

test('draw: 덱보다 많이 뽑으면 오류', () => {
  assert.throws(() => R.draw([{ id: 'a' }], 2));
});

test('draw: 78장에서 모든 카드가 고르게 나온다 (대략)', () => {
  const deck = Array.from({ length: 78 }, (_, i) => ({ id: i }));
  const counts = new Array(78).fill(0);
  const N = 30000;
  for (let t = 0; t < N; t++) for (const c of R.draw(deck, 3)) counts[c.id]++;
  const expected = (N * 3) / 78;
  for (const c of counts) assert.ok(Math.abs(c - expected) < expected * 0.2, `편향: ${c} vs ${expected}`);
});

test('relation: 원소 위계 규칙', () => {
  const fire = card('f', 'fire');
  const water = card('w', 'water');
  const air = card('a', 'air');
  const earth = card('e', 'earth');
  const major = card('m', null);
  assert.equal(R.relation(fire, fire), 'same');
  assert.equal(R.relation(fire, air), 'friendly');
  assert.equal(R.relation(air, fire), 'friendly');
  assert.equal(R.relation(water, earth), 'friendly');
  assert.equal(R.relation(fire, water), 'hostile');
  assert.equal(R.relation(air, earth), 'hostile');
  assert.equal(R.relation(earth, air), 'hostile');
  assert.equal(R.relation(fire, earth), 'neutral');
  assert.equal(R.relation(water, air), 'neutral');
  assert.equal(R.relation(major, fire), 'major');
  assert.equal(R.relation(fire, major), 'major');
});

test('centerEffect: 경우별 판정', () => {
  const f = card('f', 'fire');
  const w = card('w', 'water');
  const a = card('a', 'air');
  const e = card('e', 'earth');
  const m = card('m', null);
  assert.equal(R.centerEffect([f, m, w]).level, 'major');
  assert.equal(R.centerEffect([f, e, w]).level, 'pure'); // 양옆 불–물이 상쇄
  assert.equal(R.centerEffect([a, f, f]).level, 'strong');
  assert.equal(R.centerEffect([w, f, w]).level, 'weak');
  assert.equal(R.centerEffect([a, f, w]).level, 'steady'); // +1, -1
  assert.equal(R.centerEffect([e, f, m]).level, 'steady'); // 중립 + 메이저
  assert.equal(R.centerEffect([m, w, e]).level, 'strong'); // 메이저 옆은 0, 물–흙 +1
  assert.throws(() => R.centerEffect([f, f]));
});

test('normalize: 마이너 카드 파생 정보', () => {
  const c = R.normalize({ id: 'swords_7', suit: 'swords', rank: '7', nameKo: '소드 7' });
  assert.equal(c.arcana, 'minor');
  assert.equal(c.element, 'air');
  assert.equal(c.nameEn, 'Seven of Swords');
  assert.equal(c.roman, 'VII');
  assert.equal(c.court, false);
  const k = R.normalize({ id: 'cups_queen', suit: 'cups', rank: 'queen', nameKo: '컵 퀸' });
  assert.equal(k.court, true);
  assert.equal(k.roman, '');
  const ace = R.normalize({ id: 'wands_ace', suit: 'wands', rank: 'ace', nameKo: '완드 에이스' });
  assert.equal(ace.court, false);
  assert.equal(ace.roman, '');
});

test('normalize: 메이저 카드는 원소가 없다', () => {
  const c = R.normalize({ id: 'major_08', number: 8, nameKo: '힘', nameEn: 'Strength' });
  assert.equal(c.element, null);
  assert.equal(c.roman, 'VIII');
});

test('normalize/buildDeck: 잘못된 데이터는 오류', () => {
  assert.throws(() => R.normalize({ id: 'x', suit: 'stars', rank: 'ace' }));
  assert.throws(() => R.normalize({ id: 'x', suit: 'cups', rank: '11' }));
  assert.throws(() => R.normalize({ id: 'x', number: 22 }));
  assert.throws(() => R.buildDeck([{ id: 'a', number: 0 }, { id: 'a', number: 1 }]));
});

test('imageCandidates: 위키미디어 파일 이름 규칙', () => {
  const fool = R.normalize({ id: 'major_00', number: 0, nameKo: '바보', nameEn: 'The Fool' });
  assert.match(R.imageCandidates(fool)[0], /Special:FilePath\/RWS_Tarot_00_Fool\.jpg\?width=400$/);
  const lovers = R.normalize({ id: 'major_06', number: 6, nameKo: '연인', nameEn: 'The Lovers' });
  assert.equal(R.imageCandidates(lovers).length, 2);
  const pk = R.normalize({ id: 'pentacles_king', suit: 'pentacles', rank: 'king', nameKo: '펜타클 킹' });
  assert.match(R.imageCandidates(pk)[0], /Pents14\.jpg/);
  const ca = R.normalize({ id: 'cups_ace', suit: 'cups', rank: 'ace', nameKo: '컵 에이스' });
  assert.match(R.imageCandidates(ca)[0], /Cups01\.jpg/);
});
