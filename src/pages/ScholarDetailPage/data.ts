import type { ScholarDetail, CommentsByLang } from "./types";

export const SCHOLAR: ScholarDetail = {
  id: 1,
  name: { EN: "Malek Bennabi", AR: "مالك بن نبي", FR: "Malek Bennabi" },
  subtitle: { EN: "Malik ibn al-Nabi • Bennabi Al-Jazairi", AR: "مالك بن نبي • بن نبي الجزائري" },
  createdBy: "Ahmed Benali", createdByUrl: "/profile/ahmed-benali", createdDate: "March 1, 2026",
  lastUpdatedBy: "Fatima Zahra", lastUpdatedByUrl: "/profile/fatima-zahra", lastUpdatedDate: "June 12, 2026",
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYo9_bcR7fmJOfz7nDYlP7a3T1KpuJVFUT3Bn4kf9VHOSr9pj8KvDqtnmloDja-vHVNoPoXEaGQf8hjA3c6zJ8oR54lDyhMb6R6genD073t3jrAj-oxsGBWjICwWnjvI6jLyD89lpMYBy0f1aPL413vHWqaUSlV8Srdgn0umfRAsmCC_c3ZGwYzmcMI-mmNjU6R2PuQ02B-VbHshC_L6fcA5lH8Nrx85bBdxzWr6cbpn_9AhQ283C6SvlKAutkKIsqwuTMDYDeseMl",
  quote: {
    EN: '"Civilization is the result of a vital spark… and it is the product of the interaction between three fundamental elements: Man, Soil, and Time."',
    AR: '"الحضارة هي نتاج شرارة حيوية… وهي ثمرة التفاعل بين ثلاثة عناصر أساسية: الإنسان والتراب والوقت."',
  },
  overviewText: {
    EN: 'Malek Bennabi was one of the most prominent thinkers of the 20th century Algerian intellectual renaissance. An engineer by training and a philosopher by calling, he dedicated his life to analyzing the conditions of civilizational decline and rebirth, coining the influential concept of "colonizability."',
    AR: 'كان مالك بن نبي من أبرز مفكري النهضة الفكرية الجزائرية في القرن العشرين. مهندس بالتكوين وفيلسوف بالدعوة، كرّس حياته لتحليل شروط الانحطاط الحضاري والنهوض.',
  },
  body: {
    EN: [
      "Malek Bennabi was born in Constantine, Algeria, in 1905 during the height of French colonial occupation. Educated in both the traditional Algerian circles and later as an engineer in Paris, he developed a unique socio-philosophical lens that combined technical precision with historical depth.",
      'His seminal contribution, the concept of "colonizability", argued that external colonization was only possible where internal psychological and social structures had already deteriorated. This shifted the focus of decolonization efforts from purely political liberation to a fundamental civilizational renewal.',
    ],
    AR: [
      "وُلد مالك بن نبي في قسنطينة، الجزائر، عام 1905 في ذروة الاحتلال الاستعماري الفرنسي.",
      'أسهامه الجوهرية تتمثل في مفهوم "القابلية للاستعمار".',
    ],
  },
  atAGlance: {
    fullName: "Malek Bennabi", born: "1905, Constantine", died: "1973, Algiers",
    century: "20th Century", region: "North Africa",
    discipline: "Social Sciences, Philosophy", expertise: "Social Theory, Philosophy of History",
  },
  contributors: [
    { name: "Ahmed Benali",  contributions: 12, profileUrl: "/profile/ahmed-benali" },
    { name: "Fatima Zahra", contributions: 8,  profileUrl: "/profile/fatima-zahra" },
    { name: "Yacine",       contributions: 3,  profileUrl: "/profile/yacine" },
  ],
  works: [
    { title: "The Quranic Phenomenon",                   year: 1946, format: "BOOK",       digitalAccess: "pdf"   },
    { title: "Conditions of the Renaissance",            year: 1948, format: "BOOK",       digitalAccess: "audio" },
    { title: "The Problem of Ideas in the Muslim World", year: 1970, format: "MANUSCRIPT", digitalAccess: null    },
  ],
  media: [
    { type: "pdf",   title: "The Quranic Phenomenon", description: "Full text including original foreword by Mahmoud Shaker and Sayyid Qutb.", meta: "PDF • 2.4 MB",  action: "OPEN DOCUMENT",  actionIcon: "arrow_forward" },
    { type: "audio", title: "1968 Cairo Lecture",      description: "Historic seminar on civilizational crisis recorded at Al-Azhar University.", meta: "Audio • 45:00", action: "PLAY RECORDING", actionIcon: "play_circle"   },
    { type: "video", title: "The Life and Thought",    description: "Documentary series exploring his legacy in modern Algiers and Paris.",        meta: "Video • HD",    action: "WATCH NOW",      actionIcon: "open_in_new"   },
  ],
  intellectualLineage: [
    { initials: "AB", color: "#0b4335", textColor: "#fff",    name: "Ben Badis",   role: "Teacher",             profileUrl: "/scholar/ben-badis"   },
    { initials: "IK", color: "#d9dad8", textColor: "#404945", name: "Ibn Khaldun", role: "Historical Influence", profileUrl: "/scholar/ibn-khaldun" },
  ],
  notableDisciples: [
    { initials: "AM", color: "#735c00", textColor: "#fff", name: "El-Messiri", role: "Egypt / Modernity", profileUrl: "/scholar/el-messiri" },
    { initials: "RG", color: "#5c2e29", textColor: "#fff", name: "Ghannushi",  role: "Social Activism",   profileUrl: "/scholar/ghannushi"  },
  ],
  relatedScholars: [
    { labelColor: "#0b4335", label: "Specialty: Socio-politics", name: "Sayyid Qutb",  description: "Mutual Correspondent"         },
    { labelColor: "#735c00", label: "Region: North Africa",      name: "Frantz Fanon", description: "Contemporary Dialectic"       },
    { labelColor: "#5c2e29", label: "Era: 20th Century",         name: "Ali Shariati", description: "Sociology of Islamic Thought" },
  ],
  academicReferences: [
    { text: "Bennabi, M. (1948). Les Conditions de la Renaissance. Alger: Éditions de la Renaissance d'Algérie." },
    { text: "Stenberg, L. (1996). The Islamization of Science: Four Muslim Positions Developing an Islamic Modernity. Lund Studies." },
    { text: "Naylor, P. C. (2000). France and Algeria: A History of Decolonization and Transformation. Univ. Press of Florida." },
  ],
  revisionHistory: [
    { author: "Dr. Yusuf Al-Masri", date: "Mar 14, 2024", description: "Bibliography expansion",  isPrimary: true  },
    { author: "Omar Benali",        date: "Jan 20, 2024", description: "Initial profile creation", isPrimary: false },
  ],
  recentRevisions: [
    { date: "12/06/2026", author: "Ahmed Benali",  action: "Added new book",           authorUrl: "/profile/ahmed-benali"  },
    { date: "08/06/2026", author: "Fatima Zahra",  action: "Corrected death date",     authorUrl: "/profile/fatima-zahra"  },
    { date: "01/06/2026", author: "Yacine",        action: "Added academic reference", authorUrl: "/profile/yacine"        },
  ],
};

export const SEED_COMMENTS: CommentsByLang = {
  EN: [{ id: 1, author: "Prof. Sarah Jenkins", role: "Peer Reviewer", text: "The distinction between Bennabi's concept of 'Colonizability' and Fanon's 'Colonized Mind' is often blurred. I suggest adding a comparative sidebar in the next revision.", time: "2 days ago", votes: 12, replies: [] }],
  AR: [{ id: 1, author: "د. خالد العمري", role: "أكاديمي", text: "مفهوم القابلية للاستعمار عند بن نبي يختلف جذريًا عن مفهوم الوعي الاستعماري عند فانون. أقترح إضافة مقارنة موسّعة في المراجعة القادمة.", time: "منذ 3 أيام", votes: 7, replies: [] }],
  FR: [],
};