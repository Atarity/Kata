import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getHomeDir, setHomeDir } from "./utils";

// Transform filename from userinput to Title without dashes
function fileToTitle(fileName) {
    const result = fileName.slice(11,-3);
    return result.charAt(0).toUpperCase() + result.replace(/-/g, " ").slice(1);
}

const toLocalTime = () => {
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

export async function newEntry() {
    const homeDirectory = getHomeDir();
    if (!homeDirectory) {
        setHomeDir();
        return;
    }

    const datetime = toLocalTime().toISOString().slice(0,10);
    const fileName = await vscode.window.showInputBox({prompt: "Edit Entry's filename", value: datetime + "-todo.md", valueSelection: [11, 15]});
    let yearDir;
    let filePath;
    // Check null input or form esc
    if (fileName === undefined || fileName === null || fileName === "" ) {
        return;
    } else {
        yearDir = path.join(homeDirectory, datetime.substring(0, 4));
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
                vscode.window.showInformationMessage("Error while creating an Entry!");
                return;
            }
        });
    });
}