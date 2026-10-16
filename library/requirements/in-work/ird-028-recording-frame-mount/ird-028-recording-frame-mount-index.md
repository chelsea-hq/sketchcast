---
id: ird-028
title: Measure the recorded area when the studio mounts
status: in-work
owner: Chelsea Hulin
created: 2026-09-05
---

# IRD 028: Recording frame mount timing

## Reproduction and cause

Open `/studio` on project home, then create/open a 16:9 project without changing
format. The frame remains at its default `x=0,y=0,w=960,h=540`. The sizing effect
runs on initial home mount when `stageRef.current` is null, and only depends on
format, so it never observes the subsequently mounted board. A real recording
showed the lower diagram content cropped from the downloaded take.

## Fix

Extract the frame measurement into a hook whose effect follows canvas visibility
as well as format. Observe/rescale the stage when it mounts, when the studio
layout changes during recording, and when format changes. Disconnect when the
stage is removed. Keep the existing frame geometry and export resolution rules.

## Regression

Mount the hook with the canvas absent, reveal the same-format canvas, and assert
that a ResizeObserver attaches and the recorded frame changes from its default.
Test observer cleanup and a resized stage. The mount case must fail before the
dependency fix. Then verify the visible frame and an actual downloaded recording.
