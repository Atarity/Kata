import * as vscode from "vscode";
import * as path from "path";
import { TDMIndex } from './classes';
import { setHomeDir, getHomeDir } from './settings';
import { createNote, toggleTask } from './notes';
import { filterNotesByTag, getStatistic } from './ui';

const msg: string[] = [
	'Todomator: Home directory not found, please run "Set home directory" command'
	,'Todomator: Index is building, please try again later...'
	,'Todomator: Error occurred while building index, please try again later...'];

function addTagsToIntelliSense(tdmIndex: TDMIndex) {	
	const triggerCharacters = [...tdmIndex.getUniqueCharsFromTags()];
	return vscode.languages.registerCompletionItemProvider('markdown', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
			const linePrefix = document.lineAt(position).text.substr(0, position.character);
			if (!linePrefix.startsWith('tags:')) {
				return;
			}
			const tags = tdmIndex.getTagsIndex();
			return tags.map(item => {
				const simpleCompletion = new vscode.CompletionItem(item.name, vscode.CompletionItemKind.Text);
				simpleCompletion.insertText = `${item.name}, `;
				simpleCompletion.sortText = item.name.toUpperCase();
				return simpleCompletion;
			});
		}
	}, ...triggerCharacters);
}

export function activate({ subscriptions }: vscode.ExtensionContext) {
	let homeDir: string = getHomeDir();
	let tdmIndex = new TDMIndex();
	let intelliSenseProviderIndex: number = -1;

	// TODO: Notes.ts refactoring
	// TODO: сделать настройку зачёркивание выполненных тасков
	if (homeDir) {
		tdmIndex.setHomeDir(homeDir);
		tdmIndex.rebuildHodeDirIndex().then(() => {
			// Set tags in IntelliSense
			if (intelliSenseProviderIndex !== -1) {
				subscriptions[intelliSenseProviderIndex].dispose();
			}
			intelliSenseProviderIndex = subscriptions.push(addTagsToIntelliSense(tdmIndex));
		});
	}

	// Set home directory
	subscriptions.push(vscode.commands.registerCommand('tdm.setHomeDir', async () => {
		await setHomeDir();
		homeDir = getHomeDir();
		if (!homeDir) {
			vscode.window.showInformationMessage(msg[0]);
			return;
		}
		tdmIndex.setHomeDir(homeDir);
		tdmIndex.rebuildHodeDirIndex().then(() => {
			// Set tags in IntelliSense
			if (intelliSenseProviderIndex !== -1) {
				subscriptions[intelliSenseProviderIndex].dispose();
			}
			intelliSenseProviderIndex = subscriptions.push(addTagsToIntelliSense(tdmIndex));				
		});
	}));

	// Rebuild index
	subscriptions.push(vscode.commands.registerCommand('tdm.rebuildIndex', () => {
		homeDir = getHomeDir();
		if (!homeDir) {
			vscode.window.showInformationMessage(msg[0]);
			return;
		}
		tdmIndex.rebuildHodeDirIndex().then(() => {
			// Set tags in IntelliSense
			if (intelliSenseProviderIndex !== -1) {
				subscriptions[intelliSenseProviderIndex].dispose();
			}
			subscriptions.push(addTagsToIntelliSense(tdmIndex));
		});
	}));

	// Update file index when file changed
	vscode.workspace.onDidSaveTextDocument(document => {
		const filePath: string = document.fileName; 
		if (path.extname(filePath) === ".md") {
			tdmIndex.rebuildFileIndex(filePath).then(() => {
				tdmIndex.rebuildTagsIndex();
				// Set tags in IntelliSense
				if (intelliSenseProviderIndex !== -1) {
					subscriptions[intelliSenseProviderIndex].dispose();
				}
				intelliSenseProviderIndex = subscriptions.push(addTagsToIntelliSense(tdmIndex));
			});
		} 
	});

    // Create new note
	subscriptions.push(vscode.commands.registerCommand('tdm.createNote', () => {
		if (!homeDir) {
			vscode.window.showInformationMessage(msg[0]);
			return;
		}
		createNote(homeDir);
	}));
	
	// Toggle task
	subscriptions.push(vscode.commands.registerCommand('tdm.toggleTask', () => {
		toggleTask();
	}));

	// Filter notes by tags
	subscriptions.push(vscode.commands.registerCommand('tdm.filterNotesByTag', () => {
		if (!homeDir) {
			vscode.window.showInformationMessage(msg[0]);
			return;
		}
		const tdmIndexStatus = tdmIndex.getStatus();
		if (tdmIndexStatus === "pending") {
			vscode.window.showInformationMessage(msg[1]);
			return;
		} else if (tdmIndexStatus === "error") {
			vscode.window.showErrorMessage(msg[2]);
			return;
		}
		const tagIndex = tdmIndex.getTagsIndex();
		filterNotesByTag(homeDir, tagIndex);
	}));

	// Show statistic
	const scheme = 'TDM';
	const provider = new class implements vscode.TextDocumentContentProvider {
		provideTextDocumentContent(uri: vscode.Uri): string {
			const stat: string = getStatistic(tdmIndex);
			return stat;
		}
	};
	subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(scheme, provider));

	subscriptions.push(vscode.commands.registerCommand('tdm.showStats', async () => {
		if (!homeDir) {
			vscode.window.showInformationMessage(msg[0]);
			return;
		}
		const tdmIndexStatus = tdmIndex.getStatus();
		if (tdmIndexStatus === "pending") {
			vscode.window.showInformationMessage(msg[1]);
			return;
		} else if (tdmIndexStatus === "error") {
			vscode.window.showErrorMessage(msg[2]);
			return;
		}
		const now = new Date();
		const datetime = `${ now.getFullYear() }-${ now.getMonth() }-${ now.getDay() }-${ now.getHours() }-${ now.getMinutes() }-${ now.getSeconds() }`
		const uri = vscode.Uri.parse(`${ scheme }: ${ datetime }-stat.md`);		
		let doc = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(doc, { preview: false });		
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {
}