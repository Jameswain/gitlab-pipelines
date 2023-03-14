import { TreeItem, TreeDataProvider,TreeItemCollapsibleState, ProviderResult, window, Event, EventEmitter, ExtensionContext } from 'vscode';
import getRunningPipelines, { getCurrentRunningJob } from './pipelines';

type Menu = {
	label: string,
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
	index = (index + 1) % 100;
	const arrLastPipelines = await getRunningPipelines(config);
	const icon = config.icon || {};
	const MAP_CION = {
		'success': icon.success || ['✅'],
		'manual': icon.manual || ['🚥'],
		'skipped': icon.skipped || ['🚆'],
		'running': icon.running || ['🏃🏼', '🏃🏼‍♂️', '🏃🏼'],
		'failed': icon.failed || ['❌'],
		'canceled': icon.canceled || ['⛔️'],
		'pending': icon.pending || ['⌛️']
	};
	pipelines = arrLastPipelines.map(async (pipeline: any) => {
		const job = await getCurrentRunningJob({ ...config, pipeline });
		const status = job.name ? `[${job.name}]` : pipeline.status;
		// @ts-ignore
		const arrIcon = MAP_CION[pipeline.status] || [];
		return createMenu({ 
			label: `${arrIcon[index % arrIcon.length] || ''}   ${pipeline.id} - ${status} - ${pipeline.ref}`, 
			arguments: [pipeline.web_url] 
		});
	});
	tvp.refresh();
}
