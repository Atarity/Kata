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
            var filePath = homeDir + fileName;
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
        const fileUri = vscode.Uri.parse("file:" + filePath);
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
        //vscode.window.showInformationMessage("Stats shown");
        vscode.window.showInformationMessage(toLocalTime().toISOString());
        //console.log("Stats");
    });

    context.subscriptions.push;
}

// this method is called when your extension is deactivated
export function deactivate() {
}