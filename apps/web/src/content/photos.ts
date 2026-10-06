/**
 * Photos from PHANET KNUST gatherings, served from /public/photos (WebP, max 1600px, metadata stripped).
 * Order here is the order on the Gallery page. Add a photo: drop the file in /public/photos and add a line.
 */
export type Photo = { src: string; width: number; height: number; alt: string };

export const PHOTOS: Photo[] = [
  { src: "/photos/group-indoor.webp", width: 1600, height: 1200, alt: "Large group photo of PHANET KNUST members at an indoor gathering" },
  { src: "/photos/group-night.webp", width: 1280, height: 960, alt: "PHANET members gathered for a group photo at night" },
  { src: "/photos/group-hall.webp", width: 1280, height: 960, alt: "A small group of members posing together in a hall" },
  { src: "/photos/friends-five.webp", width: 1200, height: 1600, alt: "Five friends smiling together outdoors on campus" },
  { src: "/photos/worship.webp", width: 756, height: 1008, alt: "A young man praying with his eyes closed during worship" },
  { src: "/photos/session-room.webp", width: 960, height: 1280, alt: "Members seated in a conference room during a session" },
  { src: "/photos/session-slides.webp", width: 1280, height: 960, alt: "Students listening to a presentation with slides" },
  { src: "/photos/minister-mic.webp", width: 960, height: 1280, alt: "A minister speaking into a microphone" },
  { src: "/photos/minister-greeting.webp", width: 810, height: 1080, alt: "A minister greeting students seated in a row" },
  { src: "/photos/question-mic.webp", width: 1200, height: 1600, alt: "A student asking a question with a microphone" },
  { src: "/photos/listening.webp", width: 960, height: 1280, alt: "Young women listening closely during a session" },
  { src: "/photos/young-man.webp", width: 1200, height: 1600, alt: "A young man listening during a meeting" },
  { src: "/photos/selfie.webp", width: 960, height: 1280, alt: "Three friends taking a selfie together" },
  { src: "/photos/three-friends.webp", width: 1200, height: 1600, alt: "Three young women smiling together" },
  { src: "/photos/two-friends.webp", width: 1200, height: 1600, alt: "Two friends posing outdoors" },
  { src: "/photos/two-brothers.webp", width: 1200, height: 1600, alt: "Two young men standing together outdoors" },
  { src: "/photos/sunlit.webp", width: 1200, height: 1600, alt: "Two young women smiling together in the afternoon sun" },
  { src: "/photos/pair.webp", width: 960, height: 1280, alt: "A young man and young woman posing together" },
  { src: "/photos/attentive.webp", width: 960, height: 1280, alt: "Two young women listening attentively" },
  { src: "/photos/evening.webp", width: 960, height: 1280, alt: "Two friends posing at an evening event" },
];

export const photo = (name: string): Photo => {
  const p = PHOTOS.find((x) => x.src === `/photos/${name}.webp`);
  if (!p) throw new Error(`Unknown photo: ${name}`);
  return p;
};
