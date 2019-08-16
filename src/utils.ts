import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as klaw from "klaw";
import * as matter from "gray-matter";

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
            vscode.window.showInformationMessage('Todomator: Note path saved. Edit the location by re-running setup or editing the path in VS Code Settings.');
            setFilesIndex();
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

export function updateFileIndex(filePath: string) {
  const homeDirectory = getHomeDir();
  if (!homeDirectory) {
      return;
  }

  let files = [];

  const fileContent = readFileContent(filePath);
  files.push(fileContent);

  Promise.all(files).then(files => {
    const filesIndex = createFilesIndex(files);
    const currentFilesIndex = getFilesIndex();
			
		Object.keys(filesIndex).map(filePath => {
		  if (filePath in currentFilesIndex) {
			  currentFilesIndex[filePath] = filesIndex[filePath];
			} else {
			  currentFilesIndex[filePath] = [filesIndex[filePath]];
			}
		});

    /*
    const config = vscode.workspace.getConfiguration('tdm');
    const update = config.update('filesIndex', currentFilesIndex, true);            
    update.then(() => {
      vscode.window.showInformationMessage('Todomator: Files index rebuild.');
    });
    */
    const filePath = path.join(homeDirectory, 'index.json');
    fs.writeFile(filePath, JSON.stringify(currentFilesIndex), function (err) {
      if (err) throw err;
      vscode.window.showInformationMessage('Todomator: Files index rebuild.');
    });
  });
}


export function setFilesIndex() {
  const homeDirectory = getHomeDir();
  if (!homeDirectory) {
      return;
  }

  let files = [];

  klaw(homeDirectory)       
    .on('data', item => {
      if (!item.stats.isDirectory()) {
        const fileContent = readFileContent(item.path);
        files.push(fileContent);
      }
    })
    .on('error', (err, item) => {
      vscode.window.showErrorMessage(`Todomator: Error while walking notes folder for tags: ${ item } ${ err }`);
    })
    .on('end', () => {
      Promise.all(files)
        .then(files => {
          const filesIndex = createFilesIndex(files);
          const filePath = path.join(homeDirectory, 'index.json');
          fs.writeFile(filePath, JSON.stringify(filesIndex), function (err) {
            if (err) throw err;
            vscode.window.showInformationMessage('Todomator: Files index rebuild.');
          });
        })
        .catch(err => {
          vscode.window.showErrorMessage(`Todomator: ${ err }`);
        })
    })
}

export function getFilesIndex(): Object {
  const homeDirectory = getHomeDir();
  if (!homeDirectory) {
    return;
  }

  const filePath = path.join(homeDirectory, 'index.json');
  const data = fs.readFileSync(filePath);
  return JSON.parse(data.toString());
}

export function readFileContent(filePath: string) {
  return new Promise((res, rej) => {
    fs.readFile(filePath, (err, contents) => {
      if (err) {
        res();
      }
      res({ 
        path: filePath, 
        contents: contents 
      });
    });                      
  });
}

export function createFilesIndex(files): Object {
  let filesIndex = {};
  for (let i = 0; i < files.length; i++) {
    if (files[i] != null && files[i]) {
      const filePath = files[i].path;
      const fileData = matter(files[i].contents).data;
      if ('tags' in fileData) {
        for (let tag of fileData.tags) {
          if (filePath in filesIndex) {
            filesIndex[filePath].push(tag);
          } else {
            filesIndex[filePath] = [tag];
          }
        }
      }
    }
  }
  return filesIndex;  
}