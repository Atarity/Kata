import * as vscode from "vscode";
import * as path from "path";
import { TDMIndex } from './classes';
import { setHomeDir, getHomeDir } from './settings';
import { createNote, toggleTask } from './notes';
import { filterNotesByTag, showStatistic } from './ui';

export function activate(context: vscode.ExtensionContext) {
	let homeDir: string;
	let tdmIndex = new TDMIndex();
	
	homeDir = getHomeDir();	
	if (homeDir) {
		tdmIndex.setHomeDir(homeDir);
		tdmIndex.rebuildFilesIndex();
	}

	// Set home directory
	context.subscriptions.push(vscode.commands.registerCommand('tdm.setHomeDir', async () => {
		await setHomeDir();
		homeDir = getHomeDir();
		if (homeDir) {
			await tdmIndex.setHomeDir(homeDir);
			tdmIndex.rebuildFilesIndex();
		}
	}));

	// Rebuild index
	context.subscriptions.push(vscode.commands.registerCommand('tdm.rebuildIndex', () => {
		tdmIndex.rebuildFilesIndex();	
	}));

	// Update file index when file changed
	vscode.workspace.onDidSaveTextDocument(document => {
		const filePath: string = document.fileName; 
		if (path.extname(filePath) === ".md") {
			tdmIndex.indexFile(filePath);
		} 
	});

    // Create new note
	context.subscriptions.push(vscode.commands.registerCommand('tdm.createNote', () => {
		if (homeDir) {
			createNote(homeDir);
		}
	}));
	
	// Toggle task
	context.subscriptions.push(vscode.commands.registerCommand('tdm.toggleTask', () => {
		toggleTask();
	}));

	// Filter notes by tags
	context.subscriptions.push(vscode.commands.registerCommand('tdm.filterNotesByTag', () => {
		if (homeDir) {
			tdmIndex.rebuildTagsIndex();
			const tagIndex = tdmIndex.getTagsIndex();
			filterNotesByTag(homeDir, tagIndex);
		}
	}));

	// Show tags in IntelliSense
	const triggerCharacters = [...'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюяABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'];
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider('markdown', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
			let linePrefix = document.lineAt(position).text.substr(0, position.character);
			if (!linePrefix.startsWith('tags:')) {
				return;
			}

			tdmIndex.rebuildTagsIndex();
			const tagIndex = tdmIndex.getTagsIndex();

			return tagIndex.map(item => {
				const simpleCompletion = new vscode.CompletionItem(item.name, vscode.CompletionItemKind.Text);
				simpleCompletion.insertText = `${item.name}, `;
				simpleCompletion.sortText = item.name.toUpperCase();
				return simpleCompletion;
			});
		}
	}, ...triggerCharacters
	));

	// Show statistic
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('Todomator', new class implements vscode.TextDocumentContentProvider {	
		provideTextDocumentContent(uri: vscode.Uri): string {
			tdmIndex.rebuildTagsIndex();
			const tagIndex = tdmIndex.getTagsIndex();
			return showStatistic(homeDir, tagIndex);
		}
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('tdm.showStats', async () => {
		let uri = vscode.Uri.parse('Todomator: Statistics.md');
		let doc = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(doc, { preview: false });
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {
}