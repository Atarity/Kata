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
            setTagIndex();
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

export function setTagIndex() {
  const homeDirectory = getHomeDir();
  if (!homeDirectory) {
      return;
  }

  createTagIndex(homeDirectory)
    .then(tags => {
      const config = vscode.workspace.getConfiguration('tdm');
      const update = config.update('tagIndex', tags, true);
      
      update.then(() => {
        vscode.window.showInformationMessage('Todomator: Tag index rebuild.');
      });
      
    })
    .catch(err => {
      vscode.window.showErrorMessage(`Todomator: ${ err }`);
    })
}

export function getTagIndex(): Object {
  const config = vscode.workspace.getConfiguration('tdm');
  const tagIndex = config.get('tagIndex');
  return tagIndex;
}

function createTagIndex(noteFolderPath: string) {
  return new Promise((resolve, reject) => {
      let files = [];

      klaw(noteFolderPath)       
          .on('data', item => {
              files.push(new Promise((res, rej) => {
                  if (!item.stats.isDirectory()) {                        
                      fs.readFile(item.path, (err, contents) => {
                          if (err) {
                              res();
                          } else {} 
                              res({ 
                                  path: item.path, 
                                  contents: contents 
                              });
                          }
                      );                      
                  } else {
                      res(); // resolve undefined
                  }                    
              }))
          })
          .on('error', (err, item) => {
              reject(err);
              vscode.window.showErrorMessage(`Todomator: Error while walking notes folder for tags: ${ item } ${ err }`);
          })
          .on('end', () => {
              Promise.all(files)
                  .then(files => {
                      let tagIndex = {};
                      for (let i = 0; i < files.length; i++) {
                          if (files[i] != null && files[i]) {
                              const parsedFrontMatter = matter(files[i].contents);
                              if ('tags' in parsedFrontMatter.data) {
                                  for (let tag of parsedFrontMatter.data.tags) {
                                      if (tag in tagIndex) {
                                          tagIndex[tag].push(files[i].path);
                                      } else {
                                          tagIndex[tag] = [files[i].path];
                                      }
                                  }
                              }
                          }
                      }
                      resolve(tagIndex);
                  })
                  .catch(err => {
                      vscode.window.showErrorMessage(`Todomator: ${ err }`);
                  })
          })
  })
}