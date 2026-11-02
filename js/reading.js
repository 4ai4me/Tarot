/*
 * 타로 판정 로직 — 화면과 분리된 순수 함수 모음.
 * 브라우저에서는 window.Reading, Node 테스트에서는 require()로 쓴다.
 * (ES 모듈 대신 이 방식을 쓰는 이유: index.html을 더블클릭해 file://로 열어도 동작하게 하려고)
 */
(function (root) {
  'use strict';

  var SUITS = {
    wands: { ko: '완드', en: 'Wands', element: 'fire', file: 'Wands' },
    cups: { ko: '컵', en: 'Cups', element: 'water', file: 'Cups' },
    swords: { ko: '소드', en: 'Swords', element: 'air', file: 'Swords' },
    pentacles: { ko: '펜타클', en: 'Pentacles', element: 'earth', file: 'Pents' }
  };

  var ELEMENTS = {
    fire: { ko: '불' },
    water: { ko: '물' },
    air: { ko: '공기' },
    earth: { ko: '흙' }
  };

  var RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'page', 'knight', 'queen', 'king'];
  var RANK_EN = {
    ace: 'Ace', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five', '6': 'Six', '7': 'Seven',
    '8': 'Eight', '9': 'Nine', '10': 'Ten', page: 'Page', knight: 'Knight', queen: 'Queen', king: 'King'
  };
  var ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII',
    'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

  // 교안의 7개 질문 영역
  var AREAS = [
    { key: 'love', label: '연애 흐름' },
    { key: 'heart', label: '상대의 속마음' },
    { key: 'job', label: '취업' },
    { key: 'study', label: '성적' },
    { key: 'business', label: '발표·사업' },
    { key: 'money', label: '재물' },
    { key: 'move', label: '이동·여행' }
  ];

  // 교안의 3장 가로 배열 4가지
  var SPREADS = [
    { key: 'time', label: '과거 / 현재 / 미래', positions: ['과거', '현재', '미래'] },
    { key: 'advice', label: '상황 / 조언 / 결과', positions: ['상황', '조언', '결과'] },
    { key: 'obstacle', label: '현재 / 장애 / 결과', positions: ['현재', '장애', '결과'] },
    { key: 'relation', label: '나 / 너 / 우리', positions: ['나', '너', '우리'] }
  ];

  // 위키미디어 공용의 1909년 라이더-웨이트-스미스 원본(퍼블릭 도메인) 파일 이름.
  // 작업 환경에서 위키미디어에 접속할 수 없어 파일 이름을 직접 확인하지 못했다.
  // 그래서 후보를 여러 개 두고, 모두 실패하면 화면이 그린 카드 면으로 대신한다.
  var MAJOR_FILE = ['Fool', 'Magician', 'High Priestess', 'Empress', 'Emperor', 'Hierophant', 'Lovers',
    'Chariot', 'Strength', 'Hermit', 'Wheel of Fortune', 'Justice', 'Hanged Man', 'Death', 'Temperance',
    'Devil', 'Tower', 'Star', 'Moon', 'Sun', 'Judgement', 'World'];
  var IMAGE_BASE = 'https://commons.wikimedia.org/wiki/Special:FilePath/';

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /** 데이터 파일의 카드 한 장에 파생 정보(원소, 영문명, 로마 숫자 등)를 채운다. */
  function normalize(raw) {
    if (!raw || typeof raw.id !== 'string') throw new Error('카드 id가 없습니다');
    var card = {
      id: raw.id,
      nameKo: raw.nameKo,
      keywords: raw.keywords || [],
      summary: raw.summary || '',
      areas: raw.areas || {},
      inferred: raw.inferred || []
    };
    if (raw.suit) {
      var suit = SUITS[raw.suit];
      if (!suit) throw new Error('알 수 없는 슈트: ' + raw.suit + ' (' + raw.id + ')');
      if (RANKS.indexOf(raw.rank) < 0) throw new Error('알 수 없는 계급: ' + raw.rank + ' (' + raw.id + ')');
      card.arcana = 'minor';
      card.suit = raw.suit;
      card.rank = raw.rank;
      card.element = suit.element;
      card.nameEn = RANK_EN[raw.rank] + ' of ' + suit.en;
      var num = parseInt(raw.rank, 10);
      card.number = isNaN(num) ? null : num;
      card.roman = card.number ? ROMAN[card.number] : '';
      card.court = isNaN(num) && raw.rank !== 'ace';
    } else {
      if (typeof raw.number !== 'number' || raw.number < 0 || raw.number > 21) {
        throw new Error('메이저 카드 번호가 잘못됐습니다 (' + raw.id + ')');
      }
      card.arcana = 'major';
      card.suit = null;
      card.rank = null;
      card.element = null; // 교안은 메이저에 원소를 주지 않는다 → 원소 관계에서 중립
      card.number = raw.number;
      card.nameEn = raw.nameEn;
      card.roman = ROMAN[raw.number];
      card.court = false;
    }
    return card;
  }

  /** 카드 목록 전체를 정리하고 id 중복을 막는다. */
  function buildDeck(rawList) {
    var seen = {};
    return rawList.map(function (raw) {
      var card = normalize(raw);
      if (seen[card.id]) throw new Error('카드 id가 중복됐습니다: ' + card.id);
      seen[card.id] = true;
      return card;
    });
  }

  /** 브라우저의 안전한 난수. 없으면 Math.random. 반환값은 [0, 1). */
  function secureRandom() {
    var c = root && root.crypto;
    if (c && typeof c.getRandomValues === 'function') {
      var buf = new Uint32Array(1);
      c.getRandomValues(buf);
      return buf[0] / 4294967296;
    }
    return Math.random();
  }

  /** 덱에서 서로 다른 카드 n장을 뽑는다. 원본 덱은 바꾸지 않는다. */
  function draw(deck, n, rng) {
    rng = rng || secureRandom;
    if (!Array.isArray(deck)) throw new Error('덱이 배열이 아닙니다');
    if (!(n >= 0) || n > deck.length) throw new Error('뽑을 수 있는 장수를 넘었습니다');
    var pool = deck.slice();
    for (var i = 0; i < n; i++) {
      var j = i + Math.floor(rng() * (pool.length - i));
      if (j >= pool.length) j = pool.length - 1; // rng가 1을 돌려주는 경우 대비
      var tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, n);
  }

  var FRIENDLY = { fire: 'air', air: 'fire', water: 'earth', earth: 'water' };
  var HOSTILE = { fire: 'water', water: 'fire', air: 'earth', earth: 'air' };

  /**
   * 두 카드의 원소 관계 (골든 던의 원소 위계 기준).
   * 'major'   : 한쪽이 메이저라 원소 영향 없음
   * 'same'    : 같은 원소 — 서로 북돋움
   * 'friendly': 불–공기, 물–흙 — 서로 북돋움
   * 'hostile' : 불–물, 공기–흙 — 서로 약하게 함
   * 'neutral' : 나머지
   */
  function relation(a, b) {
    if (!a.element || !b.element) return 'major';
    if (a.element === b.element) return 'same';
    if (FRIENDLY[a.element] === b.element) return 'friendly';
    if (HOSTILE[a.element] === b.element) return 'hostile';
    return 'neutral';
  }

  var RELATION_TEXT = {
    major: { short: '중립', long: '메이저 카드는 원소 영향을 주고받지 않습니다', tone: 'neutral' },
    same: { short: '북돋움', long: '같은 원소라 서로의 힘을 키웁니다', tone: 'support' },
    friendly: { short: '북돋움', long: '서로 돕는 원소라 힘을 보탭니다', tone: 'support' },
    hostile: { short: '부딪침', long: '서로 맞서는 원소라 힘이 약해집니다', tone: 'clash' },
    neutral: { short: '중립', long: '서로 큰 영향을 주지 않는 원소입니다', tone: 'neutral' }
  };

  function relationScore(rel) {
    if (rel === 'same' || rel === 'friendly') return 1;
    if (rel === 'hostile') return -1;
    return 0;
  }

  /**
   * 3장 배열에서 가운데 카드가 양옆 카드에게 받는 영향.
   * level: 'major' | 'pure' | 'strong' | 'weak' | 'steady'
   */
  function centerEffect(cards) {
    if (!cards || cards.length !== 3) throw new Error('카드 3장이 필요합니다');
    var left = cards[0];
    var center = cards[1];
    var right = cards[2];
    if (!center.element) {
      return { level: 'major', text: '가운데가 메이저 카드라 원소의 영향을 받지 않습니다. 카드 본래의 뜻으로 읽으세요.' };
    }
    if (left.element && right.element && relation(left, right) === 'hostile') {
      return { level: 'pure', text: '양옆 카드가 서로 부딪쳐 힘을 상쇄합니다. 가운데 카드의 뜻이 그대로, 강하게 드러납니다.' };
    }
    var score = relationScore(relation(left, center)) + relationScore(relation(center, right));
    if (score > 0) {
      return { level: 'strong', text: '양옆 카드가 가운데 카드의 힘을 북돋습니다. 해석을 한층 분명하게 읽으세요.' };
    }
    if (score < 0) {
      return { level: 'weak', text: '양옆 카드가 가운데 카드의 힘을 약하게 합니다. 해석을 한 단계 누그러뜨려 읽으세요.' };
    }
    return { level: 'steady', text: '가운데 카드는 큰 영향 없이 본래의 뜻대로 읽습니다.' };
  }

  /** 카드 그림 주소 후보 (앞에서부터 시도). */
  function imageCandidates(card) {
    var names = [];
    if (card.arcana === 'major') {
      names.push('RWS Tarot ' + pad2(card.number) + ' ' + MAJOR_FILE[card.number] + '.jpg');
      if (card.number === 6) names.push('TheLovers.jpg');
    } else {
      names.push(SUITS[card.suit].file + pad2(RANKS.indexOf(card.rank) + 1) + '.jpg');
    }
    return names.map(function (name) {
      return IMAGE_BASE + encodeURIComponent(name.replace(/ /g, '_')) + '?width=400';
    });
  }

  function areaLabel(key) {
    for (var i = 0; i < AREAS.length; i++) if (AREAS[i].key === key) return AREAS[i].label;
    return null;
  }

  var Reading = {
    SUITS: SUITS,
    ELEMENTS: ELEMENTS,
    RANKS: RANKS,
    AREAS: AREAS,
    SPREADS: SPREADS,
    RELATION_TEXT: RELATION_TEXT,
    normalize: normalize,
    buildDeck: buildDeck,
    draw: draw,
    relation: relation,
    centerEffect: centerEffect,
    imageCandidates: imageCandidates,
    areaLabel: areaLabel,
    secureRandom: secureRandom
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Reading;
  } else {
    root.Reading = Reading;
  }
})(typeof self !== 'undefined' ? self : this);
