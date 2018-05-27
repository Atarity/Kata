"use strict";
import * as vscode from "vscode";
import * as fs from "fs";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Getting platform-related configuration
    switch (process.platform) {
        case "darwin":
            var homeDir = vscode.workspace.getConfiguration().get("tdm.homeDirMac");
            break;
        case "linux":
            var homeDir = vscode.workspace.getConfiguration().get("tdm.homeDirLinux");
            break;
        case "win32":
            var homeDir = vscode.workspace.getConfiguration().get("tdm.homeDirWin");
            break;
    }
    //Transform filename from userinput to Title without dashes
    function fileToTiltle(fileName) {
        var result = fileName.slice(11,-3);
        return result.charAt(0).toUpperCase() + result.replace(/-/g, " ").slice(1);
    }
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    vscode.commands.registerCommand("tdm.newEntry", async () => {
        var datetime = new Date().toISOString().slice(0,10);
        const fileName = await vscode.window.showInputBox({prompt: "Edit Entry's filename", value: datetime + "-todo.md", valueSelection: [11, 15]});
        //check null input or cancellation
        if (fileName === undefined || fileName === null || fileName === "" ) {
            return;
        }
        //check if the file already exist
        if (fs.existsSync(homeDir + fileName)) {
            vscode.window.showErrorMessage(fileName + " already exist. Try another name.")
            return;
        }
    
        const newFile = vscode.Uri.parse("untitled:" + homeDir + fileName);
        vscode.workspace.openTextDocument(newFile).then(document => {
            const edit = new vscode.WorkspaceEdit();
            edit.insert(newFile, new vscode.Position(0, 0), "---\ntitle: " + fileToTiltle(fileName) + "\ntags:\n---\n\n");
            return vscode.workspace.applyEdit(edit).then(success => {
                if (success) {
                    vscode.window.showTextDocument(document);
                    vscode.commands.executeCommand("workbench.action.files.save");
                    //document.save();
                } else {
                    vscode.window.showInformationMessage("Error while creating an Entry!");
                }
            });
        });
    });

    vscode.commands.registerCommand("tdm.showStats", () => {
        //vscode.window.showInformationMessage("Stats shown");
        //var pos = new vscode.Position(3, 3);
        vscode.window.activeTextEditor.selection = new vscode.Selection(new vscode.Position(5, 0), new vscode.Position(5, 0));
        console.log("Stats");
    });

    context.subscriptions.push;
}

// this method is called when your extension is deactivated
export function deactivate() {
}