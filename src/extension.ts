import * as vscode from "vscode";
import { newEntry } from './sheets';
import { showStats } from './statistics';
import { toggleTask } from './tasks';
import { filterByTags, tagsForIntelliSense } from './tags';
import { setup } from './settings';

export function activate(context: vscode.ExtensionContext) {
    // Create a new entry
    let newEntryDisposable = vscode.commands.registerCommand('tdm.newEntry', newEntry);
    context.subscriptions.push(newEntryDisposable);

    // Get statistic
    let newStatDisposable = vscode.commands.registerCommand('tdm.showStats', showStats);
    context.subscriptions.push(newStatDisposable);
    
    // Mark task as done
    let newMarkAsDoneDisposable = vscode.commands.registerCommand('tdm.markAsDone', toggleTask);
    context.subscriptions.push(newMarkAsDoneDisposable);

    // Filter notes by tags
    let listTagsDisposable = vscode.commands.registerCommand('tdm.filterByTags', filterByTags);
    context.subscriptions.push(listTagsDisposable);

	// Show tags in IntelliSense
	const triggerCharacters = [...'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюяABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'];
	let tagProvider = vscode.languages.registerCompletionItemProvider('markdown', {
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
				let linePrefix = document.lineAt(position).text.substr(0, position.character);
            	if (!linePrefix.startsWith('tags:')) {
					return undefined;
				}
				let arr = tagsForIntelliSense();
				return arr;
			}
		},
		...triggerCharacters
	);
	context.subscriptions.push(tagProvider);

	// Run setup
    let setupDisposable = vscode.commands.registerCommand('tdm.setup', setup);
    context.subscriptions.push(setupDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}