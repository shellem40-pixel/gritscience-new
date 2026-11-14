/*
  시간표 데이터 (홈 화면 "개설 과정" 카드 + 시간표&커리큘럼 페이지가 함께 사용)

  ■ REGULAR_COURSES : 학년별 정규 과정
    - id      : 시간표 페이지 구역 주소 (schedule.html#middle 등). 바꾸지 마세요.
    - tag     : 홈 카드 왼쪽 네모 칸 글자 (중등, 고1 ...)
    - classes : 반 목록. 홈 카드에는 name 이 한 줄씩 나옵니다.
        name  : 반 이름
        sub   : 이름 옆 괄호 글자 (없으면 생략)
        times : 요일/시간 목록. 비워 두면 "시간 추후 안내"로 나옵니다.
                "토요반 오후 2:30-5:00" 처럼 쓰면 첫 단어가 굵게 나옵니다.
        curr  : 커리큘럼 주소 (data/curriculum.js 의 id)

  ■ WINTER : 겨울방학 특강
    - open: false 로 바꾸면 홈 화면 배너와 시간표 페이지의 특강 구역이 숨겨집니다.
    - classes 에 { ... } 를 추가하면 시간표 카드가 자동으로 늘어납니다.
        grade    : 학년 (같은 글자끼리 묶여서 위쪽 학년 버튼이 자동으로 생깁니다)
        sessions : 요일과 시간 여러 줄 [{ day: "월·수·금", time: "오후 2:00-4:30" }, ...]
        status   : "모집중" / "마감임박" / "마감" (없으면 표시 안 함)
*/
const REGULAR_COURSES = [
  {
    id: "middle",
    tag: "중등",
    title: "중등 과학 내신대비",
    classes: [
      { name: "중등 내신대비반", times: ["일요반", "토요반", "화요반", "수요반"], curr: "m-base" },
      { name: "중등 내신대비+선행반", times: [], curr: "m-plus" },
      { name: "고등과정 선행반+내신대비", times: [], curr: "m-high" }
    ],
    notes: [
      { label: "개인 수준별 첨삭 수업", items: ["화요일", "수요일"] }
    ]
  },
  {
    id: "high1",
    tag: "고1",
    title: "고1 통합과학 내신대비",
    classes: [
      { name: "고1 통합과학 내신대비반", times: ["토요반 오후 2:30-5:00", "토요반 오후 7:30-10:00", "일요반 오후 5:00-7:30"], curr: "h1-int" },
      { name: "고2과정 물리·화학 선행반+내신대비반", times: [], curr: "h1-pre" }
    ]
  },
  {
    id: "high2",
    tag: "고2",
    title: "고2 과학 내신대비",
    classes: [
      { name: "고2 물리학 내신대비반", times: ["토요반 오후 2:30-5:00", "토요반 오후 7:30-10:00", "일요반 오후 5:00-7:30"], curr: "h2-phy" },
      { name: "고2 화학 내신대비반", times: [], curr: "h2-chem" },
      { name: "고2 생명과학 내신대비반", times: [], curr: "h2-bio" }
    ]
  },
  {
    id: "high3",
    tag: "고3",
    title: "고3 내신 · 수능 대비",
    classes: [
      { name: "고3 물·화·생 내신대비반", times: [], curr: "h3-naesin" },
      { name: "고3 통합과학 수능반", sub: "문과반, 이과반", times: [], curr: "h3-sat" }
    ]
  }
];

const WINTER = {
  open: true,
  banner: "겨울방학 특강 대 개강",
  title: "겨울방학 특강",
  period: "2026년 12월 말 ~ 2027년 2월 (예정)",
  apply: "전화 상담 후 접수",
  notice: "아래 특강 시간표는 기본 설계용 예시입니다. 확정되는 대로 바뀝니다.",
  classes: [
    {
      grade: "중등", name: "중등 과학 내신 겨울 완성",
      sessions: [{ day: "화·목", time: "오후 5:00-7:30" }],
      period: "4주", target: "중1 · 중2", status: "모집중", curr: "m-base"
    },
    {
      grade: "예비 고1", name: "예비 고1 통합과학 선행",
      sessions: [{ day: "월·수·금", time: "오후 2:00-4:30" }, { day: "토", time: "오전 10:00-12:30" }],
      period: "6주", target: "중3", status: "모집중", curr: "m-high"
    },
    {
      grade: "예비 고2", name: "예비 고2 물리학 선행",
      sessions: [{ day: "월·수", time: "오후 6:00-9:00" }],
      period: "6주", target: "고1", status: "마감임박", curr: "h1-pre"
    },
    {
      grade: "예비 고2", name: "예비 고2 화학 선행",
      sessions: [{ day: "화·목", time: "오후 6:00-9:00" }],
      period: "6주", target: "고1", status: "모집중", curr: "h1-pre"
    },
    {
      grade: "예비 고3", name: "예비 고3 물·화·생 내신 집중",
      sessions: [{ day: "토", time: "오후 2:00-5:00" }, { day: "일", time: "오후 2:00-5:00" }],
      period: "6주", target: "고2", status: "모집중", curr: "h3-naesin"
    },
    {
      grade: "예비 고3", name: "예비 고3 통합과학 수능 (문과반)",
      sessions: [{ day: "월·수", time: "오후 2:00-5:00" }],
      period: "8주", target: "고2", status: "모집중", curr: "h3-sat"
    },
    {
      grade: "예비 고3", name: "예비 고3 통합과학 수능 (이과반)",
      sessions: [{ day: "화·목", time: "오후 2:00-5:00" }],
      period: "8주", target: "고2", status: "모집중", curr: "h3-sat"
    }
  ]
};