import { window, Uri } from 'vscode';
import * as path from 'path';
import { KataTagIndex, KataIndex } from './classes';

export const filterNotesByTag = (homeDir: string, tagsIndex: KataTagIndex[]) => {
    let uiItems = tagsIndex.map(({ name, files }) => ({
        label: name,
        description: `${files.length}`,
    }));

    uiItems = uiItems.sort((a, b) => {
        if (Number(b.description) === Number(a.description)) {
            const strA = a.label.toLocaleLowerCase();
            const strB = b.label.toLocaleLowerCase();
            return strA.localeCompare(strB);
        }

        return Number(b.description) - Number(a.description);
    });

    window.showQuickPick(uiItems).then(chosenTag => {
        if (!chosenTag) {
            return;
        }

        const index = tagsIndex.findIndex(item => item.name === chosenTag.label);
        const { files } = tagsIndex[index];
        uiItems = files.sort().reverse().map(item => ({
            label: item,
            description: '',
        }));

        window.showQuickPick(uiItems).then(chosenPath => {
            if (!chosenPath) {
                return;
            }

            const fullPath = path.join(homeDir, chosenPath.label);
            window.showTextDocument(Uri.file(fullPath));
        });
    });
}

export const getStatistic = (kataIndex: KataIndex): string => {
    let stat: string = '';

    // Files
    const filesIndex = kataIndex.getFilesIndex();
    stat = stat.concat('# Kata brief statistics\n');
    stat = stat.concat('\n## 📝 Files\n');
    stat = stat.concat(`Total files in ${kataIndex.getHomeDir()}: **${filesIndex.length.toString()}**\n`);
    stat = stat.concat('Year | Notes\n');
    stat = stat.concat('--- | ---\n');

    let filesGroupedByYear = filesIndex.reduce((res, item) => {
        let year = String(item.createDate.getFullYear());
        if (!/(\d{4})/.test(year)) {
            year = 'Other';
        }
        res[year] ? res[year].files.push(item.name) : res[year] = {
            files: [item.name],
        };
        return res;
    }, {});

    Object.keys(filesGroupedByYear).map((year) => {
        stat = stat.concat(`${year} | ${filesGroupedByYear[year].files.length}\n`);
    });

    // Tags
    const tagsIndex = kataIndex.getTagsIndex();
    let tags = tagsIndex.map(({ name, files }) => ({
        name,
        popularity: files.length,
    }));

    tags = tags.sort((a, b) => {
        if (b.popularity === a.popularity) {
            const strA = a.name.toLocaleLowerCase();
            const strB = b.name.toLocaleLowerCase();
            return strA.localeCompare(strB);
        }
        return b.popularity - a.popularity;
    });

    stat = stat.concat('\n## 🏷 Tags\n');
    stat = stat.concat('Tag | Occurrence\n');
    stat = stat.concat('--- | ---\n');

    tags.forEach(({ name, popularity }) => {
        stat = stat.concat(`${name} | ${popularity}\n`);
    });

    return stat;
}
