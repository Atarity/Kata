import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";

export function setup() {
  setHomeDir();
}

export function setHomeDir() {
  const msg = 'Welcome to Todomator. To begin, set a location to save your notes. Click Select to continue ->';
  const option = vscode.window.showInformationMessage(msg, ...['Select']);  
  option.then(value => {
    if (value === 'Select') {
      // Open a folder picker for user to choose note folder
      const uriPromise = vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select'
      });

      uriPromise.then(res => {
        if (res.length > 0 && res[0].fsPath) {
          const hostname = os.hostname();
          const homeDir = {
            hostname: hostname,
              path: path.normalize(res[0].fsPath)
          }              
          const config = vscode.workspace.getConfiguration('tdm');
          let homeDirArray = [];
          homeDirArray = config.get('homeDir');
          const homeDirIndex = homeDirArray.findIndex(item => item.hostname === hostname);
          if (homeDirIndex == -1) {
            homeDirArray.push(homeDir);
          } else {
            homeDirArray[homeDirIndex] = homeDir;
          }
          const update = config.update('homeDir', homeDirArray, true);
          update.then(() => {
            vscode.window.showInformationMessage('Note path saved. Edit the location by re-running setup or editing the path in VS Code Settings.');
          });
        }
      });
    }
  });
}

export function getHomeDir(): string {
  const hostname = os.hostname();
  const config = vscode.workspace.getConfiguration('tdm');
  let homeDirArray = [];
  homeDirArray = config.get('homeDir');
  const homeDirIndex = homeDirArray.findIndex(item => item.hostname === hostname);
  if (homeDirIndex == -1) {
      return null;
  }
  return homeDirArray[homeDirIndex].path;
}