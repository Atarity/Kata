import * as vscode from "vscode";

module.exports = () => {
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
            editor.edit(editBuilder => {
                editBuilder.replace(new vscode.Range(curs.line, 0, curs.line, currLine.length), `- [ ] ${ currLineText }`);
            });
        // if it is todo and need to set X     
        } else if (tdLine.indexOf(tdMarks[i]) != -1 && i < 3) {
            const currLineText = currLine.split(tdMarks[i])[1].trim();
            editor.edit(editBuilder => {
                editBuilder.replace(new vscode.Range(curs.line, 0, curs.line, currLine.length), `- [X] ~~${ currLineText }~~`); 
            });
            const postion = editor.selection.end; 
            editor.selection = new vscode.Selection(postion, postion);
        // if it is not a todo line, make it so
        } else if (tdLine.indexOf(tdMarks[i]) < 0 && i == 0) {
            const currLineText = currLine.trim();
            editor.edit(editBuilder => {
                editBuilder.replace(new vscode.Range(curs.line, 0, curs.line, currLine.length), `- [ ] ${ currLineText }`);
            });
        }
    }
}