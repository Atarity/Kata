import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import { TDMHomeDir } from "./classes";

export function setHomeDir() {
  // const msg = 'Welcome to Todomator. To begin, set a location to save your notes. Click Select to continue ->';
  // const option = vscode.window.showInformationMessage(msg, ...['Select']);  
  // option.then(value => {
  //   if (value === 'Select') {
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
          const homeDir: TDMHomeDir = {
            hostname: hostname,
            path: path.normalize(res[0].fsPath)
          }              
          const config = vscode.workspace.getConfiguration('tdm');
          const homeDirs: TDMHomeDir[] = config.get('homeDir');
          const index = homeDirs.findIndex(item => item.hostname === hostname);
          if (index === -1) {
            homeDirs.push(homeDir);
          } else {
            homeDirs[index] = homeDir;
          }
          const update = config.update('homeDir', homeDirs, true);
          update.then(() => {
            vscode.window.showInformationMessage('Todomator: Note path saved. Edit the location by re-running setup or editing the path in VS Code Settings.');
            //setFilesIndex();            
          });
        }
      });
    // }
  // });
}

export function getHomeDir(): string {
  const hostname = os.hostname();
  const config = vscode.workspace.getConfiguration('tdm');
  const homeDirs: TDMHomeDir[] = config.get('homeDir');
  const index = homeDirs.findIndex(item => item.hostname === hostname);
  if (index === -1) {
    return;
  }
  return homeDirs[index].path;
}