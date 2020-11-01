import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { fileToTitle, toLocalTime, isValid } from './utils';

export const createNote = async (homeDir: string) => {
    const datetime = toLocalTime().toISOString().slice(0,10);
    const fileName = await vscode.window.showInputBox({
        prompt: 'Edit note\'s filename',
        value: `${datetime}-todo.md`,
        valueSelection: [11, 15]
    });
    let yearDir: string;
    let filePath: string;
    // Check null input or form esc
    if (!fileName) {
        return;
    }
    yearDir = path.join(homeDir, datetime.substring(0, 4));
    filePath = path.join(yearDir, fileName);   // homeDir to string
    // Check if the file name contains restricted chars
    if (!isValid(fileName)) {
        vscode.window.showErrorMessage(`${fileName} name contains forbidden characters.`);
        return;
    }
    // Check if the file already exist
    if (fs.existsSync(filePath)) {
        vscode.window.showErrorMessage(`${fileName} already exist. Try another name.`);
        return;
    }
    // Create dir if not exist
    if (!fs.existsSync(yearDir)) {
        fs.mkdirSync(yearDir);
        vscode.window.showInformationMessage(`New directory created. Happy NY, then! ${yearDir}`);
    }
    // Create new file
    const stream = fs.createWriteStream(filePath);
    stream.once('open', function() {
        stream.write('---\n');
        stream.write(`title: ${fileToTitle(fileName)}\n`);
        stream.write('tags: [ ]\n');
        stream.write('---\n\n');
        stream.write(`# ${fileToTitle(fileName)}\n`);
        stream.end();
    });
    // Open new file and move cursor
    const fileUri = vscode.Uri.file(filePath);  // OR uri.parse ("file:" + filePath)
    vscode.workspace.openTextDocument(fileUri).then(document => {
        vscode.window.showTextDocument(document).then(success => {
            if (success) {
                vscode.window.activeTextEditor.selection = new vscode.Selection(new vscode.Position(7, 0), new vscode.Position(7, 0));
            } else {
                vscode.window.showInformationMessage('Error while creating the note!');
                return;
            }
        });
    });
}

export const toggleTask = () => {
    const strike = vscode.workspace.getConfiguration().get('kata.Strike');

    const newTaskMarks = ['- [  ]', '- [ ]', '- []'];
    const doneTaskMarks = ['- [X]', '- [x]', '- [Х]', '- [х]']; // Still no unicode

    const editor = vscode.window.activeTextEditor;
    const curs = editor.selection.active; // returns Position (line, char)

    let currLineText: string = editor.document.getText(new vscode.Range(curs.line, 0, curs.line + 1, 0));
    currLineText = currLineText.replace(/(\r\n|\n|\r)/gm, '');
    const currLineFirstSymbols = currLineText.trim().substr(0,5);
    const currLineFirstSymbolsIndex = currLineText.indexOf(currLineFirstSymbols);

    let curTodoText: string = '';
    let newLineText: string = '';
    let newLineStartText: string = (currLineFirstSymbols === '' && currLineText.length > 0) ? currLineText : currLineText.substring(0, currLineFirstSymbolsIndex);
    let newTodoText: string = '';

    const newTaskMarksIndex = newTaskMarks.indexOf(currLineFirstSymbols);
    const doneTaskMarksIndex = doneTaskMarks.indexOf(currLineFirstSymbols);

    if (newTaskMarksIndex > -1) {
        curTodoText = currLineText.split(newTaskMarks[newTaskMarksIndex])[1];
        curTodoText = curTodoText.trim();
        if (curTodoText) {
            if (strike) {
                newTodoText = `- [X] ~~${ curTodoText }~~`;
            } else {
                newTodoText = `- [X] ${ curTodoText }`;
            }
        }
    } else if (doneTaskMarksIndex > -1) {
        curTodoText = currLineText.split(doneTaskMarks[doneTaskMarksIndex])[1];
        const tildaFirstIndex = curTodoText.indexOf('~');
        const tildaLastIndex = curTodoText.lastIndexOf('~');
        if (tildaFirstIndex !== -1 && tildaFirstIndex !== tildaLastIndex) {
            curTodoText = curTodoText.split('~~')[1];
        }
        curTodoText = curTodoText.trim();
        newTodoText = `- [ ] ${ curTodoText }`;
    } else {
        curTodoText = currLineText.trim()
        newTodoText = `- [ ] ${ curTodoText }`;
    }

    newLineText = `${ newLineStartText }${ newTodoText }`;
    editor.edit(editBuilder => {
        editBuilder.replace(new vscode.Range(curs.line, 0, curs.line, currLineText.length), newLineText);
    });
    const lineRange = new vscode.Range(curs.line, 0, curs.line, newLineText.length);
    editor.selection = new vscode.Selection(lineRange.end, lineRange.end);
}
