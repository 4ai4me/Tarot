// 카드 데이터 검사. 실행: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/reading.js');

const raw = [
  ...require('../js/data/major.js'),
  ...require('../js/data/wands.js'),
  ...require('../js/data/cups.js'),
  ...require('../js/data/swords.js'),
  ...require('../js/data/pentacles.js')
];
const deck = R.buildDeck(raw);
const AREA_KEYS = R.AREAS.map((a) => a.key);
const GYOAN_KEYS = R.AREAS.filter((a) => a.source === 'gyoan').map((a) => a.key);
const ADDED_KEYS = R.AREAS.filter((a) => a.source === 'added').map((a) => a.key);
const STUDENT_KEYS = R.AREAS.filter((a) => a.source === 'student').map((a) => a.key);

test('덱은 78장이고 구성이 맞다', () => {
  assert.equal(deck.length, 78);
  assert.equal(deck.filter((c) => c.arcana === 'major').length, 22);
  for (const suit of Object.keys(R.SUITS)) {
    const cards = deck.filter((c) => c.suit === suit);
    assert.equal(cards.length, 14, suit);
    assert.deepEqual(cards.map((c) => c.rank).sort(), [...R.RANKS].sort(), suit);
  }
  const numbers = deck.filter((c) => c.arcana === 'major').map((c) => c.number).sort((a, b) => a - b);
  assert.deepEqual(numbers, Array.from({ length: 22 }, (_, i) => i));
});

test('id 형식이 규칙을 따른다', () => {
  for (const c of deck) {
    if (c.arcana === 'major') assert.equal(c.id, 'major_' + String(c.number).padStart(2, '0'));
    else assert.equal(c.id, c.suit + '_' + c.rank);
  }
});

test('모든 카드에 이름, 키워드, 요약, 모든 영역 해석이 있다', () => {
  for (const c of deck) {
    assert.ok(c.nameKo && c.nameKo.trim(), c.id + ' 이름');
    assert.ok(c.keywords.length >= 3, c.id + ' 키워드');
    assert.ok(c.summary.length >= 20, c.id + ' 요약');
    for (const key of AREA_KEYS) {
      const text = c.areas[key];
      assert.equal(typeof text, 'string', `${c.id}.${key}`);
      assert.ok(text.trim().length >= 8, `${c.id}.${key} 너무 짧음`);
    }
    assert.deepEqual(Object.keys(c.areas).sort(), [...AREA_KEYS].sort(), c.id + ' 영역 키');
  }
});

test('inferred 표시는 실제 영역 키만 쓴다', () => {
  for (const c of deck) {
    for (const key of c.inferred) assert.ok(AREA_KEYS.includes(key), `${c.id}: ${key}`);
    assert.equal(new Set(c.inferred).size, c.inferred.length, c.id + ' 중복');
  }
});

test('영역 목록: 교안 7개 + 추가 4개 + 학생 고민 4개, 출처 표시가 있다', () => {
  assert.deepEqual(GYOAN_KEYS, ['love', 'heart', 'job', 'study', 'business', 'money', 'move']);
  assert.deepEqual(ADDED_KEYS, ['friend', 'newterm', 'career', 'family']);
  assert.deepEqual(STUDENT_KEYS, ['crush', 'looks', 'mind', 'allowance']);
  assert.equal(AREA_KEYS.length, 15);
  assert.equal(new Set(AREA_KEYS).size, AREA_KEYS.length);
});

test('메이저는 교안 7개 영역에 예시가 있어 그 영역에는 추론 표시가 없다', () => {
  for (const c of deck.filter((x) => x.arcana === 'major')) {
    for (const key of GYOAN_KEYS) assert.ok(!c.inferred.includes(key), c.id + ': ' + key);
  }
});

test('추가한 영역(학생 고민 포함)은 교안에 없어 모든 카드에서 추론 표시가 되어 있다', () => {
  for (const c of deck) {
    for (const key of [...ADDED_KEYS, ...STUDENT_KEYS]) assert.ok(c.inferred.includes(key), c.id + ': ' + key);
  }
});

test('해석문에 미완성 표시가 없다', () => {
  const bad = /TODO|TBD|준비 중|lorem/i;
  for (const c of deck) {
    const texts = [c.summary, ...Object.values(c.areas), ...c.symbols, ...Object.values(c.friendBySchool), c.advice];
    for (const text of texts) assert.ok(!bad.test(text), c.id + ': ' + text);
  }
});

test('모든 카드에 그림 속 상징 2개, 학교급별 친구 해석 3개, 지금 해 볼 일이 있다', () => {
  for (const c of deck) {
    assert.equal(c.symbols.length, 2, c.id + ' 상징 수');
    for (const s of c.symbols) assert.match(s, /^[^:]{2,}: .{3,}$/, c.id + ' 상징 형식: ' + s);
    assert.deepEqual(Object.keys(c.friendBySchool).sort(), ['elementary', 'high', 'middle'], c.id + ' 학교급 키');
    for (const [k, t] of Object.entries(c.friendBySchool)) assert.ok(t.trim().length >= 15, `${c.id}.${k} 너무 짧음`);
    assert.ok(c.advice.trim().length >= 10, c.id + ' 해 볼 일');
    // 같은 카드 안에서 학교급 문장이 서로 다르고, 기존 친구 관계 문장을 그대로 베끼지 않았다
    const fb = Object.values(c.friendBySchool);
    assert.equal(new Set(fb).size, 3, c.id + ' 학교급 문장 중복');
    assert.ok(!fb.includes(c.areas.friend), c.id + ' 기존 문장 복사');
  }
});

test('학생 영역 문장에 위험한 조언이 없다 (진단·체중·투자·도박 표현)', () => {
  const bad = /우울증|공황장애|진단|체중|살을 빼|다이어트|굶|주식|코인|도박|대출/;
  for (const c of deck) {
    const texts = [...STUDENT_KEYS.map((k) => c.areas[k]), ...Object.values(c.friendBySchool), c.advice];
    for (const t of texts) assert.ok(!bad.test(t), c.id + ': ' + t);
  }
});
