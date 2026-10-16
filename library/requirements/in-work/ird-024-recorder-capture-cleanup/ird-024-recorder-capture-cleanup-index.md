---
id: ird-024
title: Release recorder-owned capture tracks
status: in-work
owner: Chelsea Hulin
created: 2026-09-05
---

# IRD 024: Release recorder-owned capture tracks

## Problem and evidence

`SessionRecorder.start()` calls `canvas.captureStream(30)`. Its `onstop` only
cancels the animation frame, and failed construction/start has no cleanup.
Repeated takes therefore leave owned capture tracks alive after recording.
The stream also borrows the session microphone, which must remain live after
each take. This lifecycle is part of PRD 003's record/review/record-again loop.

## Required behavior

- Stop recorder-owned canvas tracks after normal recording stop.
- Clean up canvas tracks and animation on failed recorder construction/start.
- Never stop a microphone track borrowed from the connected session.
- Retain the final data chunk and existing format/filename/duration behavior.
- Avoid duplicate active recording starts leaking additional streams.

## Verification

Use a controlled MediaRecorder/canvas harness in Vitest. Show the owned-track
cleanup assertions fail on baseline, then pass with the fix. Cover a second
take, startup failure, and stopping while paused. Complete lint, typecheck,
all tests, a production build, and real local board recording QA.
