import * as vscode from "vscode";
import * as path from "path";
import { TDMIndex } from './classes';
import { setHomeDir, getHomeDir } from './settings';
import { createNote, toggleTask } from './notes';
import { filterNotesByTag, showStatistic } from './ui';

function completionItemProvider(index: TDMIndex) {	
	const triggerCharacters = [...index.getUniqueCharsFromTags()];
	return vscode.languages.registerCompletionItemProvider('markdown', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
			const linePrefix = document.lineAt(position).text.substr(0, position.character);
			if (!linePrefix.startsWith('tags:')) {
				return;
			}
			const tags = index.getTagsIndex();
			return tags.map(item => {
				const simpleCompletion = new vscode.CompletionItem(item.name, vscode.CompletionItemKind.Text);
				simpleCompletion.insertText = `${item.name}, `;
				simpleCompletion.sortText = item.name.toUpperCase();
				return simpleCompletion;
			});
		}
	}, ...triggerCharacters);
}

export function activate(context: vscode.ExtensionContext) {
	let homeDir: string = getHomeDir();
	let tdmIndex = new TDMIndex();
	let completionItemProviderIndex: number = -1;
	// TODO: Show message Home dir not found, please run set home directory command
	// TODO: Notes.ts refactoring
	// TODO: сделать настройку зачёркивание выполненных тасков
	// TODO: Show files statistics
	if (homeDir) {
		tdmIndex.setHomeDir(homeDir);
		tdmIndex.rebuildHodeDirIndex().then(() => {
			// Set tags in IntelliSense
			if (completionItemProviderIndex !== -1) {
				context.subscriptions[completionItemProviderIndex].dispose();
			}
			completionItemProviderIndex = context.subscriptions.push(completionItemProvider(tdmIndex));
		});
	}

	// Set home directory
	context.subscriptions.push(vscode.commands.registerCommand('tdm.setHomeDir', async () => {
		await setHomeDir();
		homeDir = getHomeDir();
		if (homeDir) {
			tdmIndex.setHomeDir(homeDir);
			tdmIndex.rebuildHodeDirIndex().then(() => {
				// Set tags in IntelliSense
				if (completionItemProviderIndex !== -1) {
					context.subscriptions[completionItemProviderIndex].dispose();
				}
				completionItemProviderIndex = context.subscriptions.push(completionItemProvider(tdmIndex));				
			});
		}
	}));

	// Rebuild index
	context.subscriptions.push(vscode.commands.registerCommand('tdm.rebuildIndex', () => {
		homeDir = getHomeDir();
		if (homeDir) {
			tdmIndex.rebuildHodeDirIndex().then(() => {
				// Set tags in IntelliSense
				if (completionItemProviderIndex !== -1) {
					context.subscriptions[completionItemProviderIndex].dispose();
				}
				context.subscriptions.push(completionItemProvider(tdmIndex));
			});
		}	
	}));

	// Update file index when file changed
	vscode.workspace.onDidSaveTextDocument(document => {
		const filePath: string = document.fileName; 
		if (path.extname(filePath) === ".md") {
			tdmIndex.rebuildFileIndex(filePath).then(() => {
				// Set tags in IntelliSense
				if (completionItemProviderIndex !== -1) {
					context.subscriptions[completionItemProviderIndex].dispose();
				}
				completionItemProviderIndex = context.subscriptions.push(completionItemProvider(tdmIndex));
			});
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
			const tdmIndexStatus = tdmIndex.getStatus();
			if (tdmIndexStatus === "pending") {
				vscode.window.showInformationMessage('Todomator: Index is building, please try again later...');
				return;
			} else if (tdmIndexStatus === "error") {
				vscode.window.showErrorMessage('Todomator: Error occurred while building index, please try again later...');
				return;
			}
			const tagIndex = tdmIndex.getTagsIndex();
			filterNotesByTag(homeDir, tagIndex);
		}
	}));

	// Show statistic
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('Todomator', new class implements vscode.TextDocumentContentProvider {	
		provideTextDocumentContent(uri: vscode.Uri): string {
			const tagIndex = tdmIndex.getTagsIndex();
			return showStatistic(homeDir, tagIndex);
		}
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('tdm.showStats', async () => {
		if (homeDir) {
			const tdmIndexStatus = tdmIndex.getStatus();
			if (tdmIndexStatus === "pending") {
				vscode.window.showInformationMessage('Todomator: Index is building, please try again later...');
				return;
			} else if (tdmIndexStatus === "error") {
				vscode.window.showErrorMessage('Todomator: Error occurred while building index, please try again later...');
				return;
			}
			let uri = vscode.Uri.parse('Todomator: Statistics.md');
			let doc = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(doc, { preview: false });
		}
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {
}