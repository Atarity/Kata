# Todomator VS Code extension

Todomator is a simple automator for everyday note taking needs. Each note entry:
1. Saved in .md with file name like ```2018-06-13-todo.md```
2. Each entry have YAML meta data at the top of file. It contains "Title" and manually filled "Tags" sections.

## Useful links
- https://github.com/uctakeoff/vscode-counter
- https://github.com/Microsoft/vscode-extension-samples/tree/master/completions-sample

## Features

- Hotkey <kbd>Ctrl</kbd>+<kbd>T</kbd> to make new note entry with today's name, which can be easily corrected.
- Auto meta addition
- OS-related user settings for Notes home directory

## Extension Settings
This extension contributes the following settings:

* `tdm.homeDirMac`: Path to your Notes home directory. Use POSIX path to the directory with notes, like ```/Users/foo/Notes/```. It can be cloud folder with local representation. Like a Dropbox. Google Drive, etc.
* `tdm.homeDirWin`: same for Windows (with back-slashes → / ) in case you are using different machines.
* `tdm.homeDirLinux`: same for Linux.

## Known Issues
It's a proto, so most of exceptions not even tried to be caught.

## Packaging for off-the-Marketplace distribution
- `npm install` and `npm install -g vsce`
- `npm run compile`
- [VS code tut on packaging and publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#packaging-extensions)

## Release notes
You can find detailed release notes in `Changelog.md`

- File creation with auto-naming
- Pre-fill YAML meta section in each note (title-based)
- User settings for default dirrectory for different operating systems (tdm.homeDir)
- Hotkey for new entry (Ctrl+T)
- Hotkey for `- [ ]` — Ctrl+Shift+Q
- When cursor are in task line you can "close" it with Ctrl+Shift+W

