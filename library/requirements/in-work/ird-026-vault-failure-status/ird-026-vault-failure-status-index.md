---
id: ird-026
title: Show unavailable local storage honestly
status: in-work
owner: Chelsea Hulin
created: 2026-09-05
---

# IRD 026: Vault initialization failure

## Problem

`Studio.tsx` catches `initializeProjectVault()` errors but marks recovery ready.
Creator Home then claims the vault is ready and enables project creation,
which fails again when storage is unavailable. A brief toast is insufficient.

## Acceptance

- A failed initialization never shows ready/on or enables project creation.
- Show a persistent explanation with instructions to allow site storage and a
  retry action. Never clear storage as a repair action.
- Retrying reloads the studio after the user adjusts browser settings.
- Existing successful startup remains unchanged.
- Regression-render Creator Home in unavailable and healthy states; reproduce
  IndexedDB failure in an isolated browser and confirm recovery after retry.

This fixes PRD 003's readiness experience and PRD 004's honest local-first setup.
