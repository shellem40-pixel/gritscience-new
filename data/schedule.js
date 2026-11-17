/*
  시간표 데이터 (홈 화면 "개설 과정" 카드 + 시간표&커리큘럼 페이지가 함께 사용)
  ※ 글자만 바꿀 때는 홈페이지 주소 뒤에 ?edit 를 붙여 화면에서 바로 고칠 수 있습니다.
    반을 새로 만들거나 지울 때만 이 파일을 고칩니다.

  ■ HOME_COURSES : 홈 화면 "개설 과정" 카드에 보이는 요약 (key 는 바꾸지 마세요)

  ■ REGULAR_COURSES : 정규 수업 (시간표 PDF 기준)
    - id      : 시간표 구역 주소 (schedule.html#g-h1 등)
    - level   : "고등" → [정규수업 고등] 탭, "중등" → [정규수업 중등] 탭
    - tag     : 위쪽 바로가기 버튼 글자
    - sub     : 구역 제목 아래 작은 글자
    - classes : 반 목록
        id     : 커리큘럼(data/curriculum.js)과 연결되는 이름. 바꾸지 마세요.
        name   : 반 이름 / target : 대상 / sub : 이름 옆 괄호 글자
        times  : 요일·시간 목록 (비워 두면 "시간 추후 안내")
        book   : 교재 (커리큘럼의 교재 칸과 함께 쓰입니다)

  ■ WINTER : 겨울방학 특강 (아직 미정 · 아래는 기본 설계용 예시)
*/
const HOME_COURSES = [
  {
    tag: "중등", tagKey: "@grp.middle.tag", href: "schedule.html#middle",
    lines: [
      { key: "@home.m-naesin", text: "중등 내신대비반" },
      { key: "@home.m-sky", text: "중등 내신+선행반 (개인별 수준 첨삭수업)" },
      { key: "@home.m-pre", text: "고등과정 선행반+중등 내신반" }
    ]
  },
  {
    tag: "고1", tagKey: "@grp.high1.tag", href: "schedule.html#g-h1",
    lines: [
      { key: "@cls.h1-int.name", text: "고1 통합과학 내신대비반" },
      { key: "@cls.h1-pre.name", text: "고2과정 물리·화학 선행+고1 내신대비반" },
      { key: "@home.h1-hist", text: "고1 한국사 내신대비반" }
    ]
  },
  {
    tag: "고2", tagKey: "@grp.high2.tag", href: "schedule.html#g-h2",
    lines: [
      { key: "@cls.h2-phy.name", text: "고2 물리학 내신대비반" },
      { key: "@cls.h2-chem.name", text: "고2 화학 내신대비반" },
      { key: "@cls.h2-bio.name", text: "고2 생명과학 내신대비반" }
    ]
  },
  {
    tag: "고3", tagKey: "@grp.high3.tag", href: "schedule.html#g-h3",
    lines: [
      { key: "@cls.h3-naesin.name", text: "고3 물·화·생 내신대비반" },
      { key: "@cls.h3-sat.name", text: "고3 통합과학 수능반" },
      { key: "@home.h3-soc", text: "고3 통합사회 수능반" }
    ]
  }
];

const REGULAR_COURSES = [
  /* ===================== 정규 수업 중등부 ===================== */
  {
    id: "g-m-naesin", level: "중등", tag: "내신대비",
    title: "중등 내신대비반",
    classes: [
      { id: "r-m1", name: "중등 1-1학기 시작반", target: "중1",
        times: ["수요반 오후 5:00-7:30"], book: "오투 중등1-1" },
      { id: "r-m2", name: "중등 2-1학기 시작반", target: "중2",
        times: ["화요반 오후 5:00-7:30", "토요반 오후 4:00-6:30", "일요반 오후 4:00-6:30"], book: "오투 중등2-1" },
      { id: "r-m3", name: "중등 3-1학기 시작반", target: "중3",
        times: ["목요반 오후 5:00-7:30"], book: "오투 중등3-1" }
    ]
  },
  {
    id: "g-m-sky", level: "중등", tag: "내신+선행",
    title: "중등 내신 + 선행반",
    sub: "개인별 수준 첨삭수업",
    classes: [
      { id: "r-msky", name: "중등 내신+선행반", target: "중1, 중2",
        times: ["월요반 오후 5:00-7:30", "토요반 오후 1:00-3:30", "수요반 오후 4:00-6:00", "수요반 오후 8:00-10:00"],
        { book: "오투 + 자체교재" }
    ]
  },
  {
    id: "g-m-pre", level: "중등", tag: "고등 선행",
    title: "고등과정 선행반 + 중등 내신반",
    classes: [
      { id: "r-mint", name: "고등통합과학 + 내신대비", target: "중1, 중2, 중3",
        times: ["일요반 오전 10:00-12:30", "토요반 오후 7:00-9:30"], book: "자체 개념 교재 + 부교재" },
      { id: "r-mint3", name: "고등통합과학 + 내신대비", target: "중3",
        times: ["토요반 오후 1:00-3:30", "일요반 오전 10:00-12:30", "일요반 오후 7:00-9:30"], book: "자체 개념 교재 + 부교재" },
      { id: "r-mpc", name: "고등 물리학 + 화학 선행반",
        times: ["일요반 오전 10:00-12:30"], book: "자체 개념 교재 + 부교재" }
    ]
  },

  /* ===================== 정규 수업 고등부 ===================== */
  {
    id: "g-h1", level: "고등", tag: "고1",
    title: "고1 통합과학 내신대비",
    classes: [
      { id: "r-h1int", name: "고1 통합과학 내신대비반",
        times: ["월요반 오후 7:30-10:00", "목요반 오후 7:30-10:00", "토요반 오전 10:00-12:30", "토요반 오후 4:00-6:30",
                "토요반 오후 7:00-9:30", "일요반 오후 1:00-3:30", "일요반 오후 4:00-6:30", "일요반 오후 7:00-9:30"],
        { book: "자체교재 + 부교재" },
      { id: "r-h1pc", name: "고2과정 물리+화학 선행 + 고1 내신대비반",
        times: ["토요반 오후 7:00-9:30", "일요반 오전 10:00-12:30", "일요반 오후 7:00-9:30"],
        { book: "자체교재 + 개념완성" }
    ]
  },
  {
    id: "g-h1-hist", level: "고등", tag: "한국사",
    title: "고1 한국사 내신대비",
    classes: [
      { id: "r-h1hist", name: "고1 한국사 내신대비반",
        times: ["토요반 오전 10:00-12:30"], book: "한끝 (한국사1)" }
    ]
  },
  {
    id: "g-h2", level: "고등", tag: "고2",
    title: "고2 과학 내신대비",
    classes: [
      { id: "r-h2chem", name: "고2 화학 내신대비반",
        times: ["화요반 오후 7:30-10:00", "수요반 오후 7:30-10:00", "목요반 오후 7:30-10:00",
                "토요반 오후 4:00-6:30", "일요반 오전 10:00-12:30", "일요반 오후 4:00-6:30"],
        { book: "자체교재" },
      { id: "r-h2phy", name: "고2 물리학 내신대비반",
        times: ["화요반 오후 5:00-7:30", "토요반 오전 10:00-12:30", "토요반 오후 7:00-9:30", "일요반 오후 1:00-3:30"],
        { book: "자체교재 + 부교재" },
      { id: "r-h2bio", name: "고2 생명과학 내신대비반",
        times: ["월요반 오후 7:30-10:00", "화요반 오후 7:30-10:00", "목요반 오후 5:00-7:30",
                "토요반 오후 1:30-4:00", "일요반 오후 7:00-9:30"],
        { book: "자체교재" }
    ]
  },
  {
    id: "g-h3", level: "고등", tag: "고3",
    title: "고3 과학 내신 · 수능 대비",
    classes: [
      { id: "r-h3chem", name: "고3 화학 내신대비반", sub: "화학반응의 세계",
        times: ["일요반 오후 1:00-3:00"], book: "자체교재" },
      { id: "r-h3phy", name: "고3 물리학 내신대비반", sub: "전자기와 양자",
        times: ["월요반 오후 7:30-10:00", "화요반 오후 7:30-10:00", "일요반 오후 4:00-6:30"], book: "자체교재" },
      { id: "r-h3bio", name: "고3 생명과학 내신대비반", sub: "생물의 유전",
        times: ["화요반 오후 5:00-7:30", "목요반 오후 7:30-10:00", "일요반 오전 10:00-12:30"], book: "자체교재" },
      { id: "r-h3sci", name: "통합과학 수능반",
        times: ["월요반 오후 5:00-7:30", "수요반 오후 7:30-10:00", "토요반 오후 4:00-6:30", "일요반 오후 7:00-9:30"],
        { book: "자체교재 + 자이스토리" },
      { id: "r-h3soc", name: "통합사회 수능반",
        times: ["토요반 오후 1:00-3:30", "금요반 오후 6:00-8:30"], book: "자체교재 + 자이스토리" }
    ]
  }
];

/* 예전 주소(schedule.html#high1 등)로 들어와도 맞는 구역으로 이동 */
const GROUP_ALIAS = { high1: "g-h1", high2: "g-h2", high3: "g-h3" };

const WINTER = {
  open: true,
  banner: "겨울방학 특강 대 개강",
  title: "겨울방학 특강",
  period: "2026년 12월 말 ~ 2027년 2월 (예정)",
  apply: "전화 상담 후 접수",
  notice: "겨울방학 특강 시간표는 아직 확정되지 않았습니다. 아래는 기본 설계용 예시이며, 확정되는 대로 바뀝니다.",
  classes: [
    {
      id: "w-mid", grade: "중등", name: "중등 과학 내신 겨울 완성",
      sessions: [{ day: "화·목", time: "오후 5:00-7:30" }],
      period: "4주", target: "중1 · 중2", status: "모집중"
    },
    {
      id: "w-pre1", grade: "예비 고1", name: "예비 고1 통합과학 선행",
      sessions: [{ day: "월·수·금", time: "오후 2:00-4:30" }, { day: "토", time: "오전 10:00-12:30" }],
      period: "6주", target: "중3", status: "모집중"
    },
    {
      id: "w-pre2-phy", grade: "예비 고2", name: "예비 고2 물리학 선행",
      sessions: [{ day: "월·수", time: "오후 6:00-9:00" }],
      period: "6주", target: "고1", status: "마감임박"
    },
    {
      id: "w-pre2-chem", grade: "예비 고2", name: "예비 고2 화학 선행",
      sessions: [{ day: "화·목", time: "오후 6:00-9:00" }],
      period: "6주", target: "고1", status: "모집중"
    },
    {
      id: "w-pre3-naesin", grade: "예비 고3", name: "예비 고3 물·화·생 내신 집중",
      sessions: [{ day: "토", time: "오후 2:00-5:00" }, { day: "일", time: "오후 2:00-5:00" }],
      period: "6주", target: "고2", status: "모집중"
    },
    {
      id: "w-pre3-sat-l", grade: "예비 고3", name: "예비 고3 통합과학 수능 (문과반)",
      sessions: [{ day: "월·수", time: "오후 2:00-5:00" }],
      period: "8주", target: "고2", status: "모집중"
    },
    {
      id: "w-pre3-sat-s", grade: "예비 고3", name: "예비 고3 통합과학 수능 (이과반)",
      sessions: [{ day: "화·목", time: "오후 2:00-5:00" }],
      period: "8주", target: "고2", status: "모집중"
    }
  ]
};