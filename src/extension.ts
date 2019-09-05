import * as vscode from "vscode";
import * as path from "path";
import { TDMIndex } from './classes';
import { createNote, toggleTask } from './notes';
import { filterNotesByTag, getStatistic } from './ui';
import { toLocalTime, getDirsWithTDMFile } from "./utils";

const MSG_INDEX_BUILDING = 'Todomator: Index is building, please try again later...';
const MSG_INDEX_BUILD_WITH_ERROR = 'Todomator: Error occurred while building index, please try again later...';
const MSG_NO_TDM_FILE_IN_FOLDER = 'Todomator: File .todomator not found in workspace folder...';

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
	// TODO: сделать настройку зачёркивание выполненных тасков
	let homeDir: string;
	let tdmIndex = new TDMIndex();
	let intelliSenseProviderIndex: number = -1;
	
	homeDir = getDirsWithTDMFile(vscode.workspace.workspaceFolders[0].uri.fsPath, [])[0] || null;

	if (homeDir) {
		tdmIndex.setHomeDir(homeDir);
		tdmIndex.rebuildHomeDirIndex().then(() => {
			// Set tags in IntelliSense
			if (intelliSenseProviderIndex !== -1) {
				subscriptions[intelliSenseProviderIndex].dispose();
			}
			intelliSenseProviderIndex = subscriptions.push(addTagsToIntelliSense(tdmIndex));
		});
	}

	// Rebuild index
	subscriptions.push(vscode.commands.registerCommand('tdm.rebuildIndex', () => {
		if (!homeDir) {
			vscode.window.showErrorMessage(MSG_NO_TDM_FILE_IN_FOLDER);
			return;
		}

		tdmIndex.rebuildHomeDirIndex().then(() => {
			// Set tags in IntelliSense
			if (intelliSenseProviderIndex !== -1) {
				subscriptions[intelliSenseProviderIndex].dispose();
			}
			subscriptions.push(addTagsToIntelliSense(tdmIndex));
		});
	}));

	// Update file index when file changed
	vscode.workspace.onDidSaveTextDocument(document => {
		if (!homeDir) {
			return;
		}

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
			vscode.window.showErrorMessage(MSG_NO_TDM_FILE_IN_FOLDER);
			return;
		}

		createNote(homeDir);
	}));
	
	// Toggle task
	subscriptions.push(vscode.commands.registerCommand('tdm.toggleTask', () => {
		if (!homeDir) {
			vscode.window.showErrorMessage(MSG_NO_TDM_FILE_IN_FOLDER);
			return;
		}
		
		toggleTask();
	}));

	// Filter notes by tags
	subscriptions.push(vscode.commands.registerCommand('tdm.filterNotesByTag', () => {
		if (!homeDir) {
			vscode.window.showErrorMessage(MSG_NO_TDM_FILE_IN_FOLDER);
			return;
		}

		const tdmIndexStatus = tdmIndex.getStatus();
		if (tdmIndexStatus === "pending") {
			vscode.window.showInformationMessage(MSG_INDEX_BUILDING);
			return;
		} else if (tdmIndexStatus === "error") {
			vscode.window.showErrorMessage(MSG_INDEX_BUILD_WITH_ERROR);
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
			vscode.window.showErrorMessage(MSG_NO_TDM_FILE_IN_FOLDER);
			return;
		}

		const tdmIndexStatus = tdmIndex.getStatus();
		if (tdmIndexStatus === "pending") {
			vscode.window.showInformationMessage(MSG_INDEX_BUILDING);
			return;
		} else if (tdmIndexStatus === "error") {
			vscode.window.showErrorMessage(MSG_INDEX_BUILD_WITH_ERROR);
			return;
		}
		const now = toLocalTime().toISOString().slice(0,19).replace(/:/g, "-");
		const uri = vscode.Uri.parse(`${ scheme }: ${ now }-stat.md`);
		let doc = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(doc, { preview: false });		
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {
}