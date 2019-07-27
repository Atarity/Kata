import * as vscode from "vscode";
const setupTodomator = require('./setupTodomator');
const newEntry = require('./newEntry');
const showStats = require('./showStats');
const markAsDone = require('./markAsDone');

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

    // Run setup
    let setupDisposable = vscode.commands.registerCommand('tdm.setup', setupTodomator);
    context.subscriptions.push(setupDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}