# Academy courses

A course is a list of lessons. Each lesson can have its own short quiz. Students go through the lessons in order:

1. Watch the lesson (YouTube, audio or reading).
2. Take the lesson's quiz. Scoring at least the course pass mark completes the lesson and unlocks the next one. Students can retry as often as they need. Wrong questions are highlighted.
3. A lesson without a quiz is completed with "Mark complete".
4. When every lesson is complete, the certificate is issued. If the course also has a final quiz, the certificate is issued when that is passed.

The rules are enforced in the database (`supabase/migrations/0011_lesson_quizzes.sql`). The functions `submit_quiz_attempt` and `complete_lesson` grade and record progress. Students can't skip lessons or mark a quiz lesson complete without passing it.

## Setting up a course of 40 videos with 5 questions each

In Admin → Academy → your course:

1. **Add many lessons at once.** Paste one lesson per line: `Title | YouTube link | minutes`, for example `Who is an intercessor? | https://youtu.be/abc123 | 3`.
2. **Import quiz questions.** Click "Download template". You get a CSV with 5 blank rows per lesson. Fill it in (Excel or Google Sheets), save as CSV and upload it. Columns:
   - `Lesson`: the lesson number (1–40).
   - `Question`
   - `Option A` to `Option D`: leave unused options empty.
   - `Answer`: the letter (A–D) or number (1–4) of the correct option.
   - `Explanation`: optional, for your own notes.

   "Replace existing questions" is ticked by default, so re-uploading a corrected sheet overwrites the old questions for the lessons in the file. "Export questions" downloads what's there now, in the same format.
3. Open any lesson (Edit) to change its video or add, check or remove single questions.

The pass mark is set on the course (default 70%; with 5 questions that means 4 of 5 correct).

## Tests

`supabase/tests/run.sh` loads every migration into a scratch Postgres. It then runs `rls.sql` and `lesson-quizzes.sql`, which walks a student through locked lessons, a failed attempt, a pass and the certificate.
