import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as matter from "gray-matter";

export interface TDMHomeDir {
    hostname: string,
    path: string
}

export interface TDMFileIndex {
    name: string;
    createDate: Date;
    tags: string[];
};

export interface TDMTagIndex {
    name: string;
    files: string[];
};
  
export class TDMIndex {
    private _homeDir: string;
    private _filesIndex: TDMFileIndex[];
    private _tagsIndex: TDMTagIndex[];
    private _uniqueCharsFromTags: string;
    private _status: string;
  
    constructor() {
        this._homeDir = "";
        this._filesIndex = [];
        this._tagsIndex = [];
        this._uniqueCharsFromTags = "";
        this._status = "pending";
    }

    getStatus(): string {
        return this._status;
    }
  
    setHomeDir(homeDir: string) {
        this._homeDir = homeDir;
    }
  
    getHomeDir(): string {
        return this._homeDir;
    }
      
    private _readFileTags(filePath: string): string[] {
        const contents = fs.readFileSync(filePath);
        const parsedContent = matter(contents);
        let tags: string[] = parsedContent.data.tags;
        tags = tags.filter(tag => tag.trim() != null);
        return tags;
    }

    rebuildFileIndex(filePath: string): Promise<String> {
        return new Promise((res, rej) => {
            if (path.extname(filePath) === ".md") {           
                const name: string = filePath.slice(this._homeDir.length + 1, filePath.length);
                const createDate: Date = new Date(name.substr(5, 10));
                const tags: string[] = this._readFileTags(filePath);
                const fileIndex: TDMFileIndex = {
                    name: name,
                    createDate: createDate,
                    tags: tags
                };
                const index = this._filesIndex.findIndex(item => item.name === name);
                if (index === -1) {
                    this._filesIndex.push(fileIndex); 
                } else {
                    this._filesIndex[index] = fileIndex; 
                }
                res("success");
            } else {
                rej("Wrong file extension.");
            }            
        });
    }

    rebuildHomeDirIndex(): Promise<String> {
        this._status = "pending";
        return new Promise((res, rej) => {
            this._filesIndex = [];
            const includes = ["**/*.md"];
            const excludes = [];
            vscode.workspace.findFiles(`{${ includes.join(',') }}`, `{${ excludes.join(',') }}`).then((files: vscode.Uri[]) => {
                new Promise((resolve: (p: string[])=> void, reject: (reason: string) => void) => {
                    const filePathes = files.map(uri => uri.fsPath).filter(p => !path.relative(this._homeDir, p).startsWith('..'));
                    resolve(filePathes);
                })
                .then((filePathes: string[]) => {
                    filePathes.forEach(filePath => {
                        this.rebuildFileIndex(filePath);
                    });
                    this.rebuildTagsIndex();
                    this._status = "success";
                    res("success");  
                })
                .catch((error: string) => {
                    this._status = "error";
                    rej(error);
                });
            });
        });
    }
  
    rebuildTagsIndex() {
        this._tagsIndex = [];
        this._filesIndex.map(file => {
            if (!file.tags) {
                return;
            }
            file.tags.map(tag => {                
                const index = this._tagsIndex.findIndex(item => item.name === tag);
                if (index === -1) {
                    const files = this._filesIndex.filter(item => item.tags.indexOf(tag) !== -1);
                    this._tagsIndex.push({
                        name: tag,
                        files: files.map(file => file.name)
                    }); 
                }
            })
        })
        const tagsInOneString: string = this._tagsIndex.map(item => item.name).join('');
        this._uniqueCharsFromTags = String.prototype.concat(...new Set(tagsInOneString)).replace(" ", "");
    }

    getFilesIndex(): TDMFileIndex[] {
        return this._filesIndex;
    }

    getTagsIndex(): TDMTagIndex[] {
        return this._tagsIndex;
    }

    getUniqueCharsFromTags(): string {
        return this._uniqueCharsFromTags;
    }
}