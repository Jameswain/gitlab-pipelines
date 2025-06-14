// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { window, commands, Uri, ExtensionContext } from 'vscode';
import { TreeViewProvider, updatePipelinesStatus, registerExtension } from './tree-view';
import { getConfig } from './pipelines';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
	registerExtension(context);
	const tvp = new TreeViewProvider();
	window.createTreeView('GitLab-Pipelines', { treeDataProvider: tvp, showCollapseAll: true });
	context.subscriptions.push(commands.registerCommand('pipeline.click', (args) => {
		commands.executeCommand('vscode.open', Uri.parse(args));
	}));
	const conf = await getConfig();
	const tid = setInterval(() => {
		try {
			updatePipelinesStatus(tvp, conf);
		} catch (e) {
			console.error(e);
			clearInterval(tid);
		}
	}, conf.interval || 1000 * 5);
	try {
		updatePipelinesStatus(tvp, conf);
	} catch (e) {
		clearInterval(tid);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
