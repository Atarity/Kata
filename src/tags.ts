import * as vscode from "vscode";
import * as path from "path";
import { getHomeDir, setHomeDir, getFilesIndex } from "./utils";

export function filterByTags() {
    const homeDirectory = getHomeDir();
    if (!homeDirectory) {
        setHomeDir();
        return;
    }

    const filesIndex = getFilesIndex();
    let tags = {};
    Object.keys(filesIndex).map(filePath => {
        for (let tag of filesIndex[filePath]) {
            if (tag in tags) {
                tags[tag].push(filePath);
            } else {
                tags[tag] = [filePath];
            }
        }
    });

    let pickItems = Object.keys(tags).map(tagName => {
        return {
            label: tagName,
            description: String(tags[tagName].length)
        };
    });

    pickItems = pickItems.sort((a, b) => {
        if (Number(b.description) === Number(a.description)) {
            const strA = String(a.label).toLocaleLowerCase();
            const strB = String(b.label).toLocaleLowerCase();
            return strA.localeCompare(strB);            
         }
         return Number(b.description) - Number(a.description);
    });            

    vscode.window.showQuickPick(pickItems).then(tag => {
        if (tag != null) {
            const shortPaths = tags[tag.label].map((item) => {
                //return item.slice(homeDirectory.length + 1, item.length);
                return item;
            });
            vscode.window.showQuickPick(shortPaths).then(chosenShortPath => {
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
}

export function tagsForIntelliSense(): Promise<Array<vscode.CompletionItem>> {
    const homeDirectory = getHomeDir();
    if (!homeDirectory) {
        setHomeDir();
        return;
    }

    return new Promise((resolve, reject) => {
        let pickItems: Array<vscode.CompletionItem> = [];
        const filesIndex = getFilesIndex();
        let tags = {};
        Object.keys(filesIndex).map(filePath => {
            for (let tag of filesIndex[filePath]) {
                if (tag in tags) {
                    tags[tag].push(filePath);
                } else {
                    tags[tag] = [filePath];
                }
            }
        });             
        Object.keys(tags).forEach(tagName => {
            const simpleCompletion = new vscode.CompletionItem(String(tagName), vscode.CompletionItemKind.Text);
            simpleCompletion.insertText = `${String(tagName)}, `;
            simpleCompletion.sortText = String(tagName).toUpperCase();
            pickItems.push(simpleCompletion);
        });
        resolve(pickItems);
    })
}