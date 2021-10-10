// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { window, commands, Uri, ExtensionContext } from 'vscode';
import { TreeViewProvider, updatePipelinesStatus } from './tree-view';
import { getConfig } from './pipelines';

1
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
	const tvp = new TreeViewProvider();
	window.createTreeView('GitLab-Pipelines', { treeDataProvider: tvp, showCollapseAll: true });
	context.subscriptions.push(commands.registerCommand('pipeline.click', (args) => {
		window.showInformationMessage('点击pipeline选项');
		console.log('args[0]=>', args)
		commands.executeCommand('vscode.open', Uri.parse(args));
	}));
	const conf = await getConfig();
	updatePipelinesStatus(tvp, conf);
	setInterval(() => {
		updatePipelinesStatus(tvp, conf);
	}, conf.interval || 3000);
}

// this method is called when your extension is deactivated
export function deactivate() {}
