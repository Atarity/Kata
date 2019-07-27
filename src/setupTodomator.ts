import * as vscode from "vscode";
import * as path from "path";

module.exports = () => {
  const msg = 'Welcome to Todomator. To begin, choose a location to save your notes. Click Start to continue ->';

  const startOption = vscode.window.showInformationMessage(msg, ...['Start']);
  startOption
    .then(value => {
      if (value === 'Start') {
        // Open a folder picker for user to choose note folder
        const uriPromise = vscode.window.showOpenDialog({
          canSelectFiles: false,
          canSelectFolders: true,
          canSelectMany: false,
          openLabel: 'Select'
        });

        uriPromise
          .then(res => {
            if (res.length > 0 && res[0].fsPath) {
              const noteFolder = vscode.workspace.getConfiguration('tdm');
              const update = noteFolder.update('homeDir', path.normalize(res[0].fsPath), true);
              update.then(() => {
                vscode.window.showInformationMessage('Note path saved. Edit the location by re-running setup or editing the path in VS Code Settings.');
              });
            }
          });
      }
    });
}