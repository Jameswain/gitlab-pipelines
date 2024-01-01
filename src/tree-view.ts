import { workspace, TreeItem, TreeDataProvider,TreeItemCollapsibleState, ProviderResult, window, Event, EventEmitter, StatusBarAlignment, ExtensionContext } from 'vscode';
import getRunningPipelines, { getCurrentRunningJob } from './pipelines';
import { readFileSync } from 'fs';
import { join } from 'path';

type Menu = {
	label: string,
	arguments: string[]
};

const root = (workspace.workspaceFolders || [{ uri: { path:'' } }])[0];

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
	};
}

const createStatusBarItem = () => {
  const item = window.createStatusBarItem(StatusBarAlignment.Left, -Infinity);
  item.show();
  item.command = 'pipeline.openInBrowser';
  return Object.assign({}, item, {
    showText: (text:string) => {
      item.text = text;
    },
  });
};

let showText:(text: string) => void;
export const registerExtension = (context: ExtensionContext) => {
  const item = createStatusBarItem();
  context.subscriptions.push(item);
	showText = item.showText;
  return showText;
};

function readDiskPipelineInfo():any {
	const diskPath = join(root.uri.path || '', 'node_modules', 'pipelines.json');
	let mapPilelines = {};
	try {
		mapPilelines = JSON.parse(readFileSync(diskPath, 'utf8'));
	} catch (e) {
		mapPilelines = {};
	}
	return mapPilelines;
}

function readBootConf() {
	const diskPath = join(root.uri.path || '', 'boot.conf');
	try {
		const bootConf = JSON.parse(readFileSync(diskPath, 'utf8'));
		if (bootConf.arrAppNames) {
			showText(' 🎾 ' + bootConf.arrAppNames.join('⚡️') + `   🧠  ${bootConf.arrStartConfPath.join('⚡️')}`);
		} else {
			const { game_key } = bootConf[0];
			showText(' 🎾 ' + bootConf.map((o:any) => o.app_name).join(' 🎾 ') + `  🧠  ${game_key}`);
		}
	} catch (e) {
		showText('');
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
	readBootConf();
	const mapPilelines = readDiskPipelineInfo();
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
		let label = `${arrIcon[index % arrIcon.length] || ''}   ${pipeline.id} - ${status} - ${pipeline.ref}`;
		const meta = mapPilelines[pipeline.id];
		if (meta) {
			label = `${arrIcon[index % arrIcon.length] || ''}  ` + [pipeline.id, meta.app_name, pipeline.ref, meta.PLATFORM].join(' - ');
		}

		return createMenu({ 
			label, 
			arguments: [pipeline.web_url] 
		});
	});
	tvp.refresh();
}
