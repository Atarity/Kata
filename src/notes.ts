import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

// Transform filename from userinput to Title without dashes
function fileToTitle(fileName: string): string {
    const result = fileName.slice(11,-3);
    return result.charAt(0).toUpperCase() + result.replace(/-/g, " ").slice(1);
}

export const toLocalTime = () => {
    const d = new Date();
    const offset = (d.getTimezoneOffset() * 60000) * -1;  // Minutes to milliseconds
    const n = new Date(d.getTime() + offset); // Calculate unix-time for local machine
    return n;
};

// Check user input filename
const isValid = (() => {
    const rg1=/^[^\\/:\*\?"<>\|\[\]\{\}]+$/; // forbidden and special characters \ / : * ? " < > | [ ] { }
    const rg2=/^\./; // cannot start with dot (.)
    const rg3=/^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names in Win
    return function isValid(fname) {
      return rg1.test(fname)&&!rg2.test(fname)&&!rg3.test(fname);
    }
})();

export async function createNote(homeDir: string) {
    const datetime = toLocalTime().toISOString().slice(0,10);
    const fileName = await vscode.window.showInputBox({
        prompt: "Edit note's filename", 
        value: `${datetime}-todo.md`, 
        valueSelection: [11, 15]
    });
    let yearDir: string;
    let filePath: string;
    // Check null input or form esc
    if (fileName === undefined || fileName === null || fileName === "" ) {
        return;
    } else {
        yearDir = path.join(homeDir, datetime.substring(0, 4));
        filePath = path.join(yearDir, fileName);   // homeDir to string
        // Check if the file name contains restricted chars
        if (!isValid(fileName)) {
            vscode.window.showErrorMessage(fileName + " name contains forbidden characters.")
            return;
        }
        // Create dir if not exist
        if (!fs.existsSync(yearDir)) {
            fs.mkdirSync(yearDir)
            vscode.window.showInformationMessage("New directory created. Happy NY, then! " + yearDir)
            //return;
        }
        // Check if the file already exist
        if (fs.existsSync(filePath)) {
            vscode.window.showErrorMessage(fileName + " already exist. Try another name.")
            return;
        }
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
    const editor = vscode.window.activeTextEditor;
    let curs = editor.selection.active; // returns Position (line, char)
    var currLine = editor.document.getText(new vscode.Range(curs.line, 0, curs.line + 1, 0));
    var tdLine = currLine.trim().substr(0,6);
    var tdMarks = ['- [  ]', '- [ ]', '- []', '- [X]', '- [x]', '- [Х]', '- [х]'];
    var i = tdMarks.length;
    while (i--) {
        // if it is todo and need to unset X
        if (tdLine.indexOf(tdMarks[i]) != -1 && i > 2) {
            let currLineText = currLine.split(tdMarks[i])[1];
            const tildaFirstIndex = currLine.indexOf("~");
            const tildaLastIndex = currLine.lastIndexOf("~");
            if (tildaFirstIndex !== -1 && tildaFirstIndex !== tildaLastIndex) {
                currLineText = currLineText.split('~~')[1];    
            }
            currLineText = currLineText.trim();
            const newLineText = `- [ ] ${ currLineText }`;
            editor.edit(editBuilder => {
                editBuilder.replace(new vscode.Range(curs.line, 0, curs.line, currLine.length), newLineText);
            });
            const lineRange = new vscode.Range(curs.line, 0, curs.line, newLineText.length);
            editor.selection = new vscode.Selection(lineRange.end, lineRange.end);
        // if it is todo and need to set X     
        } else if (tdLine.indexOf(tdMarks[i]) != -1 && i < 3) {
            const currLineText = currLine.split(tdMarks[i])[1].trim();
            const newLineText = `- [X] ~~${ currLineText }~~`;
            editor.edit(editBuilder => {
                editBuilder.replace(new vscode.Range(curs.line, 0, curs.line, currLine.length), newLineText); 
            });
            const lineRange = new vscode.Range(curs.line, 0, curs.line, newLineText.length);
            editor.selection = new vscode.Selection(lineRange.end, lineRange.end);
        // if it is not a todo line, make it so
        } else if (tdLine.indexOf(tdMarks[i]) < 0 && i == 0) {
            const currLineText = currLine.trim();
            const newLineText = `- [ ] ${ currLineText }`;
            editor.edit(editBuilder => {
                editBuilder.replace(new vscode.Range(curs.line, 0, curs.line, currLine.length), newLineText);
            });
            const lineRange = new vscode.Range(curs.line, 0, curs.line, newLineText.length);
            editor.selection = new vscode.Selection(lineRange.end, lineRange.end);
        }
    }
}