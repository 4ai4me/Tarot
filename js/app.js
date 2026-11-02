/* 화면 동작. 판정은 reading.js, 해석문은 js/data/*.js 에 있다. */
(function () {
  'use strict';

  var R = window.Reading;
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var RANK_KO = { page: '페이지', knight: '나이트', queen: '퀸', king: '킹', ace: '에이스' };
  var SVG_NS = 'http://www.w3.org/2000/svg';
  // 그림을 불러오지 못할 때 쓰는 슈트 문양 (단순한 선 그림)
  var EMBLEMS = {
    wands: 'M32 6 L32 58 M32 16 q-9 -2 -11 -9 M32 26 q9 -2 11 -9 M32 38 q-8 -2 -10 -8',
    cups: 'M16 10 h32 q0 22 -16 24 q-16 -2 -16 -24 Z M32 34 v14 M22 54 h20 M26 48 h12',
    swords: 'M32 4 L37 14 L37 44 L27 44 L27 14 Z M18 44 h28 M32 44 v12 M28 58 h8',
    pentacles: 'M32 8 a24 24 0 1 0 0.01 0 Z M32 14 L43 48 L14 27 L50 27 L21 48 Z',
    major: 'M32 6 L37 25 L56 20 L42 34 L52 54 L32 43 L12 54 L22 34 L8 20 L27 25 Z'
  };

  var deck;
  var state = { area: null, spread: R.SPREADS[0].key, gender: 'none', hand: null };

  function showLoadError(message) {
    var box = $('load-error');
    box.textContent = message;
    box.hidden = false;
    $('setup').hidden = true;
  }

  try {
    deck = R.buildDeck(window.TAROT_DATA || []);
    if (deck.length !== 78) throw new Error('카드가 ' + deck.length + '장만 불러와졌습니다');
  } catch (err) {
    console.error('[타로] 카드 데이터를 불러오지 못했습니다:', err);
    showLoadError('카드 데이터를 불러오지 못했습니다. 페이지를 새로고침해 보세요. (' + err.message + ')');
    return;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function chip(name, value, label, checked) {
    var wrap = el('label', 'chip');
    var input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.value = value;
    input.checked = !!checked;
    wrap.appendChild(input);
    wrap.appendChild(el('span', null, label));
    return wrap;
  }

  function buildControls() {
    var areas = $('areas');
    R.AREAS.forEach(function (a) { areas.appendChild(chip('area', a.key, a.label, false)); });
    var spreads = $('spreads');
    R.SPREADS.forEach(function (s, i) { spreads.appendChild(chip('spread', s.key, s.label, i === 0)); });
    var genders = $('genders');
    R.GENDERS.forEach(function (g) { genders.appendChild(chip('gender', g.key, g.label, g.key === state.gender)); });

    genders.addEventListener('change', function (e) {
      state.gender = e.target.value;
      if (state.hand) render(false);
    });
    $('age').addEventListener('input', function () {
      checkAge();
      if (state.hand) render(false);
    });

    areas.addEventListener('change', function (e) {
      state.area = e.target.value;
      $('draw').disabled = false;
      $('hint').textContent = '';
      if (state.hand) render(false);
    });
    spreads.addEventListener('change', function (e) {
      state.spread = e.target.value;
      if (state.hand) render(false);
    });
    $('setup').addEventListener('submit', function (e) {
      e.preventDefault();
      drawAndShow();
    });
    $('redraw').addEventListener('click', drawAndShow);
  }

  /** 나이 칸을 검사해 오류 문구를 보이거나 지운다. 반환: R.parseAge 결과 */
  function checkAge() {
    var input = $('age');
    var parsed = R.parseAge(input.value);
    $('age-error').textContent = parsed.ok ? '' : parsed.message;
    if (parsed.ok) input.removeAttribute('aria-invalid');
    else input.setAttribute('aria-invalid', 'true');
    return parsed;
  }

  /** 지금 입력된 나이·성별. 잘못된 나이는 빼고 쓴다 (오류 문구는 checkAge가 보여 준다). */
  function currentProfile() {
    var parsed = R.parseAge($('age').value);
    return { age: parsed.ok ? parsed.value : null, gender: state.gender };
  }

  function drawAndShow() {
    if (!state.area) {
      $('hint').textContent = '볼 영역을 먼저 고르세요.';
      return;
    }
    if (!checkAge().ok) {
      $('hint').textContent = '나이 칸을 고치거나 비워 주세요.';
      $('age').focus();
      return;
    }
    $('hint').textContent = '';
    state.hand = R.draw(deck, 3);
    render(true);
    var result = $('result');
    result.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    $('result-title').focus({ preventScroll: true });
  }

  function emblem(suit) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 64 64');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'emblem');
    var path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', EMBLEMS[suit]);
    svg.appendChild(path);
    return svg;
  }

  function topMark(card) {
    if (card.arcana === 'major') return card.roman;
    if (card.court || card.rank === 'ace') return RANK_KO[card.rank];
    return card.roman;
  }

  function loadImage(img, urls, onDone) {
    var i = 0;
    function next() {
      if (i >= urls.length) { onDone(false); return; }
      img.src = urls[i++];
    }
    img.addEventListener('load', function () { onDone(true); });
    img.addEventListener('error', next);
    next();
  }

  function cardElement(card, position, index, animate) {
    var fig = el('figure', 'card ' + (card.element ? 'el-' + card.element : 'el-major'));
    var inner = el('div', 'card-inner');
    var back = el('div', 'card-back');
    back.setAttribute('aria-hidden', 'true');
    var front = el('div', 'card-front');

    var face = el('div', 'face');
    face.appendChild(el('span', 'face-top', topMark(card)));
    var art = el('div', 'face-art');
    art.appendChild(emblem(card.arcana === 'major' ? 'major' : card.suit));
    face.appendChild(art);
    face.appendChild(el('span', 'face-name', card.nameKo));
    front.appendChild(face);

    var img = document.createElement('img');
    img.alt = card.nameKo + ' 카드 그림';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    loadImage(img, R.imageCandidates(card), function (ok) {
      if (ok) img.classList.add('is-loaded');
      else img.remove(); // 그림이 없으면 그린 카드 면을 그대로 보여 준다
    });
    front.appendChild(img);

    inner.appendChild(back);
    inner.appendChild(front);
    fig.appendChild(inner);
    fig.appendChild(el('figcaption', 'card-pos', position));

    if (animate && !reduceMotion) {
      setTimeout(function () { fig.classList.add('is-revealed'); }, 120 + index * 260);
    } else {
      fig.classList.add('is-revealed', 'no-anim');
    }
    return fig;
  }

  function linkElement(a, b) {
    var rel = R.relation(a, b);
    var info = R.RELATION_TEXT[rel];
    var link = el('div', 'link tone-' + info.tone);
    link.setAttribute('role', 'img');
    link.setAttribute('aria-label', a.nameKo + '와 ' + b.nameKo + ': ' + info.long);
    link.title = info.long;
    link.appendChild(el('span', 'link-line'));
    link.appendChild(el('span', 'link-label', info.short));
    return link;
  }

  function relationNotes(hand) {
    var list = el('ul', 'relation-notes');
    for (var i = 0; i < 2; i++) {
      var a = hand[i];
      var b = hand[i + 1];
      var info = R.RELATION_TEXT[R.relation(a, b)];
      var item = el('li', 'tone-' + info.tone);
      item.appendChild(el('strong', null, a.nameKo + ' – ' + b.nameKo));
      item.appendChild(document.createTextNode(' ' + info.long));
      list.appendChild(item);
    }
    return list;
  }

  function readingElement(card, position) {
    var art = el('article', 'reading ' + (card.element ? 'el-' + card.element : 'el-major'));
    art.appendChild(el('p', 'reading-pos', position));
    art.appendChild(el('h3', 'reading-name', card.nameKo));
    var meta = card.nameEn + (card.element ? ' / 원소 ' + R.ELEMENTS[card.element].ko : ' / 메이저');
    art.appendChild(el('p', 'reading-meta', meta));
    var kw = el('ul', 'keywords');
    card.keywords.forEach(function (k) { kw.appendChild(el('li', null, k)); });
    art.appendChild(kw);
    art.appendChild(el('p', 'reading-text', card.areas[state.area]));
    var more = el('details', 'reading-more');
    more.appendChild(el('summary', null, '카드 설명'));
    more.appendChild(el('p', null, card.summary));
    art.appendChild(more);
    return art;
  }

  function summaryElement(hand) {
    var frag = document.createDocumentFragment();
    var s;
    try {
      s = R.summarize(hand, state.area, state.spread, currentProfile());
    } catch (err) {
      console.error('[타로] 총평을 만들지 못했습니다:', err);
      frag.appendChild(el('p', 'summary-error', '총평을 만들지 못했습니다. 위의 카드별 해석을 참고해 주세요.'));
      return frag;
    }
    frag.appendChild(el('p', 'summary-opening', s.opening));
    frag.appendChild(el('p', 'summary-flow', s.flow.join(' ')));
    var ending = el('div', 'summary-ending');
    ending.appendChild(el('p', 'summary-lead', s.endingLead));
    ending.appendChild(el('p', 'summary-text', s.endingText));
    frag.appendChild(ending);
    s.notes.forEach(function (n) { frag.appendChild(el('p', 'summary-note', n)); });
    return frag;
  }

  function render(animate) {
    var hand = state.hand;
    var spread = R.spreadByKey(state.spread);
    var question = $('question').value.trim();
    var areaLabel = R.areaLabel(state.area);
    var who = R.profileText(currentProfile());

    $('result-title').textContent = question ? question : areaLabel + '에 대한 세 장';
    $('result-title').setAttribute('tabindex', '-1');
    $('result-title').dataset.area = who ? who + ' · ' + areaLabel : areaLabel;

    var table = $('table');
    table.textContent = '';
    hand.forEach(function (card, i) {
      table.appendChild(cardElement(card, spread.positions[i], i, animate));
      if (i < 2) table.appendChild(linkElement(card, hand[i + 1]));
    });

    var effect = R.centerEffect(hand);
    var box = $('center-effect');
    box.className = 'center-effect level-' + effect.level;
    box.textContent = '';
    box.appendChild(el('strong', null, '가운데 카드 '));
    box.appendChild(document.createTextNode(effect.text));
    box.appendChild(relationNotes(hand));

    var readings = $('readings');
    readings.textContent = '';
    var areaNote = el('p', 'area-note', areaLabel + ' 영역으로 읽은 해석');
    readings.appendChild(areaNote);
    hand.forEach(function (card, i) { readings.appendChild(readingElement(card, spread.positions[i])); });

    var summaryBody = $('summary-body');
    summaryBody.textContent = '';
    summaryBody.appendChild(summaryElement(hand));

    $('result').hidden = false;
  }

  buildControls();
})();
