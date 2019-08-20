import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import {fileToTitle, toLocalTime, isValid} from "./utils";

export async function createNote(homeDir: string) {
    const datetime = toLocalTime().toISOString().slice(0,10);
    const fileName = await vscode.window.showInputBox({
        prompt: "Edit note's filename", 
        value: `${ datetime }-todo.md`, 
        valueSelection: [11, 15]
    });
    let yearDir: string;
    let filePath: string;
    // Check null input or form esc
    if (fileName === undefined || fileName === null || fileName === "" ) {
        return;
    }
    yearDir = path.join(homeDir, datetime.substring(0, 4));
    filePath = path.join(yearDir, fileName);   // homeDir to string
    // Check if the file name contains restricted chars
    if (!isValid(fileName)) {
        vscode.window.showErrorMessage(fileName + " name contains forbidden characters.");
        return;
    }
    // Check if the file already exist
    if (fs.existsSync(filePath)) {
        vscode.window.showErrorMessage(fileName + " already exist. Try another name.");
        return;
    }    
    // Create dir if not exist
    if (!fs.existsSync(yearDir)) {
        fs.mkdirSync(yearDir);
        vscode.window.showInformationMessage("New directory created. Happy NY, then! " + yearDir);
        //return;
    }
    // Create new file
    const stream = fs.createWriteStream(filePath);
    stream.once('open', function(fd) {
        stream.write("---\n");
        stream.write("title: " + fileToTitle(fileName) + "\n");
        stream.write("tags: [ ]\n");
        stream.write("---\n\n");
        stream.end();
    });
    // Open new file and move coursor
    const fileUri = vscode.Uri.file(filePath);  // OR uri.parse ("file:" + filePath)
    vscode.workspace.openTextDocument(fileUri).then(document => {
        vscode.window.showTextDocument(document).then(success => {
            if (success) {
                vscode.window.activeTextEditor.selection = new vscode.Selection(new vscode.Position(5, 0), new vscode.Position(5, 0));
            } else {
                vscode.window.showInformationMessage("Error while creating an note!");
                return;
            }
        });
    });
}

export function toggleTask() {
    const newTaskMarks = ['- [  ]', '- [ ]', '- []'];
    const doneTaskMarks = ['- [X]', '- [x]', '- [Х]', '- [х]'];

    const editor = vscode.window.activeTextEditor;
    const curs = editor.selection.active; // returns Position (line, char)
    const currLineText: string = editor.document.getText(new vscode.Range(curs.line, 0, curs.line + 1, 0));
    const currLineFirstSymbols = currLineText.trim().substr(0,5);
    const currLineFirstSymbolsIndex = currLineText.indexOf(currLineFirstSymbols);
    
    let newLineText: string = "";
    
    const newTaskMarksIndex = newTaskMarks.indexOf(currLineFirstSymbols);
    const doneTaskMarksIndex = doneTaskMarks.indexOf(currLineFirstSymbols);

    if (newTaskMarksIndex > -1) {
        let text = currLineText.split(newTaskMarks[newTaskMarksIndex])[1].trim();
        if (text) {
            newLineText = `${ currLineText.substring(0, currLineFirstSymbolsIndex) }- [X] ~~${ text }~~`;
        }
    } else if (doneTaskMarksIndex > -1) {
        let text = currLineText.split(doneTaskMarks[doneTaskMarksIndex])[1];
        const tildaFirstIndex = text.indexOf("~");
        const tildaLastIndex = text.lastIndexOf("~");
        if (tildaFirstIndex !== -1 && tildaFirstIndex !== tildaLastIndex) {
            text = text.split('~~')[1];    
        }
        text = text.trim();
        newLineText = `${ currLineText.substring(0, currLineFirstSymbolsIndex) }- [ ] ${ text }`;
    } else {
        let text = currLineText.replace(/(\r\n|\n|\r)/gm, "");
        newLineText = `${ currLineText.substring(0, currLineFirstSymbolsIndex) }- [ ] ${ text }`;
    }
    
    editor.edit(editBuilder => {
        editBuilder.replace(new vscode.Range(curs.line, 0, curs.line, currLineText.length), newLineText);
    });
    const lineRange = new vscode.Range(curs.line, 0, curs.line, newLineText.length);
    editor.selection = new vscode.Selection(lineRange.end, lineRange.end);
}