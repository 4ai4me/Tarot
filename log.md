# 작업 기록

## 2026-11-02 — v1: 세 장 타로 첫 버전

**시작**
- Tier: 2
- 목표: 질문 영역을 고르고 카드 3장을 뽑으면 교안 바탕 해석과 카드 사이 원소 관계를 한 화면에서 본다.
- 완료 기준: 승인된 스펙의 수용 기준 5개 (서로 다른 3장, 영역별 해석, 관계·가운데 판정 표시, 휴대폰 가로 스크롤 없음, 면책 문구)
- 회귀 위험: 없음 (빈 저장소에서 시작)

**완료**
- 변경 파일: index.html, css/style.css, js/app.js, js/reading.js, js/data/{major,wands,cups,swords,pentacles}.js, tests/{reading,data}.test.js, tools/review-list.js, docs/해석_검토목록.md, docs/VIBE_REFERENCE.md, AGENTS.md, CLAUDE.md, README.md, TEST_PLAN.md, log.md, .nojekyll
- 확인한 것:
  - `node --test` → 17개 통과, 0개 실패 (뽑기 중복 없음·편향 없음·범위, 원소 관계 전체 조합, 가운데 판정 6가지 경우, 78장 구성·id·7개 영역 문장 존재, 추론 표시 형식)
  - 크롬(헤드리스)으로 1280px·390px·다크 모드 화면을 열어 영역 선택 전 버튼 비활성, 뽑기 후 3장·관계·판정·해석 표시, 가로 스크롤 없음(scrollWidth = 화면 너비)을 확인, 자바스크립트 오류 없음
- 확인하지 못한 것:
  - 위키미디어 카드 그림: 작업 환경에서 위키미디어 접속이 막혀 파일 이름과 실제 표시를 확인하지 못함. 실패 시 그린 카드 면으로 대체되는 동작만 확인함
  - 구글 웹폰트 로딩 (같은 이유)
  - 실제 GitHub Pages 주소에서의 동작
- 남은 위험·후속 작업:
  - 추론으로 쓴 해석 199문장 검토 필요 (docs/해석_검토목록.md)
  - 그림 파일 이름이 틀리면 그린 카드 면만 보임 → Pages에서 확인 후 필요하면 그림을 저장소에 직접 넣기
  - 메이저 카드 원소는 중립으로 둠 (사용자 확인 대기, 바꾸려면 js/reading.js normalize)
- 다음 세션 인계: v1 브랜치 내용이 main에 합쳐지고 Pages가 켜졌는지 먼저 확인. 해석 검토 결과를 받으면 js/data/에 반영하고 inferred에서 해당 영역 삭제.
