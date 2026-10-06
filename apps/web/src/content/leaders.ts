/**
 * PHANET KNUST leadership, shown in the "Leadership" drop-down on the About page.
 * Photos live in /public/leaders (numbered as on the original contact sheet).
 * Order: Central Executive Committee, Congress convenor, then ministry heads
 * (each co-head / assistant right after their head). Reorder freely.
 */
export type Leader = { photo: string; name: string; role: string };

const p = (n: number) => `/leaders/leader-${String(n).padStart(2, "0")}.webp`;

export const LEADERS: Leader[] = [
  // Central Executive Committee
  { photo: p(7), name: "Nick Hopwood Danquah", role: "Head, Central Executive Committee" },
  { photo: p(2), name: "Kofi Annan Kumah", role: "Member, Central Executive Committee" },
  { photo: p(15), name: "Prince Owusu Osei Amoako", role: "Member, Central Executive Committee" },
  // Congress
  { photo: p(11), name: "Papa Kobina Osei Amanfo", role: "Convenor, PHANET Tertiary Congress" },
  // Pastors and ministry heads
  { photo: p(10), name: "Caleb Morrison", role: "Pastor, Kumasi Technical University" },
  { photo: p(4), name: "Rita Owusu Agyeiwaa", role: "Head, Prayer" },
  { photo: p(13), name: "David Kornu", role: "Head, Shepherding" },
  { photo: p(6), name: "Cindy Collins", role: "Head, Evangelism" },
  { photo: p(3), name: "Edward Amponsah", role: "Assistant Head, Evangelism" },
  { photo: p(16), name: "Caroline Yalley", role: "Head, Finance" },
  { photo: p(18), name: "Bettina Adomako", role: "Head, Media" },
  { photo: p(1), name: "Elisha Bentil Ampah", role: "Co-Head, Media" },
  { photo: p(14), name: "Akwasi Maisu", role: "Head, Academics" },
  { photo: p(17), name: "Ivy Nyarkoaa", role: "Head, Mobilization" },
  { photo: p(5), name: "Freda Phidel Boakye", role: "Head, Protocol" },
  { photo: p(8), name: "El-Shaddai Lartey", role: "Head, Instrumentalists" },
  { photo: p(9), name: "Randy Opoku Mensah", role: "Head, Transportation" },
  { photo: p(12), name: "Edward Asare", role: "Head, Birthdays" },
];
