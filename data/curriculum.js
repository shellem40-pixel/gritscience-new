/*
  커리큘럼 데이터
  - id 는 시간표 버튼 주소(curriculum.html#m3 등)와 연결됩니다. 바꾸지 마세요.
*/
const MIDDLE_STEPS = [
  { title: "개념 마인드맵", desc: "단원의 핵심 개념을 한 장의 마인드맵으로 구조화해 전체 흐름을 잡습니다." },
  { title: "문제은행 기본 훈련", desc: "과학쟁이 문제은행으로 개념별 기본 유형을 반복 연습합니다." },
  { title: "개인 수준별 첨삭", desc: "화·수 첨삭 수업에서 취약한 유형을 개인별로 보완합니다." },
  { title: "학교별 기출 분석", desc: "재학 중인 학교의 출제 경향을 분석해 서술형까지 대비합니다." },
  { title: "실전 모의평가 · 오답 정리", desc: "시험 형식의 모의평가 후 스마트 오답노트로 마무리합니다." }
];

const HIGH_STEPS = [
  { title: "개념 마인드맵 · 원리 이해", desc: "공식 암기 전에 원리와 단원 간 연결을 먼저 정리합니다." },
  { title: "문제은행 유형 훈련", desc: "내신 빈출 유형을 난이도별로 단계적으로 훈련합니다." },
  { title: "학습 데이터 분석", desc: "오답 데이터를 분석해 취약 단원과 실수 패턴을 진단합니다." },
  { title: "고난도 · 서술형 심화", desc: "변별력 문항과 서술형 답안 작성을 집중적으로 다룹니다." },
  { title: "내신 실전 모의고사", desc: "학교 시험과 같은 형식으로 실전 감각을 완성합니다." }
];

const MIDDLE_TIME = "일요반 · 토요반 · 화요반 · 수요반";
const HIGH_TIME = "토요반 오후 2:30-5:00 · 토요반 오후 7:30-10:00 · 일요반 오후 5:00-7:30";

const CURRICULUM = [
  { id: "m3", short: "중등3", group: "중등 과학 내신대비", title: "중등 3학년 커리큘럼", target: "중학교 3학년", time: MIDDLE_TIME, goal: "고등 과학으로 이어지는 핵심 개념을 완성하고 중3 내신을 대비합니다.", steps: MIDDLE_STEPS },
  { id: "m2", short: "중등2", group: "중등 과학 내신대비", title: "중등 2학년 커리큘럼", target: "중학교 2학년", time: MIDDLE_TIME, goal: "중등 과학의 기초 개념을 탄탄히 다지고 학교 내신을 대비합니다.", steps: MIDDLE_STEPS },
  { id: "m1", short: "중등1", group: "중등 과학 내신대비", title: "중등 1학년 커리큘럼", target: "중학교 1학년", time: MIDDLE_TIME, goal: "과학 공부 습관을 만들고 첫 내신 시험을 준비합니다.", steps: MIDDLE_STEPS },
  { id: "h1", short: "고1 통합과학", group: "고1 통합과학 내신대비", title: "고1 통합과학 커리큘럼", target: "고등학교 1학년", time: HIGH_TIME, goal: "고1 통합과학 내신 1등급을 목표로 합니다.", steps: HIGH_STEPS },
  { id: "h2", short: "고2 물리학", group: "고2 물리학 내신대비", title: "고2 물리학 커리큘럼", target: "고등학교 2학년", time: HIGH_TIME, goal: "고2 물리학 내신 1등급을 목표로 합니다.", steps: HIGH_STEPS }
];