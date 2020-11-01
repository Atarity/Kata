import * as vscode from 'vscode';
import * as path from 'path';
import { KataIndex } from './classes';
import { createNote, toggleTask } from './notes';
import { filterNotesByTag, getStatistic } from './ui';
import { getDirsWithKataFile, toLocalTime } from './utils';

const MSG_INDEX_BUILDING = 'Kata\'s index is building 🤖 right now. Try again later.';
const MSG_INDEX_BUILD_WITH_ERROR = 'Error occurred 🥵 while building Kata\'s index. See details in log.';
const MSG_NOT_KATA_FOLDER = 'To activate 🥋 Kata: Open your Notes as a workspace directory. This directory should contain ".kata" file.';

const addTagsToIntelliSense = (kataIndex: KataIndex) => {
	const triggerCharacters = [...kataIndex.getUniqueCharsFromTags()];
	return vscode.languages.registerCompletionItemProvider('markdown', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
			const linePrefix = document.lineAt(position).text.substr(0, position.character);
			if (!linePrefix.startsWith('tags:')) {
				return;
			}

			const tags = kataIndex.getTagsIndex();
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
	let kataIndex = new KataIndex();
	let intelliSenseProviderIndex: number = -1;

	if (workspace.workspaceFolders) {
		homeDir = getDirsWithKataFile(workspace.workspaceFolders[0].uri.fsPath, [])[0] || null;
	}

	if (homeDir) {
		kataIndex.setHomeDir(homeDir);
		kataIndex.rebuildHomeDirIndex().then(() => {
			// Set tags in IntelliSense
			if (intelliSenseProviderIndex !== -1) {
				subscriptions[intelliSenseProviderIndex].dispose();
			}
			intelliSenseProviderIndex = subscriptions.push(addTagsToIntelliSense(kataIndex));
		});
	}

	// Rebuild index
	subscriptions.push(commands.registerCommand('kata.rebuildIndex', () => {
		if (!homeDir) {
			window.showInformationMessage(MSG_NOT_KATA_FOLDER);
			return;
		}

		kataIndex.rebuildHomeDirIndex().then(() => {
			// Set tags in IntelliSense
			if (intelliSenseProviderIndex !== -1) {
				subscriptions[intelliSenseProviderIndex].dispose();
			}
			subscriptions.push(addTagsToIntelliSense(kataIndex));
		});
	}));

	// Update file index when file changed
	workspace.onDidSaveTextDocument(document => {
		if (!homeDir) {
			return;
		}

		const filePath: string = document.fileName;
		if (path.extname(filePath) === '.md') {
			kataIndex.rebuildFileIndex(filePath).then(() => {
				kataIndex.rebuildTagsIndex();
				// Set tags in IntelliSense
				if (intelliSenseProviderIndex !== -1) {
					subscriptions[intelliSenseProviderIndex].dispose();
				}
				intelliSenseProviderIndex = subscriptions.push(addTagsToIntelliSense(kataIndex));
			});
		}
	});

    // Create new note
	subscriptions.push(commands.registerCommand('kata.createNote', () => {
		if (!homeDir) {
			window.showInformationMessage(MSG_NOT_KATA_FOLDER);
			return;
		}

		createNote(homeDir);
	}));

	// Toggle task
	subscriptions.push(commands.registerCommand('kata.toggleTask', () => {
		if (!homeDir) {
			window.showInformationMessage(MSG_NOT_KATA_FOLDER);
			return;
		}

		toggleTask();
	}));

	// Filter notes by tags
	subscriptions.push(commands.registerCommand('kata.filterNotesByTag', () => {
		if (!homeDir) {
			window.showInformationMessage(MSG_NOT_KATA_FOLDER);
			return;
		}

		const kataIndexStatus = kataIndex.getStatus();
		if (kataIndexStatus === 'pending') {
			window.showInformationMessage(MSG_INDEX_BUILDING);
			return;
		}
		if (kataIndexStatus === 'error') {
			window.showErrorMessage(MSG_INDEX_BUILD_WITH_ERROR);
			return;
		}

		const tagIndex = kataIndex.getTagsIndex();
		filterNotesByTag(homeDir, tagIndex);
	}));

	// Show statistic
	const scheme = 'Kata';
	const provider = new class implements vscode.TextDocumentContentProvider {
		provideTextDocumentContent(uri: vscode.Uri): string {
			return getStatistic(kataIndex);
		}
	};
	subscriptions.push(workspace.registerTextDocumentContentProvider(scheme, provider));

	subscriptions.push(commands.registerCommand('kata.showStats', async () => {
		if (!homeDir) {
			window.showInformationMessage(MSG_NOT_KATA_FOLDER);
			return;
		}

		const kataIndexStatus = kataIndex.getStatus();
		if (kataIndexStatus === 'pending') {
			window.showInformationMessage(MSG_INDEX_BUILDING);
			return;
		}
		if (kataIndexStatus === 'error') {
			window.showErrorMessage(MSG_INDEX_BUILD_WITH_ERROR);
			return;
		}

		const now = toLocalTime().toISOString().slice(0,19).replace(/:/g, '-');
		const uri = vscode.Uri.parse(`${ scheme }: ${ now }-stat.md`);
		let doc = await workspace.openTextDocument(uri);
		await window.showTextDocument(doc, { preview: false });
	}));
}
