import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as klaw from "klaw";
import * as matter from "gray-matter";

module.exports = () => {
    // TODO: Take out get home directory code to utils.ts
    const config = vscode.workspace.getConfiguration('tdm');
    const homeDirectory = String(config.get('homeDir'));
    if (homeDirectory == null || !homeDirectory) {
        vscode.window.showErrorMessage('Todomator: Default note folder not found. Please run setup.');
        return;
    }

    const homeDirectoryLen = homeDirectory.length;

    createTagIndex(homeDirectory)
        .then(tags => {
            vscode.window.showQuickPick(Object.keys(tags))
                .then(tag => {
                    if (tag != null) {
                        const shortPaths = tags[tag].map((item) => {
                            return item.slice(homeDirectoryLen + 1, item.length);
                        });
                        vscode.window.showQuickPick(shortPaths)
                            .then(chosenShortPath => {
                                if (chosenShortPath != null && chosenShortPath) {
                                    const fullpath = path.join(homeDirectory, chosenShortPath);
                                    vscode.window.showTextDocument(vscode.Uri.file(fullpath))
                                        .then(file => {
                                            //console.log('Opening file ' + fullpath);
                                        }, err => {
                                            vscode.window.showErrorMessage(`Todomator: ${ err }`);
                                        });
                                }
                            }, err => {
                                vscode.window.showErrorMessage(`Todomator: ${ err }`);
                            });
                    }
                }, err => {
                    vscode.window.showErrorMessage(`Todomator: ${ err }`);
                });
        })
        .catch(err => {
            vscode.window.showErrorMessage(`Todomator: ${ err }`);
        })
}

// Given a folder path, traverse and find all markdown files.
// Open and grab tags from front matter.
function createTagIndex(noteFolderPath) {
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