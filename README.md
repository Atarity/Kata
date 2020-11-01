# Kata VS Code extension

Kata is a simple automator for everyday note taking needs. Each note entry:
- Saved in .md file with name like ```2018-06-13-todo.md```
- Have an YAML meta data at the beggining of a file. It contains "Title" and "Tags" sections with autocompleteon.

## 🦄 Features
- Automatic file naming and meta data addition
- Hotkey for todo state cycling
- Nested todos
- Tags autocompletion for notes
- Notes filtering by tags
- Brief statistics
- Old-fashioned cloud sync
- Grammar injection for wider theme options (you could dim closed tasks)
- All your files and notes are only yours.

## 🎮 How to install and use
1. Open folder with your Notes or create new folder then open it from VS Code as a folder.
1. Create empty file named `.Kata` and put it to your Notes folder.
1. Open VS Code. From F1 menu Run `>Extensions: Install from VSIX...`. Point to the Kata extension file with .vsix extension.
1. Press <kbd>Ctrl</kbd>+<kbd>T</kbd> to create new note file. A name could be corrected before confirmation.
1. Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Q</kbd> to create new todo entry in file.
1. Fill free to use all Markdown capabilities in your notes.

## 🔧 Extension Settings
This extension contributes the following settings:

* `kata.strikethruOnDone`: If enabled all closed tasks will wrapped in `~~` so it will be ~~stroke~~ during rendering.

## 🐛 Known Issues
It's a proto, so most of exceptions not even tried to be caught.

## 🆕 Release notes
You can find detailed release notes in `Changelog.md`

## 📦 Packaging for off-the-Marketplace distribution
- `npm install` and `npm install -g vsce`
- `npm run compile`
- `vsce package`
- [VS code tut on packaging and publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#packaging-extensions)