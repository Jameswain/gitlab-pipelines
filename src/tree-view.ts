import { TreeItem, Uri, commands, TreeDataProvider,TreeItemCollapsibleState, ProviderResult, window, Event, EventEmitter, ExtensionContext } from 'vscode';
import getRunningPipelines from './pipelines';

type Menu = {
	label: string,
	// status: string,
	// ref: string,
	// web_url: string,
	arguments: string[]
};

function createMenu(menu: Menu): TreeItem {
	return {
		label: menu.label,
		collapsibleState: TreeItemCollapsibleState.None,
		tooltip: '点击查看pipeline详情',
		command: {
			title: '点击查看pipeline详情',
			command: 'pipeline.click',
			arguments: menu.arguments
		}
	}
}

let pipelines:any = [];

export class TreeViewProvider implements TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
	readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

	public refresh(): any {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: TreeItem) {
		return element;
	}

	getChildren(element?: TreeItem | undefined): ProviderResult<TreeItem[]> {
		return pipelines;
	}
}

let index = 0;
export async function updatePipelinesStatus(tvp: TreeViewProvider, config: any) {
	const arrLastPipelines = await getRunningPipelines(config);
	const icon = config.icon || {};
	const MAP_CION = {
		'success': icon.success || ['✅'],
		'skipped': icon.skipped || ['🚥'],
		'running': icon.running || ['🥩', '🍗', '🍖', '🍔', '🍞', '🥯', '🍟', '🍺', '🥃', '🍾', '🍹'],
		'failed': icon.failed || ['❌'],
		'canceled': icon.canceled || ['⛔️']
	};
	pipelines = arrLastPipelines.map((pipeline: any) => {
		const arrIcon = MAP_CION[pipeline.status] || [];
		return createMenu({ 
			label: `${arrIcon[index % arrIcon.length] || ''}   ${pipeline.id} - ${pipeline.status} - ${pipeline.ref}`, 
			arguments: [pipeline.web_url] 
		})
	});
	tvp.refresh();
	index++;
	if (index === 100)index = 0;
}
