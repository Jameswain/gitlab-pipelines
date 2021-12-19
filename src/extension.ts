// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { window, commands, Uri, ExtensionContext } from 'vscode';
import { TreeViewProvider, updatePipelinesStatus } from './tree-view';
import { getConfig } from './pipelines';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
	const tvp = new TreeViewProvider();
	window.createTreeView('GitLab-Pipelines', { treeDataProvider: tvp, showCollapseAll: true });
	context.subscriptions.push(commands.registerCommand('pipeline.click', (args) => {
		commands.executeCommand('vscode.open', Uri.parse(args));
	}));
	const conf = await getConfig();
	updatePipelinesStatus(tvp, conf);
	setInterval(() => {
		updatePipelinesStatus(tvp, conf);
	}, conf.interval || 1000 * 5);
}

// this method is called when your extension is deactivated
export function deactivate() {}
