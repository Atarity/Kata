import * as vscode from "vscode";
import { newEntry } from './newEntry';
import { showStats } from './showStats';
import { markAsDone } from './markAsDone';
import { listTags } from './listTags';
import { setup } from './settings';

export function activate(context: vscode.ExtensionContext) {
    // Create a new entry
    let newEntryDisposable = vscode.commands.registerCommand('tdm.newEntry', newEntry);
    context.subscriptions.push(newEntryDisposable);

    // Get statistic
    let newStatDisposable = vscode.commands.registerCommand('tdm.showStats', showStats);
    context.subscriptions.push(newStatDisposable);
    
    // Mark task as done
    let newMarkAsDoneDisposable = vscode.commands.registerCommand('tdm.markAsDone', markAsDone);
    context.subscriptions.push(newMarkAsDoneDisposable);

    // List tags
    let listTagsDisposable = vscode.commands.registerCommand('tdm.listTags', listTags);
    context.subscriptions.push(listTagsDisposable);

    // Run setup
    let setupDisposable = vscode.commands.registerCommand('tdm.setup', setup);
    context.subscriptions.push(setupDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}