# Changelog

All notable changes to CoreDash are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions match the
Git tags and GitHub releases. Each published release builds the Docker Hub image.

Only stable releases are listed. Pre-releases (`-dev`, `-pre`) are rolled into
the next stable version; 0.1.2, 0.1.3 and 0.1.8 never had a stable release.

## [Unreleased]

## [0.1.15] - 2026-09-10

### Added

- The price drop widget shows whether wishlist prices were updated today, with
  the time of the last update. Backed by the new `GET /api/wishlist/status`.

### Changed

- The price drop widget refreshes every 15 minutes and whenever the tab becomes
  visible again.

## [0.1.14] - 2026-09-10

### Added

- Wishlist price drop widget listing the biggest decreases between the last two
  price snapshots (`GET /api/wishlist/drops`).
- Configure the Amazon Brazil wishlist from the widget by pasting its ID or URL
  (`/api/wishlist/config`).
- Runtime settings for timezone, location, crawl schedule, AI model and calendar
  IDs, editable from the settings panel and stored in the database
  (`/api/settings`). They override the matching environment variables.

## [0.1.13] - 2026-09-10

### Added

- Scheduled Amazon wishlist crawl that records a price snapshot for every item
  (`CRON_SCHEDULE`, `WISHLIST_ID`).

## [0.1.12] - 2026-09-10

### Changed

- Dark mode is now the default theme.

## [0.1.11] - 2026-09-09

### Fixed

- Focus mode fills the full screen height on tablets in landscape.

## [0.1.10] - 2026-09-09

### Removed

- `BASE_URL` environment variable.

### Fixed

- Viewport sizing on mobile.
- Loading error and sizing issues in focus mode.

## [0.1.9] - 2026-09-09

### Added

- Focus mode.
- MCP server exposing the CoreDash APIs.
- `?format=toon` response format for API routes.
- Persistent SQLite storage, with MariaDB as an option.
- Docker healthcheck, non-root runtime and a local Compose setup.
- Landing page, deployed with GitHub Pages.

### Changed

- AI requests are rate-limited, and Spotify polling pauses while the tab is
  hidden.
- Debug endpoints are protected, and database indexes were added.
- Code is organized into feature modules under `features/`.

### Fixed

- Production start command.

## [0.1.7] - 2026-08-11

### Added

- Additional Google calendars in the calendar card.
- Alert sounds.
- Stable internal IDs for email messages.

### Changed

- Reworked the loading message.

## [0.1.6] - 2026-08-07

### Added

- Alert sounds are loaded dynamically.

## [0.1.5] - 2026-08-06

### Added

- Gmail card: lists recent emails, loads more on demand and marks messages as
  read, backed by new email API routes.
- Spotify card.
- Rain alert with sound.
- Calendar API can return all upcoming events (`?includeFutureEvents=true`) and
  tags holidays.
- Settings panel for choosing which cards are shown.
- Configurable Ollama model.
- Loading animations, GIFs and SVG particles.
- Todo API can filter for unchecked tasks.

### Changed

- Faster initial loading.
- Only birthdays count as important calendar events.
- Reorganized the folder structure and removed unused cards.

### Fixed

- Infinite loading state.
- Cards not refreshing when the day changes.

## [0.1.4] - 2026-04-06

### Added

- Ollama AI provider with streaming responses.

### Changed

- AI instructions now cover habits.

### Fixed

- Production build error.

## [0.1.1] - 2026-04-04

### Added

- Structured logging with winston.

## [0.1.0] - 2026-03-31

First release: a self-hosted dashboard for older hardware, with cards for
weather, calendar, todo, habits, goals, stocks, news, flights, products and the
Amazon wishlist, plus an AI assistant that summarizes the day.

[Unreleased]: https://github.com/guilhermesalviano/coredash/compare/v0.1.15...HEAD
[0.1.15]: https://github.com/guilhermesalviano/coredash/compare/v0.1.14...v0.1.15
[0.1.14]: https://github.com/guilhermesalviano/coredash/compare/v0.1.13...v0.1.14
[0.1.13]: https://github.com/guilhermesalviano/coredash/compare/v0.1.12...v0.1.13
[0.1.12]: https://github.com/guilhermesalviano/coredash/compare/v0.1.11...v0.1.12
[0.1.11]: https://github.com/guilhermesalviano/coredash/compare/v0.1.10...v0.1.11
[0.1.10]: https://github.com/guilhermesalviano/coredash/compare/v0.1.9...v0.1.10
[0.1.9]: https://github.com/guilhermesalviano/coredash/compare/v0.1.7...v0.1.9
[0.1.7]: https://github.com/guilhermesalviano/coredash/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/guilhermesalviano/coredash/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/guilhermesalviano/coredash/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/guilhermesalviano/coredash/compare/v0.1.1...v0.1.4
[0.1.1]: https://github.com/guilhermesalviano/coredash/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/guilhermesalviano/coredash/releases/tag/v0.1.0
