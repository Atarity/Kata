import * as vscode from "vscode";
import * as path from "path";
import { getHomeDir, setHomeDir, getFilesIndex } from "./utils";

export async function showStats() {
    const homeDirectory = getHomeDir();
    if (!homeDirectory) {
        setHomeDir();
        return;
    }
    
    const includes = ["**/*"];
    const excludes = [];
    vscode.workspace.findFiles(`{${ includes.join(',') }}`, `{${ excludes.join(',') }}`)
        .then((files: vscode.Uri[]) => {
            new Promise((resolve: (p: string[])=> void, reject: (reason: string) => void) => {
                const filePathes = files.map(uri => uri.fsPath).filter(p => !path.relative(homeDirectory, p).startsWith('..'));
                resolve(filePathes);
            })
            .then((filePathes: string[]) => {
                var k = filePathes.length;
                var md = 0;
                var rest = 0;
                while (k--) {
                    if (path.extname(filePathes[k]) == ".md") {
                        md += 1;
                    } else {
                        rest += 1;
                    }
                }
                vscode.window.showInformationMessage(`Todomator: Total files = ${ filePathes.length }. MD files = ${ md }. Other files = ${ rest }`);
            })
            .catch((reason: string) => {
                vscode.window.showErrorMessage(`Todomator: Error has occurred.`, reason);
            });
        });
}

export function getStats(): string {
    let stat: string = "";

    stat = stat.concat("# Todomator's sctatistics\n");
    stat = stat.concat("## Files\n");

    stat = stat.concat("## Tags\n");
    stat = stat.concat(`Tag|Popularity\n`);
    stat = stat.concat(`--- | ---\n`)
    
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

    tags = Object.keys(tags).map(tagName => {
        return {
            label: tagName,
            description: tags[tagName].length
        };
    });

    tags = Object(tags).sort((a, b) => {
        if (Number(b.description) === Number(a.description)) {
            const strA = String(a.label).toLocaleLowerCase();
            const strB = String(b.label).toLocaleLowerCase();
            return strA.localeCompare(strB);            
         }
         return Number(b.description) - Number(a.description);
    });

    Object(tags).forEach(item => {
        stat = stat.concat(`${item.label} | ${item.description}\n`);
    })
    
    return stat;
}