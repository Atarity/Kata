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
	const triggerCharacters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
	triggerCharacters.push(...['я', 'ю', 'ч', 'ш', 'щ', 'ж', 'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ы', 'ь', 'ъ', 'э']);
	triggerCharacters.push(...["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
	triggerCharacters.push(...["=", "_", "$", "."]);
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