import * as vscode from "vscode";
import * as path from "path";

module.exports = () => {
    // TODO: Take out get home directory code to utils.ts
    const config = vscode.workspace.getConfiguration('tdm');
    const homeDirectory = String(config.get('homeDir'));
    if (homeDirectory == null || !homeDirectory) {
        vscode.window.showErrorMessage('Default note folder not found. Please run setup.');
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
                vscode.window.showInformationMessage(`in ${ homeDirectory } workspace: Total files = ${ filePathes.length }. MD files = ${ md }. Other files = ${ rest }`);
            })
            .catch((reason: string) => {
                vscode.window.showErrorMessage(`Todomator: Error has occurred.`, reason);
            });
        });
}