import * as vscode from "vscode";
import * as path from "path";
import { TDMTagIndex } from "./classes";

export function filterNotesByTag(homeDir: string, tagsIndex: TDMTagIndex[]) {
    let uiItems = tagsIndex.map(item => {
        return {
            label: item.name,
            description: item.files.length.toString()
        };
    });

    uiItems = uiItems.sort((a, b) => {
        if (Number(b.description) === Number(a.description)) {
            const strA = a.label.toLocaleLowerCase();
            const strB = b.label.toLocaleLowerCase();
            return strA.localeCompare(strB);            
         }
         return Number(b.description) - Number(a.description);
    });            

    vscode.window.showQuickPick(uiItems).then(chosenTag => {
        if (!chosenTag) {
            return;
        }
        const index = tagsIndex.findIndex(item => item.name === chosenTag.label);
        uiItems = tagsIndex[index].files.map(item => {
            return {
                label: item,
                description: ""
            }
        });
        
        vscode.window.showQuickPick(uiItems).then(chosenPath => {
            if (!chosenPath) {
                return;
            }

            const fullPath = path.join(homeDir, chosenPath.label);
            vscode.window.showTextDocument(vscode.Uri.file(fullPath));
        });
    });
}

export function showStatistic(homeDir: string, tagsIndex: TDMTagIndex[]): string {
    let stat: string = "";

    // Files
    stat = stat.concat("# Todomator's sctatistics\n");
    stat = stat.concat("## Files\n");

    // Tags
    stat = stat.concat("## Tags\n");
    stat = stat.concat(`Tag|Popularity\n`);
    stat = stat.concat(`--- | ---\n`)
    
    let uiItems = tagsIndex.map(item => {
        return {
            label: item.name,
            description: item.files.length.toString()
        };
    });

    uiItems = uiItems.sort((a, b) => {
        if (Number(b.description) === Number(a.description)) {
            const strA = a.label.toLocaleLowerCase();
            const strB = b.label.toLocaleLowerCase();
            return strA.localeCompare(strB);            
         }
         return Number(b.description) - Number(a.description);
    });

    uiItems.forEach(item => {
        stat = stat.concat(`${item.label} | ${item.description}\n`);
    });
    
    return stat;
}