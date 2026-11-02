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

  // 질문 영역. source 'gyoan' = 교안의 7개 영역, 'added' = 사용자 요청으로 추가한 영역(전 카드 추론 해석)
  var AREAS = [
    { key: 'love', label: '연애 흐름', source: 'gyoan' },
    { key: 'heart', label: '상대의 속마음', source: 'gyoan' },
    { key: 'job', label: '취업', source: 'gyoan' },
    { key: 'study', label: '성적', source: 'gyoan' },
    { key: 'business', label: '발표·사업', source: 'gyoan' },
    { key: 'money', label: '재물', source: 'gyoan' },
    { key: 'move', label: '이동·여행', source: 'gyoan' },
    { key: 'friend', label: '친구 관계', source: 'added' },
    { key: 'newterm', label: '새학기', source: 'added' },
    { key: 'career', label: '진로', source: 'added' },
    { key: 'family', label: '가족', source: 'added' }
  ];

  // 성별 선택지. 해석 문장은 바꾸지 않고 결과 제목과 총평에만 쓴다.
  var GENDERS = [
    { key: 'none', label: '선택 안 함' },
    { key: 'female', label: '여성' },
    { key: 'male', label: '남성' }
  ];
  var AGE_MIN = 1;
  var AGE_MAX = 120;

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

  function areaByKey(key) {
    for (var i = 0; i < AREAS.length; i++) if (AREAS[i].key === key) return AREAS[i];
    return null;
  }

  function areaLabel(key) {
    var area = areaByKey(key);
    return area ? area.label : null;
  }

  /** 모르는 키면 첫 번째 배열을 돌려준다 (화면이 항상 무언가를 그릴 수 있게). */
  function spreadByKey(key) {
    for (var i = 0; i < SPREADS.length; i++) if (SPREADS[i].key === key) return SPREADS[i];
    return SPREADS[0];
  }

  /**
   * 나이 입력값 검사. 빈 칸은 '입력 안 함'으로 통과.
   * 반환: { ok: true, value: 숫자 또는 null } / { ok: false, value: null, message }
   */
  function parseAge(text) {
    var s = text == null ? '' : String(text).trim();
    if (s === '') return { ok: true, value: null };
    var bad = { ok: false, value: null, message: '나이는 ' + AGE_MIN + '~' + AGE_MAX + ' 사이의 숫자로 적어 주세요.' };
    if (!/^[0-9]{1,3}$/.test(s)) return bad;
    var n = parseInt(s, 10);
    if (n < AGE_MIN || n > AGE_MAX) return bad;
    return { ok: true, value: n };
  }

  function genderLabel(key) {
    for (var i = 0; i < GENDERS.length; i++) if (GENDERS[i].key === key) return GENDERS[i].label;
    return null;
  }

  /** '17세 여성', '여성', '17세', '' 처럼 화면에 보일 짧은 소개. 저장하지 않는다. */
  function profileText(profile) {
    var p = profile || {};
    var parts = [];
    if (typeof p.age === 'number') parts.push(p.age + '세');
    if (p.gender && p.gender !== 'none' && genderLabel(p.gender)) parts.push(genderLabel(p.gender));
    return parts.join(' ');
  }

  // 숫자를 한국어로 읽을 때 받침 (0 영, 1 일, 3 삼, 6 육, 7 칠, 8 팔 / 10 십도 끝자리 0과 같이 받침 있음)
  var DIGIT_BATCHIM = { '0': 'o', '1': 'l', '2': '', '3': 'o', '4': '', '5': '', '6': 'o', '7': 'l', '8': 'l', '9': '' };

  /** 마지막 글자의 받침: '' 없음, 'l' ㄹ받침, 'o' 그 밖의 받침. 끝의 문장부호·괄호는 건너뛴다. */
  function finalSound(word) {
    var s = String(word);
    for (var i = s.length - 1; i >= 0; i--) {
      var ch = s.charAt(i);
      var code = s.charCodeAt(i);
      if (code >= 0xac00 && code <= 0xd7a3) {
        var jong = (code - 0xac00) % 28;
        if (jong === 0) return '';
        return jong === 8 ? 'l' : 'o';
      }
      if (DIGIT_BATCHIM.hasOwnProperty(ch)) return DIGIT_BATCHIM[ch];
      if (/[A-Za-z]/.test(ch)) return '';
    }
    return '';
  }

  /** 받침에 맞는 조사. pair: '은는' | '이가' | '을를' | '과와' | '으로' */
  function josa(word, pair) {
    var f = finalSound(word);
    switch (pair) {
      case '은는': return f ? '은' : '는';
      case '이가': return f ? '이' : '가';
      case '을를': return f ? '을' : '를';
      case '과와': return f ? '과' : '와';
      case '으로': return f === 'o' ? '으로' : '로';
      default: throw new Error('모르는 조사: ' + pair);
    }
  }

  /**
   * 교안의 카드 연결법: 흐름이 비슷하면 '그래서', 반대면 '하지만'.
   * 흐름의 비슷함은 원소 관계로 판단한다 (북돋움 → 그래서, 부딪침 → 하지만, 중립·메이저 → 그리고).
   */
  function connector(a, b) {
    var tone = RELATION_TEXT[relation(a, b)].tone;
    if (tone === 'support') return '그래서';
    if (tone === 'clash') return '하지만';
    return '그리고';
  }

  function keywordPair(card) {
    var k = card.keywords || [];
    if (k.length >= 2) return k[0] + josa(k[0], '과와') + ' ' + k[1];
    return k[0] || card.nameKo;
  }

  var ENDING_LEAD = {
    time: '앞으로의 흐름은',
    advice: '조언을 따랐을 때의 결과는',
    obstacle: '걸림돌을 지난 뒤의 결과는',
    relation: '두 사람의 관계는'
  };

  /**
   * 세 장을 하나의 이야기로 이어 읽은 총평 ("그래서 결말은?").
   * profile: { age: 숫자|null, gender: 'none'|'female'|'male' } — 문장 첫머리에만 쓰고 해석은 바꾸지 않는다.
   * 반환: { opening, flow: [문장 3개], endingLead, endingText, notes: [문장…] }
   */
  function summarize(hand, areaKey, spreadKey, profile) {
    if (!hand || hand.length !== 3) throw new Error('카드 3장이 필요합니다');
    var area = areaByKey(areaKey);
    if (!area) throw new Error('알 수 없는 영역: ' + areaKey);
    var spread = spreadByKey(spreadKey);
    var pos = spread.positions;
    var a = hand[0];
    var b = hand[1];
    var c = hand[2];
    var kwA = keywordPair(a);
    var kwB = keywordPair(b);
    var kwC = keywordPair(c);
    var mainB = (b.keywords && b.keywords[0]) || b.nameKo;

    var who = profileText(profile);
    var opening = (who ? who + '의 ' : '') + area.label + josa(area.label, '을를') + ' 세 장으로 이어 읽으면 이렇습니다.';

    var flow = [];
    flow.push('‘' + pos[0] + '’ 자리에는 ' + a.nameKo + josa(a.nameKo, '이가') + ' 나와 ' + kwA + josa(kwA, '을를') + ' 보여 줍니다.');
    if (spread.key === 'advice') {
      flow.push('이 상황에서 카드가 건네는 조언은 ' + b.nameKo + '의 ‘' + mainB + '’입니다.');
    } else if (spread.key === 'obstacle') {
      flow.push('이때 걸림돌은 ' + b.nameKo + josa(b.nameKo, '이가') + ' 보여 주는 ‘' + mainB + '’입니다.');
    } else {
      flow.push(connector(a, b) + ' ‘' + pos[1] + '’ 자리의 ' + b.nameKo + josa(b.nameKo, '은는') + ' ' + kwB + josa(kwB, '을를') + ' 말합니다.');
    }
    flow.push(connector(b, c) + ' ‘' + pos[2] + '’ 자리의 ' + c.nameKo + '에서 ' + kwC + josa(kwC, '으로') + ' 이어집니다.');

    var endingLead = (ENDING_LEAD[spread.key] || ENDING_LEAD.time) + ' ' + c.nameKo + ' 카드가 말해 줍니다.';
    var endingText = (c.areas && c.areas[areaKey]) || '';
    if (!endingText) throw new Error(c.id + ' 카드에 ' + area.label + ' 해석이 없습니다');

    var notes = [];
    var effect = centerEffect(hand);
    if (effect.level === 'strong') {
      notes.push('양옆 카드가 가운데 카드를 북돋아 흐름에 힘이 실려 있습니다. 이 결말은 비교적 뚜렷하게 나타날 가능성이 큽니다.');
    } else if (effect.level === 'weak') {
      notes.push('다만 양옆 카드가 가운데 카드의 힘을 약하게 해, 결말은 기대보다 늦거나 작게 나타날 수 있습니다.');
    } else if (effect.level === 'pure') {
      notes.push('양옆 카드가 서로 힘을 상쇄해, 가운데 ' + b.nameKo + '의 ‘' + mainB + '’' + josa(mainB, '이가') +
        ' 이 이야기의 중심입니다. 결말도 이 점을 붙잡고 읽으세요.');
    } else if (effect.level === 'major') {
      notes.push('가운데 메이저 카드 ' + b.nameKo + josa(b.nameKo, '은는') +
        ' 실제 일보다 마음가짐을 보여 줍니다. 결말도 그 마음이 어떻게 움직이느냐에 달려 있습니다.');
    } else {
      notes.push('가운데 카드는 큰 영향 없이 본래의 뜻대로 흐르니, 결말도 카드 뜻 그대로 읽으면 됩니다.');
    }
    if (c.arcana === 'major') {
      notes.push('마지막 카드가 메이저라, 결말은 겉으로 드러나는 일보다 마음과 태도에서 먼저 나타납니다.');
    }

    return { opening: opening, flow: flow, endingLead: endingLead, endingText: endingText, notes: notes };
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
    areaByKey: areaByKey,
    areaLabel: areaLabel,
    spreadByKey: spreadByKey,
    GENDERS: GENDERS,
    parseAge: parseAge,
    profileText: profileText,
    josa: josa,
    connector: connector,
    summarize: summarize,
    secureRandom: secureRandom
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Reading;
  } else {
    root.Reading = Reading;
  }
})(typeof self !== 'undefined' ? self : this);
