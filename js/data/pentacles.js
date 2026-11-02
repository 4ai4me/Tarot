/*
 * 펜타클(흙) 14장 해석. 교안 바탕으로 새로 쓴 문장.
 * inferred: 교안에 해당 영역 해석이 없어 원소·숫자·계급 원리로 추론해 쓴 영역 (검토 필요).
 */
(function (root) {
  var cards = [
    {
      id: 'pentacles_ace', suit: 'pentacles', rank: 'ace', nameKo: '펜타클 에이스',
      keywords: ['준비된 시작', '기회', '실속', '안정'],
      summary: '구름 속 손이 금화를 내밀고 있다. 이미 준비된 상태에서 현실적인 기회가 손에 들어온다.',
      areas: {
        love: '준비된 사람이 나타나 연애가 시작된다. 나를 소중히 여기고 분명한 관계를 원한다.',
        heart: '나를 소중히 여기며 관계를 분명히 하고 싶어 한다.',
        job: '확실한 합격 기회가 들어온다.',
        study: '준비한 만큼 결과가 나오는 출발점이다.',
        business: '완벽하게 준비된 제안과 기회가 들어온다.',
        money: '기회에 그치지 않고 실제 돈이 손에 들어온다.',
        move: '준비해 둔 이동이 실제로 시작된다.'
      },
      inferred: ['job', 'study']
    },
    {
      id: 'pentacles_2', suit: 'pentacles', rank: '2', nameKo: '펜타클 2',
      keywords: ['버티기', '조율', '저글링', '고민'],
      summary: '두 개의 금화를 저글링하듯 다루는 사람. 버거운 현실을 어떻게든 유지해 내는 카드다.',
      areas: {
        love: '새 인연이 와도 연인으로 쉽게 발전하지 않는다. 이것저것 고민하며 지켜보는 중이다.',
        heart: '조금 힘들어도 관계를 이어 가고 싶다. 큰 변화는 바라지 않는다.',
        job: '여러 선택지를 동시에 저울질하느라 바쁘다. 결정이 늦어질 수 있다.',
        study: '해야 할 일이 많아 겨우겨우 맞춰 간다.',
        business: '유지하기 어렵게 만드는 방해가 꾸준히 생긴다. 밤낮없이 버텨야 한다.',
        money: '돌려막기를 해야 할 만큼 빠듯하다.',
        move: '확실히 이득이 되면 애써 움직이고, 아니면 움직이지 않는다.'
      },
      inferred: ['job', 'study']
    },
    {
      id: 'pentacles_3', suit: 'pentacles', rank: '3', nameKo: '펜타클 3',
      keywords: ['협업', '기반 쌓기', '전문성', '역할 분담'],
      summary: '성당 안에서 장인과 설계자가 함께 일하는 장면. 각자의 몫을 맡아 협력하며 기반을 쌓는다.',
      areas: {
        love: '딱 적당한 거리의 관계다. 그 정도의 마음이다.',
        heart: '호감은 있지만 적정선을 지키는 마음이다.',
        job: '실력을 인정받으며 함께 일할 자리를 얻는다.',
        study: '함께 공부하거나 도움을 주고받으면 실력이 탄탄해진다.',
        business: '경험 있는 사람들이 모여 함께 기반을 만드는 단계다.',
        money: '돈이 들어올 기반을 다지고 있다.',
        move: '이동을 위한 실제 준비가 시작됐다. 당장 떠나는 것은 아니다.'
      },
      inferred: ['heart', 'job', 'study']
    },
    {
      id: 'pentacles_4', suit: 'pentacles', rank: '4', nameKo: '펜타클 4',
      keywords: ['소유', '집착', '지키기', '고집'],
      summary: '금화를 꽉 끌어안고 앉은 사람. 가진 것을 잃을까 두려워 움켜쥐는 카드다.',
      areas: {
        love: '지금 붙잡고 있는 것이 더 중요해 연애가 진행되지 않는다.',
        heart: '놓치고 싶지 않아 집착하지만 행동으로는 옮기지 않는다.',
        job: '가진 것을 놓기 싫어 새 도전을 망설인다.',
        study: '익숙한 방식만 고집해 성적이 제자리에 머문다.',
        business: '안정적이지만 넓히거나 발전시키기 어렵다.',
        money: '새로 들어오는 돈이 없다. 기회가 와도 손해 보기 싫어 잡지 못한다.',
        move: '지금 가진 것을 지키느라 움직이지 않는다.'
      },
      inferred: ['job', 'study']
    },
    {
      id: 'pentacles_5', suit: 'pentacles', rank: '5', nameKo: '펜타클 5',
      keywords: ['결핍', '어려움', '소외', '불편함'],
      summary: '눈보라 속에서 불 켜진 창 아래를 지나는 두 사람. 함께 있어도 어려운 형편을 벗어나지 못하는 카드다.',
      areas: {
        love: '함께 있는 것이 불편하다. 연애가 잘되지 않는다.',
        heart: '같이 있어도 마음이 편치 않다.',
        job: '조건이 좋지 않다. 기대보다 못한 곳일 수 있다.',
        study: '여건이 어려워 성적이 오르기 힘들다.',
        business: '함께 일하려면 손해를 봐야 하는 상황이 생긴다.',
        money: '들어올 줄 알았던 돈이 오지 않고 시기도 불확실해진다.',
        move: '이동 과정이 불편하고 지금보다 못한 곳으로 갈 수 있다.'
      },
      inferred: ['heart', 'job', 'study']
    },
    {
      id: 'pentacles_6', suit: 'pentacles', rank: '6', nameKo: '펜타클 6',
      keywords: ['나눔', '베풂', '저울질', '도움'],
      summary: '저울을 들고 사람들에게 금화를 나눠 주는 상인. 베풀지만 속으로는 득실을 저울질하는 카드다.',
      areas: {
        love: '관심 가는 사람이 생긴다. 한 명이 아닐 수도 있고, 내가 시간과 마음을 베푼다.',
        heart: '호의를 베풀지만 속으로는 따져 보고 있다.',
        job: '도움을 주는 사람이 생긴다. 조건을 잘 따져 봐야 한다.',
        study: '가르치거나 도움을 받으며 함께 성장한다.',
        business: '주변에 베풀거나 도움을 받을 일이 생긴다.',
        money: '베풀고 나누는 데 돈이 나간다. 도움을 받을 수도 있다.',
        move: '예상보다 지출이 많은 이동이 된다.'
      },
      inferred: ['heart', 'job', 'study']
    },
    {
      id: 'pentacles_7', suit: 'pentacles', rank: '7', nameKo: '펜타클 7',
      keywords: ['성찰', '아쉬움', '개선', '기다림'],
      summary: '자라난 금화 덩굴을 바라보며 생각에 잠긴 농부. 결실은 있지만 만족하지 못해 과정을 되돌아보는 카드다.',
      areas: {
        love: '더 노력하고 싶은 상대가 있다. 지금 관계가 아직 부족하게 느껴진다.',
        heart: '지금 관계에 아쉬움이 있어 더 나아지기를 바란다.',
        job: '결과는 있지만 만족스럽지 않다. 더 나은 곳을 고민한다.',
        study: '성적은 나왔지만 아쉽다. 공부 방법을 돌아보면 더 오른다.',
        business: '이미 결실은 있다. 더 나은 방향을 찾아 고심하는 중이다.',
        money: '들어온 것은 있지만 더 늘릴 방법을 고민한다.',
        move: '고민하거나 집중할 일이 있어 움직이지 않는다.'
      },
      inferred: ['heart', 'job', 'study']
    },
    {
      id: 'pentacles_8', suit: 'pentacles', rank: '8', nameKo: '펜타클 8',
      keywords: ['성실', '숙련', '반복', '몰두'],
      summary: '금화를 하나씩 새겨 나가는 장인. 같은 일을 꾸준히 반복하며 실력을 쌓는 카드다.',
      areas: {
        love: '일과 돈벌이에 몰두해 연애에 신경 쓸 겨를이 없다.',
        heart: '지금은 자기 일에 빠져 있어 감정 표현이 적다.',
        job: '성실하게 쌓아 온 실력이 인정받는다.',
        study: '꾸준히 반복하는 공부가 실력을 만든다.',
        business: '지금과 같은 성과가 꾸준히 이어진다. 새로운 도전은 하지 않는다.',
        money: '같은 수입이 꾸준히 들어온다.',
        move: '다른 데 눈 돌릴 틈이 없어 움직이지 못한다.'
      },
      inferred: ['heart', 'job', 'study']
    },
    {
      id: 'pentacles_9', suit: 'pentacles', rank: '9', nameKo: '펜타클 9',
      keywords: ['풍요', '자립', '보상', '여유'],
      summary: '포도밭 정원에서 손등에 매를 얹은 여인. 스스로 공들여 이룬 풍요를 여유롭게 누리는 카드다.',
      areas: {
        love: '새 인연은 잘 생기지 않는다. 연인이 있어도 서운하게 할 수 있다.',
        heart: '혼자서도 충분해 관계에 크게 매달리지 않는다.',
        job: '쌓아 온 능력을 인정받아 좋은 결과를 얻는다.',
        study: '꾸준히 공들인 만큼 만족스러운 성적이 나온다.',
        business: '사업 기반이 생기고 그동안의 노력에 대한 보상을 받는다.',
        money: '그동안 공들인 만큼 재물이 차곡차곡 쌓인다.',
        move: '원하는 곳 어디든 움직일 수 있다. 굳이 움직이지 않아도 좋은 상황이다.'
      },
      inferred: ['heart', 'job', 'study']
    },
    {
      id: 'pentacles_10', suit: 'pentacles', rank: '10', nameKo: '펜타클 10',
      keywords: ['유산', '확장', '가족', '전해지지 않는 마음'],
      summary: '대가족과 노인이 함께 있는 저택 앞 풍경. 쌓은 재산이 주변으로 이어지지만 마음까지 전해지지는 않는 카드다.',
      areas: {
        love: '내가 모르는 사정이 있다. 내 마음의 가치가 상대에게 제대로 전해지지 않는다.',
        heart: '내 마음을 고맙게 받기보다 당연하게 여길 수 있다.',
        job: '규모 있는 곳과 연결된다. 집안이나 주변의 도움이 작용할 수 있다.',
        study: '여건은 넉넉하지만 결국 스스로의 노력이 결과를 가른다.',
        business: '사업이 커지고 실제 소득이 늘어난다.',
        money: '수입이 늘어난다. 가족이나 윗사람의 도움을 받기도 한다.',
        move: '비용 부담이 나에게 몰리는 이동일 수 있다. 가족의 도움으로 옮기기도 한다.'
      },
      inferred: ['heart', 'job', 'study']
    },
    {
      id: 'pentacles_page', suit: 'pentacles', rank: 'page', nameKo: '펜타클 페이지',
      keywords: ['배움', '성실', '조심성', '미래 준비'],
      summary: '금화를 두 손으로 받쳐 들고 바라보는 젊은이. 남들의 평가를 의식하며 조심스럽게 미래를 준비하는 인물이다.',
      areas: {
        love: '조심스럽게 천천히 다가간다. 주변 시선을 신경 쓴다.',
        heart: '진지하게 생각하지만 서두르지 않는다.',
        job: '배우며 준비하는 단계다. 차근차근 쌓으면 기회가 온다.',
        study: '성실하게 공부하며 실력을 쌓아 간다.',
        business: '작게 시작해 배우며 키워 간다.',
        money: '아끼며 미래를 위해 모은다.',
        move: '신중하게 알아보고 움직인다.'
      },
      inferred: ['love', 'heart', 'job', 'study', 'business', 'money', 'move']
    },
    {
      id: 'pentacles_knight', suit: 'pentacles', rank: 'knight', nameKo: '펜타클 나이트',
      keywords: ['신중함', '보수적', '꾸준함', '정체'],
      summary: '멈춰 선 말 위에서 금화를 지켜보는 기사. 가진 것을 지키려 신중하게 머무는 인물이다.',
      areas: {
        love: '현실적인 가치 판단이 앞서 연애에는 소극적이다.',
        heart: '지금 상황을 따져 보니 연애에 마음을 쏟기 어렵다고 생각한다.',
        job: '확실한 곳만 노리며 신중하게 움직인다.',
        study: '진도는 느리지만 꾸준히 밀고 나간다.',
        business: '위험을 피하며 지금을 지킨다. 발전은 더디다.',
        money: '안전하게 지키는 데 집중한다.',
        move: '확실해질 때까지 움직이지 않는다.'
      },
      inferred: ['job', 'study', 'business', 'money', 'move']
    },
    {
      id: 'pentacles_queen', suit: 'pentacles', rank: 'queen', nameKo: '펜타클 퀸',
      keywords: ['보살핌', '실속', '품위', '안정'],
      summary: '꽃 핀 정원에서 금화를 무릎에 품은 여왕. 현실적인 방식으로 주변을 넉넉하게 보살피는 인물이다.',
      areas: {
        love: '현실적으로 잘 챙겨 주는 안정된 관계다.',
        heart: '나를 실속 있게 챙기고 싶어 한다.',
        job: '품위 있고 믿음직한 인상으로 좋은 결과를 얻는다.',
        study: '공부 환경을 잘 갖추고 꾸준히 관리한다.',
        business: '가치 있어 보이는 일에 적극적으로 나선다.',
        money: '살림을 알뜰하고 넉넉하게 꾸린다.',
        move: '편안하고 품위 있는 이동을 택한다.'
      },
      inferred: ['love', 'heart', 'job', 'study', 'business', 'money', 'move']
    },
    {
      id: 'pentacles_king', suit: 'pentacles', rank: 'king', nameKo: '펜타클 킹',
      keywords: ['성취', '효율', '부', '안정된 기반'],
      summary: '포도와 황소 문양에 둘러싸인 왕. 오랜 노력 끝에 물질적 성취를 이룬 인물이다.',
      areas: {
        love: '안정적이고 든든한 관계다. 감정보다 현실을 앞세운다.',
        heart: '효율과 실리를 따지며 관계를 바라본다.',
        job: '탄탄한 조건의 자리를 얻는다.',
        study: '효율적인 방법으로 확실한 결과를 낸다.',
        business: '효율을 따져 확실한 성과를 낸다.',
        money: '재물운이 탄탄하다.',
        move: '득실을 따져 이득이 확실할 때 움직인다.'
      },
      inferred: ['love', 'heart', 'job', 'study', 'business', 'money', 'move']
    }
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = cards;
  else (root.TAROT_DATA = root.TAROT_DATA || []).push.apply(root.TAROT_DATA, cards);
})(typeof self !== 'undefined' ? self : this);
