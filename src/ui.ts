import * as vscode from "vscode";
import * as path from "path";
import { TDMTagIndex, TDMIndex } from "./classes";

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

export function getStatistic(tdmIndex: TDMIndex): string {
    let stat: string = "";

    // Files
    const filesIndex = tdmIndex.getFilesIndex();
    stat = stat.concat("# Todomator brief statistics\n");
    stat = stat.concat("\n## 📝 Files\n");
    stat = stat.concat(`Total files in ${ tdmIndex.getHomeDir() }: **${ filesIndex.length.toString() }**\n`);
    stat = stat.concat(`Year | Notes\n`);
    stat = stat.concat(`--- | ---\n`);

    let filesGroupedByYear = filesIndex.reduce((res, item) => {
        let year = String(item.createDate.getFullYear());
        if (!/(\d{4})/.test(year)) {
            year = "Other";
        }
        ( res[year] ) ? res[year].files.push(item.name) : res[year] = {
            files: [item.name]
        };
        return res;
    }, {});

    Object.keys(filesGroupedByYear).map((year) => { 
        stat = stat.concat(`${ year } | ${ filesGroupedByYear[year].files.length }\n`);
    });

    // Tags
    const tagsIndex = tdmIndex.getTagsIndex();    
    let tags = tagsIndex.map(item => {
        return {
            name: item.name,
            popularity: item.files.length
        };
    });

    tags = tags.sort((a, b) => {
        if (b.popularity === a.popularity) {
            const strA = a.name.toLocaleLowerCase();
            const strB = b.name.toLocaleLowerCase();
            return strA.localeCompare(strB);            
        }
        return b.popularity - a.popularity;
    });
    
    stat = stat.concat("\n## 🏷 Tags\n");
    stat = stat.concat(`Tag | Occurrence\n`);
    stat = stat.concat(`--- | ---\n`);
    tags.forEach(item => {
        stat = stat.concat(`${ item.name } | ${ item.popularity }\n`);
    });
    
    return stat;
}