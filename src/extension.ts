"use strict";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const CONFIGURATION_SECTION = "tdm";
//const TEMP_HOMEDIR = "/Users/Atarity/tdm-test/2019/";
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
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    vscode.commands.registerCommand("tdm.newEntry", async () => {
        var datetime = toLocalTime().toISOString().slice(0,10);
        const fileName = await vscode.window.showInputBox({prompt: "Edit Entry's filename", value: datetime + "-todo.md", valueSelection: [11, 15]});
        // Check null input or cancellation
        if (fileName === undefined || fileName === null || fileName === "" ) {
            return;
        } else {
            var filePath = path.join("" + tdmController.homeDirectory, fileName);   // homeDir to string
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

    vscode.commands.registerCommand("tdm.markAsDone", () => {
        const editor = vscode.window.activeTextEditor;
        let curs = editor.selection.active; // returns Position
        // console.log(`Cursor line is ${curs.line} and char is ${curs.character}`);
        var currLine = editor.document.getText(new vscode.Range(curs.line, 0, curs.line + 1, 0));
        if (currLine.includes("- [ ]")) {
            var idx = currLine.indexOf("- [ ]")
            editor.edit(editBuilder => {
                editBuilder.replace(new vscode.Range(curs.line ,idx, curs.line, idx + 5), "- [X]"); 
            });
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
            console.log(`Todomator: create StatAn`);
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
        console.log("ihaa", dir);
        vscode.workspace.findFiles(`{${includes.join(',')}}`, `{${excludes.join(',')}}`).then((files: vscode.Uri[]) => {
            new Promise((resolve: (p: string[])=> void, reject: (reason: string) => void) => {
                const filePathes = files.map(uri => uri.fsPath).filter(p => !path.relative(dir, p).startsWith('..'));
                console.log(`Todomator: ${filePathes.length} files`);
                resolve(filePathes);
            }).then((filePathes: string[]) => {
                vscode.window.showInformationMessage(`Found ${filePathes.length} files in workspace`);
            }).catch((reason: string) => {
                vscode.window.showErrorMessage(`Todomator: Error has occurred.`, reason);
            });
        });
    }
}