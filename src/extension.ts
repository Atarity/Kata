import * as vscode from "vscode";
import { newEntry } from './sheets';
import { getStats } from './statistics';
import { toggleTask } from './tasks';
import { filterByTags, tagsForIntelliSense } from './tags';
import { setup, setTagIndex } from './utils';

export function activate(context: vscode.ExtensionContext) {
    // Create a new entry
    let newEntryDisposable = vscode.commands.registerCommand('tdm.newEntry', newEntry);
    context.subscriptions.push(newEntryDisposable);

    // Get statistic
    //let newStatDisposable = vscode.commands.registerCommand('tdm.showStats', showStats);
	//context.subscriptions.push(newStatDisposable);
	const virtualDocProvider = new class implements vscode.TextDocumentContentProvider {
		onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
		onDidChange = this.onDidChangeEmitter.event;
	
		provideTextDocumentContent(uri: vscode.Uri): string {
			// simply invoke cowsay, use uri-path as text
			return getStats();
		}
	}
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('Todomator', virtualDocProvider));
	
	context.subscriptions.push(vscode.commands.registerCommand('tdm.showStats', async () => {
		let uri = vscode.Uri.parse('Todomator: Statistics.md');
		let doc = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(doc, { preview: false });
	}));
    
    // Mark task as done
    let newMarkAsDoneDisposable = vscode.commands.registerCommand('tdm.markAsDone', toggleTask);
    context.subscriptions.push(newMarkAsDoneDisposable);

    // Filter notes by tags
    let filterTagsDisposable = vscode.commands.registerCommand('tdm.filterByTags', filterByTags);
	context.subscriptions.push(filterTagsDisposable);
	
	// Run setup
    let setupDisposable = vscode.commands.registerCommand('tdm.setup', setup);
	context.subscriptions.push(setupDisposable);
	
	// Rebuild tag index
	let tagIndexDisposable = vscode.commands.registerCommand('tdm.setTagIndex', setTagIndex);
	context.subscriptions.push(tagIndexDisposable);

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

	setTagIndex(); 
}

// this method is called when your extension is deactivated
export function deactivate() {
}