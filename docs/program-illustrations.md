# Program illustrations

Each program has a hand-built cartoon drawn in SVG code (no generated images):

- `apps/web/src/components/program-art/kit.tsx` — the cartoon kit: a `Person` with poses (`down`, `raised`, `praise`, `book`, `mic`, `micup`, `clasp`, `point`, `wave`, `write`, `lap`), seated/kneeling/standing, hair styles (`short`, `fade`, `afro`, `puff`, `braids`, `wrap`, `bob`), skin tones, outfits, glasses, back view; plus `StageDisc`, `Ribbon`, `Chair`, `Stars`.
- `apps/web/src/components/program-art/scenes.tsx` — one scene per program (640×360), registered in `SCENES` by program slug.

| Slug | Scene |
|---|---|
| gathering-of-the-adelphos | Students on chairs in a circle on an orange rug, afternoon sun through the window, Bible open, speech bubbles |
| night-of-solemnities | Night sky with moon and stars, a clock past midnight, preacher with mic on the stage, students kneeling and lifting hands, candles |
| academic-excellence-retreat | Outdoor retreat table with books, graduation cap and laptop, one student praying over the books, a lightbulb idea |
| prophetic-convocation | Light rays over a glowing stage, preacher with mic, worshippers on stage, crowd from behind with hands raised |
| business-masterclass | Presenter pointing at a rising bar chart, students with laptops, briefcase, lightbulb |

An uploaded cover image (Admin → Programs) replaces the cartoon for that program. A new program without a scene shows a branded icon tile. To add a scene, write a component in `scenes.tsx` and add it to `SCENES` under the program's slug.
