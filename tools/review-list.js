// 교안 외 추론으로 쓴 해석만 모아 검토용 목록을 만든다.
// 실행: node tools/review-list.js > docs/해석_검토목록.md
const R = require('../js/reading.js');
const deck = R.buildDeck([
  ...require('../js/data/major.js'),
  ...require('../js/data/wands.js'),
  ...require('../js/data/cups.js'),
  ...require('../js/data/swords.js'),
  ...require('../js/data/pentacles.js')
]);

const lines = [];
let total = 0;
lines.push('# 해석 검토 목록 (교안 외 추론)');
lines.push('');
lines.push('교안에 해당 영역의 해석이 없어 원소·숫자·계급 원리로 추론해 쓴 문장입니다. 학교급별 친구 해석, 그림 속 상징, 지금 해 볼 일도 모두 추론으로 쓴 문장입니다.');
lines.push('고칠 문장은 `js/data/` 안의 같은 카드·영역을 바꾸면 되고, 확인을 마친 영역은 그 카드의 `inferred` 목록에서 지우면 됩니다. 상징·학교급·해 볼 일은 확인 표시 없이 이 목록에서 체크만 하면 됩니다.');
lines.push('이 파일은 `node tools/review-list.js > docs/해석_검토목록.md`로 다시 만들 수 있습니다.');
lines.push('');
const SCHOOL_LABEL = { elementary: '초등 친구', middle: '중등 친구', high: '고등 친구' };
for (const c of deck) {
  const extra = c.symbols.length + Object.keys(c.friendBySchool).length + (c.advice ? 1 : 0);
  if (!c.inferred.length && !extra) continue;
  lines.push(`## ${c.nameKo} (${c.nameEn})`);
  for (const a of R.AREAS) {
    if (!c.inferred.includes(a.key)) continue;
    lines.push(`- [ ] **${a.label}**: ${c.areas[a.key]}`);
    total++;
  }
  // v3에서 새로 쓴 문장 (전부 추론): 학교급별 친구 해석, 그림 속 상징, 지금 해 볼 일
  for (const k of Object.keys(SCHOOL_LABEL)) {
    if (!c.friendBySchool[k]) continue;
    lines.push(`- [ ] **${SCHOOL_LABEL[k]}**: ${c.friendBySchool[k]}`);
    total++;
  }
  for (const sym of c.symbols) {
    lines.push(`- [ ] **그림 속 상징**: ${sym}`);
    total++;
  }
  if (c.advice) {
    lines.push(`- [ ] **지금 해 볼 일**: ${c.advice}`);
    total++;
  }
  lines.push('');
}
lines.splice(2, 0, `총 ${total}개 문장`, '');
process.stdout.write(lines.join('\n') + '\n');
