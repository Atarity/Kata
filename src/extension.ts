"use strict";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const CONFIGURATION_SECTION = "tdm";
//const TEMP_HOMEDIR = "/Users/Atarity/tdm-test/";
const TEMP_HOMEDIR = "";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const tdmController = new TDMController();
    // Transform filename from userinput to Title without dashes
    function fileToTitle(fileName) {
        var result = fileName.slice(11,-3);
        return result.charAt(0).toUpperCase() + result.replace(/-/g, " ").slice(1);
    }

    var toLocalTime = function() {
        var d = new Date();
        var offset = (d.getTimezoneOffset() * 60000) * -1;  // Minutes to milliseconds
        var n = new Date(d.getTime() + offset); // Calculate unix-time for local machine
        return n;
    };
    // Check user input filename
    var isValid = (function() {
        var rg1=/^[^\\/:\*\?"<>\|\[\]\{\}]+$/; // forbidden and special characters \ / : * ? " < > | [ ] { }
        var rg2=/^\./; // cannot start with dot (.)
        var rg3=/^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names in Win
        return function isValid(fname) {
          return rg1.test(fname)&&!rg2.test(fname)&&!rg3.test(fname);
        }
    })();

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    vscode.commands.registerCommand("tdm.newEntry", async () => {
        var datetime = toLocalTime().toISOString().slice(0,10);
        const fileName = await vscode.window.showInputBox({prompt: "Edit Entry's filename", value: datetime + "-todo.md", valueSelection: [11, 15]});
        // Check null input or form esc
        if (fileName === undefined || fileName === null || fileName === "" ) {
            return;
        } else {
            var yearDir = path.join(tdmController.homeDirectory, datetime.substring(0, 4));
            var filePath = path.join(yearDir, fileName);   // homeDir to string
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
        var stream = fs.createWriteStream(filePath);
        stream.once('open', function(fd) {
            stream.write("---\n");
            stream.write("title: " + fileToTitle(fileName) + "\n");
            stream.write("tags:\n");
            stream.write("---\n\n");
            stream.end();
        });
        // Open new file and move coursor
        const fileUri = vscode.Uri.file(filePath);  // OR uri.parse ("file:" + filePath)
        vscode.workspace.openTextDocument(fileUri).then(document => {
            const edit = new vscode.WorkspaceEdit();
            vscode.window.showTextDocument(document).then(success => {
                if (success) {
                    vscode.window.activeTextEditor.selection = new vscode.Selection(new vscode.Position(5, 0), new vscode.Position(5, 0));
                } else {
                    vscode.window.showInformationMessage("Error while creating an Entry!");
                    return;
                }
            });
        });
    });

    vscode.commands.registerCommand("tdm.showStats", () => {
        tdmController.CountAll();
    });
    // if todo not in string → add it. If todo in string → close it. If todo closed → open it. All by 1 hotkey loop.
    vscode.commands.registerCommand("tdm.markAsDone", () => {
        const editor = vscode.window.activeTextEditor;
        let curs = editor.selection.active; // returns Position (line, char)
        // console.log(`Cursor line is ${curs.line} and char is ${curs.character}`);
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
            // if it is not a todo line, make it so
            } else if (tdLine.indexOf(tdMarks[i]) < 0 && i == 0) {
                const currLineText = currLine.trim();
                editor.edit(editBuilder => {
                    editBuilder.replace(new vscode.Range(curs.line, 0, curs.line, currLine.length), `- [ ] ${ currLineText }`);
                });
            }
        }
    });

    context.subscriptions.push;
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class TDMController {
    private configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(CONFIGURATION_SECTION);
    private statAn_: StatAn|null = null;

    public get homeDirectory() {
        var homeDir = "";
        if (TEMP_HOMEDIR.length > 0) {
            homeDir = TEMP_HOMEDIR;
        } else {
            switch (process.platform) {
                case "darwin":
                    homeDir = this.configuration.get("homeDirMac");
                    //var homeDir = vscode.workspace.getConfiguration().get("tdm.homeDirMac");
                    break;
                case "linux":
                    homeDir = this.configuration.get("homeDirLinux");
                    //var homeDir = vscode.workspace.getConfiguration().get("tdm.homeDirLinux");
                    break;
                case "win32":
                    homeDir = this.configuration.get("homeDirWin");
                    //var homeDir = vscode.workspace.getConfiguration().get("tdm.homeDirWin");
                    break;
            }
        }
        return homeDir;
    }

    private get statAn() {
        if (this.statAn_ === null) {
            //console.log("Todomator: creating StatAn class");
            this.statAn_ = new StatAn();
        }
        return this.statAn_;
    }

    public CountAll(){
        this.statAn.FileCounter(this.homeDirectory);
        //console.log(this.homeDirectory);
    }
}

class StatAn {
    public FileCounter(dir: string) {
        const includes = ["**/*"];
        const excludes = [];
        console.log("Todomator: tdm.homeDir is ", dir);
        vscode.workspace.findFiles(`{${includes.join(',')}}`, `{${excludes.join(',')}}`).then((files: vscode.Uri[]) => {
            new Promise((resolve: (p: string[])=> void, reject: (reason: string) => void) => {
                const filePathes = files.map(uri => uri.fsPath).filter(p => !path.relative(dir, p).startsWith('..'));
                //console.log(`Todomator: ${filePathes.length} files`);
                resolve(filePathes);
            }).then((filePathes: string[]) => {
                var k = filePathes.length;
                var md = 0;
                var rest = 0;
                while (k--) {
                    if (path.extname(filePathes[k]) == ".md") {
                        md = md + 1;
                    } else {
                        rest = rest + 1;
                        console.log(`Todomator: non-MD file found: ${filePathes[k]}`);
                        }
                }
                vscode.window.showInformationMessage(`in ${dir} workspace: Total files = ${filePathes.length} . MD files = ${md} . Other files = ${rest}`);
            }).catch((reason: string) => {
                vscode.window.showErrorMessage(`Todomator: Error has occurred.`, reason);
            });
        });
    }
}