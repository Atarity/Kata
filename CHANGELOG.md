# Changelog
All notable changes of the project are documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Check: [List of generators](https://github.com/myles/awesome-static-generators)
- Request: add job for jekyll site compilation from a notes

## [0.0.11] — 2019-09-07
### Added
- Tags autocompletion added. With Unicode support.
- "Filter notes by tag" feature added.
- "Show Statistics" feature added.
- Unified index for notes implemented. Smart index update make tags. stats and sorting work lightning-fast even with 10k files.
- New "todo hotkey" cycling behaviour.
- Nested todos added.
- ~~Strikethru~~ for closed tasks.
- Grammar injection for closed tasks (now they are dimmable).
- DB tools scripts added for debug, testing, notes import.
- Updated activation conditions for extension. No more homeDir in settings.
- Work with any directory which contains file named ```.todomator```.
- Updated notifications. Now with emoji!
- New "Symfony code" concept by Siropkin.)

## [0.0.5] — 2019-05-23
### Fixed
- If entered filename contains forbidden symbols it'll not be created.
- New line todo are not selected after hotkey press anymore (.replace → .insert).
- Extension homeDir path now normilized with Node Path module.
- Extension homeDir points to real home dir now and NOT to year dir. If directory not exist it will be created.
- Show stats command works across whole homeDir now.

## [0.0.4] — 2019-05-22
### Added
- One key todo loop with Ctrk+Shift+Q: If todo not in current string → add it. If todo in string → close it. If todo closed → open it.

## [0.0.2] — 2019-05-20
### Added
- Hotkey for `- [ ]` added — Ctrl+Shift+Q
- When cursor are in task line you can "close" it with Ctrl+Shift+W
### Deleted
- Get rid of frustrated `~~` syntax. 

## [0.0.1] — 2018-06-03
### Added
- File creation with auto-naming
- Pre-fill YAML meta section in each note (title-based)
- User settings for default dirrectory for different operating systems (tdm.homeDir)
- Hotkey for new entry (Ctrl+T)
- Show statistics command registered for debug needs