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

// ---------- 나이·성별, 조사, 총평 ----------

test('parseAge: 빈 칸은 통과, 1~120 정수만 받는다', () => {
  assert.deepEqual(R.parseAge(''), { ok: true, value: null });
  assert.deepEqual(R.parseAge('   '), { ok: true, value: null });
  assert.deepEqual(R.parseAge(null), { ok: true, value: null });
  assert.deepEqual(R.parseAge('17'), { ok: true, value: 17 });
  assert.deepEqual(R.parseAge(' 1 '), { ok: true, value: 1 });
  assert.deepEqual(R.parseAge('120'), { ok: true, value: 120 });
  for (const bad of ['0', '121', '999', '-3', '17.5', '열일곱', '17세', '1e2', '0x11', '1 7']) {
    const r = R.parseAge(bad);
    assert.equal(r.ok, false, bad);
    assert.equal(r.value, null, bad);
    assert.match(r.message, /1~120/, bad);
  }
});

test('profileText: 입력한 것만 짧게 보여 준다', () => {
  assert.equal(R.profileText({ age: 17, gender: 'female' }), '17세 여성');
  assert.equal(R.profileText({ age: null, gender: 'male' }), '남성');
  assert.equal(R.profileText({ age: 40, gender: 'none' }), '40세');
  assert.equal(R.profileText({ age: null, gender: 'none' }), '');
  assert.equal(R.profileText({ gender: '모름' }), '');
  assert.equal(R.profileText(undefined), '');
});

test('josa: 받침에 맞는 조사 (숫자·괄호 포함)', () => {
  assert.equal(R.josa('바보', '이가'), '가');
  assert.equal(R.josa('운명의 수레바퀴', '은는'), '는');
  assert.equal(R.josa('달', '이가'), '이');
  assert.equal(R.josa('컵 2', '이가'), '가');
  assert.equal(R.josa('완드 10', '이가'), '이');
  assert.equal(R.josa('소드 7', '은는'), '은');
  assert.equal(R.josa('친구 관계', '을를'), '를');
  assert.equal(R.josa('연애 흐름', '을를'), '을');
  assert.equal(R.josa('새로운 시작', '과와'), '과');
  assert.equal(R.josa('자유', '과와'), '와');
  assert.equal(R.josa('결실', '으로'), '로'); // ㄹ받침은 '로'
  assert.equal(R.josa('충격', '으로'), '으로');
  assert.equal(R.josa('자유', '으로'), '로');
  assert.equal(R.josa('‘시작’', '이가'), '이'); // 따옴표는 건너뜀
  assert.throws(() => R.josa('바보', '의'));
});

test('connector: 교안 연결법 — 북돋움 그래서, 부딪침 하지만, 나머지 그리고', () => {
  const f = card('f', 'fire');
  const w = card('w', 'water');
  const a = card('a', 'air');
  const e = card('e', 'earth');
  const m = card('m', null);
  assert.equal(R.connector(f, a), '그래서');
  assert.equal(R.connector(w, w), '그래서');
  assert.equal(R.connector(f, w), '하지만');
  assert.equal(R.connector(a, e), '하지만');
  assert.equal(R.connector(f, e), '그리고');
  assert.equal(R.connector(m, f), '그리고');
});

const realDeck = R.buildDeck([
  ...require('../js/data/major.js'),
  ...require('../js/data/wands.js'),
  ...require('../js/data/cups.js'),
  ...require('../js/data/swords.js'),
  ...require('../js/data/pentacles.js')
]);
const byId = (id) => realDeck.find((c) => c.id === id);

test('summarize: 예시 — 과거/현재/미래, 친구 관계, 17세 여성', () => {
  const hand = [byId('cups_2'), byId('cups_3'), byId('cups_4')];
  const s = R.summarize(hand, 'friend', 'time', { age: 17, gender: 'female' });
  assert.equal(s.opening, '17세 여성의 친구 관계를 세 장으로 이어 읽으면 이렇습니다.');
  assert.equal(s.flow[0], '‘과거’ 자리에는 컵 2가 나와 화합과 파트너를 보여 줍니다.');
  assert.equal(s.flow[1], '그래서 ‘현재’ 자리의 컵 3은 즐거움과 어울림을 말합니다.');
  assert.equal(s.flow[2], '그래서 ‘미래’ 자리의 컵 4에서 권태와 시큰둥함으로 이어집니다.');
  assert.equal(s.endingLead, '앞으로의 흐름은 컵 4 카드가 말해 줍니다.');
  assert.equal(s.endingText, byId('cups_4').areas.friend);
  assert.match(s.notes[0], /북돋아/); // 같은 원소 셋 → 가운데 강함
});

test('summarize: 부딪치는 원소는 하지만, 메이저 마지막 카드는 마음가짐 안내', () => {
  const hand = [byId('wands_ace'), byId('cups_5'), byId('major_17')];
  const s = R.summarize(hand, 'newterm', 'advice', { age: null, gender: 'none' });
  assert.equal(s.opening, '새학기를 세 장으로 이어 읽으면 이렇습니다.');
  assert.equal(s.flow[1], '이 상황에서 카드가 건네는 조언은 컵 5의 ‘실망’입니다.');
  assert.match(s.flow[2], /^그리고 /); // 컵–메이저는 중립
  assert.equal(s.endingLead, '조언을 따랐을 때의 결과는 별 카드가 말해 줍니다.');
  assert.ok(s.notes.some((n) => n.includes('마지막 카드가 메이저')));
  const t = R.summarize([byId('wands_ace'), byId('cups_5'), byId('wands_2')], 'family', 'time', {});
  assert.match(t.flow[1], /^하지만 /);
  assert.match(t.flow[2], /^하지만 /);
  assert.match(t.notes[0], /약하게/);
});

test('summarize: 양옆 상쇄와 가운데 메이저', () => {
  const pure = R.summarize([byId('wands_2'), byId('pentacles_3'), byId('cups_9')], 'career', 'obstacle', {});
  assert.equal(pure.flow[1], '이때 걸림돌은 펜타클 3이 보여 주는 ‘협업’입니다.');
  assert.match(pure.notes[0], /펜타클 3의 ‘협업’이 이 이야기의 중심/);
  assert.equal(pure.endingLead, '걸림돌을 지난 뒤의 결과는 컵 9 카드가 말해 줍니다.');
  const major = R.summarize([byId('wands_2'), byId('major_09'), byId('cups_9')], 'love', 'relation', {});
  assert.match(major.notes[0], /가운데 메이저 카드 은둔자는/);
  assert.equal(major.endingLead, '두 사람의 관계는 컵 9 카드가 말해 줍니다.');
});

test('summarize: 모든 영역·배열·무작위 조합에서 빈칸 없는 문장이 나온다', () => {
  const profiles = [{}, { age: 17, gender: 'female' }, { age: 45, gender: 'male' }, { age: null, gender: 'none' }];
  let n = 0;
  for (let t = 0; t < 300; t++) {
    const hand = R.draw(realDeck, 3);
    for (const area of R.AREAS) {
      for (const spread of R.SPREADS) {
        const s = R.summarize(hand, area.key, spread.key, profiles[t % profiles.length]);
        const all = [s.opening, ...s.flow, s.endingLead, s.endingText, ...s.notes];
        assert.equal(s.flow.length, 3);
        assert.ok(s.notes.length >= 1);
        for (const text of all) {
          assert.equal(typeof text, 'string');
          assert.ok(text.length > 5, text);
          assert.ok(!/undefined|null|NaN|\[object/.test(text), text);
        }
        assert.equal(s.endingText, hand[2].areas[area.key]);
        n++;
      }
    }
  }
  assert.equal(n, 300 * 11 * 4);
});

test('summarize: 잘못된 입력은 오류', () => {
  const hand = R.draw(realDeck, 3);
  assert.throws(() => R.summarize(hand.slice(0, 2), 'love', 'time', {}));
  assert.throws(() => R.summarize(hand, 'nope', 'time', {}));
  assert.doesNotThrow(() => R.summarize(hand, 'love', 'nope', {})); // 모르는 배열은 첫 배열로
});
