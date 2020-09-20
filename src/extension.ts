import * as vscode from 'vscode';
import * as path from 'path';
import { TDMIndex } from './classes';
import { createNote, toggleTask } from './notes';
import { filterNotesByTag, getStatistic } from './ui';
import { getDirsWithTDMFile, toLocalTime } from './utils';

const MSG_INDEX_BUILDING = 'Todomator\'s index is building 🤖 right now. Try again later.';
const MSG_INDEX_BUILD_WITH_ERROR = 'Error occurred 🥵 while building Todomator\'s index. See details in log.';
const MSG_NOT_TDM_FOLDER = 'To activate 🏀 Todomator: Open your Notes as a workspace directory. This directory should contain ".todomator" file.';

const addTagsToIntelliSense = (tdmIndex: TDMIndex) => {
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

export const activate = ({ subscriptions }: vscode.ExtensionContext) => {
	const { workspace, commands, window } = vscode;

	// TODO: Add setting to strike done tasks
	let homeDir: string;
	let tdmIndex = new TDMIndex();
	let intelliSenseProviderIndex: number = -1;

	if (workspace.workspaceFolders) {
		homeDir = getDirsWithTDMFile(workspace.workspaceFolders[0].uri.fsPath, [])[0] || null;
	}

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
	subscriptions.push(commands.registerCommand('tdm.rebuildIndex', () => {
		if (!homeDir) {
			window.showInformationMessage(MSG_NOT_TDM_FOLDER);
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
	workspace.onDidSaveTextDocument(document => {
		if (!homeDir) {
			return;
		}

		const filePath: string = document.fileName;
		if (path.extname(filePath) === '.md') {
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
	subscriptions.push(commands.registerCommand('tdm.createNote', () => {
		if (!homeDir) {
			window.showInformationMessage(MSG_NOT_TDM_FOLDER);
			return;
		}

		createNote(homeDir);
	}));

	// Toggle task
	subscriptions.push(commands.registerCommand('tdm.toggleTask', () => {
		if (!homeDir) {
			window.showInformationMessage(MSG_NOT_TDM_FOLDER);
			return;
		}

		toggleTask();
	}));

	// Filter notes by tags
	subscriptions.push(commands.registerCommand('tdm.filterNotesByTag', () => {
		if (!homeDir) {
			window.showInformationMessage(MSG_NOT_TDM_FOLDER);
			return;
		}

		const tdmIndexStatus = tdmIndex.getStatus();
		if (tdmIndexStatus === 'pending') {
			window.showInformationMessage(MSG_INDEX_BUILDING);
			return;
		}
		if (tdmIndexStatus === 'error') {
			window.showErrorMessage(MSG_INDEX_BUILD_WITH_ERROR);
			return;
		}

		const tagIndex = tdmIndex.getTagsIndex();
		filterNotesByTag(homeDir, tagIndex);
	}));

	// Show statistic
	const scheme = 'TDM';
	const provider = new class implements vscode.TextDocumentContentProvider {
		provideTextDocumentContent(uri: vscode.Uri): string {
			return getStatistic(tdmIndex);
		}
	};
	subscriptions.push(workspace.registerTextDocumentContentProvider(scheme, provider));

	subscriptions.push(commands.registerCommand('tdm.showStats', async () => {
		if (!homeDir) {
			window.showInformationMessage(MSG_NOT_TDM_FOLDER);
			return;
		}

		const tdmIndexStatus = tdmIndex.getStatus();
		if (tdmIndexStatus === 'pending') {
			window.showInformationMessage(MSG_INDEX_BUILDING);
			return;
		}
		if (tdmIndexStatus === 'error') {
			window.showErrorMessage(MSG_INDEX_BUILD_WITH_ERROR);
			return;
		}

		const now = toLocalTime().toISOString().slice(0,19).replace(/:/g, '-');
		const uri = vscode.Uri.parse(`${ scheme }: ${ now }-stat.md`);
		let doc = await workspace.openTextDocument(uri);
		await window.showTextDocument(doc, { preview: false });
	}));
}
