# Two-tier architecture: repository → command, no service or controller layer

**Status**: accepted

hanako-bot is deliberately a **two-tier** architecture: commands and events import repositories directly. There is no `services/`, `controllers/`, `container.js`, or Discord-side `middleware/` directory. An earlier attempt at CSR (controller–service–repository) with a dependency-injection container was built and then reverted on purpose in PR #22/#23 — the service layer added indirection without value for a codebase of this size, serving a single Discord server. `LevelRepository` also merges what were once separate level and reward repositories, on purpose.

This is recorded so that future architecture reviews — human or automated — do not re-suggest splitting the repositories or re-introducing a service/controller layer.

## Considered Options

- **Keep/extend CSR + DI** — rejected: indirection without value at this size.
- **Re-split `LevelRepository` into score and reward repositories** — rejected: it reverses the deliberate merge.
