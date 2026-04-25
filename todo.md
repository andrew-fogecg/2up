# HeadsOrTails Review Tasks

## Completed

- [x] Implement live social-mode UI gating for the main labels, banners, and validation errors.
- [x] Fix currency display and amount formatting in the balance, history, potential award, and MAX amount flow.
- [x] Render the full Stake disclaimer in the live footer.
- [x] Add a Game Info / Rules modal with multiplier table, game modes, round flow, button guide, RTP/max award, and modal keyboard guards.
- [x] Validate the frontend build after the above changes.

## Next steps

- [x] Fix social-currency stake precision for `SC` / `XSC` / `GC` / `XGC`.
	Stake entry and display precision now derive from an explicit social-currency wager step so fractional bets like `0.1 SC` are possible.

- [x] Add regression coverage for compliance-critical text and social-currency precision.
	Playwright now checks the live malfunction disclaimer and verifies fractional `SC` stake entry through round completion.

- [x] Decide how QA screenshot artifacts should be handled in git.
	Generated visual-review output is now ignored so local QA runs do not pollute the worktree.

- [x] Implement actual replay mode with `?replay=` handling.
	Add event loading, replay state wiring, support for `currency`, `language`, and `amount` overrides, and a clear separation between normal play and replay play in `frontend/src/main.js`.

- [x] Add a persistent `REPLAY MODE` banner and replay-again behavior.
	The banner must stay visible for the full replay session, spacebar must not trigger live play during replay, and the end of replay needs a button to replay the same event again.

- [x] Add an always-visible sound toggle with session-persisted mute state.
	Wire `frontend/src/audio/SoundEngine.js` mute/unmute controls into `frontend/src/main.js`, keep the control accessible across layouts, and persist the choice in session storage.

- [x] Replace the stale Playwright suite with tests for the current Two-Up game.
	Remove the old template assertions from `frontend/tests/app.spec.js` and add coverage for the live UI, social-mode wording, Game Info modal behavior, and spacebar guards.

- [x] Add replay-focused regression tests.
	Cover `?replay=` handling, replay banner visibility, replay-again flow, URL override parsing, and replay keyboard restrictions.

- [ ] Run a manual approval pass after replay and sound are complete.
	Verify social wording, replay flow, sound toggle persistence, modal behavior, and current build output before moving on to RGS integration.
