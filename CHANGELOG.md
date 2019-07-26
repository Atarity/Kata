# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Check: [List of generators](https://github.com/myles/awesome-static-generators)
- Request: To check the extension with [tags parsing](https://github.com/patleeman/VSNotes)
- Highlighting: closed task (dim)
- Highlighting: strike-thru (stroke)
- Request: report non .MD filenames into console.log on Show Stats
- Request: breakdown stats by filetypes years and months. Show results in temp file
- Request: add python tool for olde journal entries conversion
- Request: add job for jekyll site compilation from a notes

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