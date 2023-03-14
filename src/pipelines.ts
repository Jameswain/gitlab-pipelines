import { parse } from 'url';
import { window, workspace } from 'vscode';
import { execFileSync, execSync } from 'child_process';
import axios from 'axios';

function gitUrlParser(url: string){
  const giturl = /\:\/\//.test(url) ? url : `ssh://${url.replace(/:~?/g, '/')}`;
  const { hostname, path } = parse(giturl);
  return {
    domain: hostname,
    project: (path || '').replace('.git', '').replace(/^\/\/?/, '').trim()
  };
}

const gitClient= () => { 
  const ws = (workspace.workspaceFolders || [])[0] || '';  // vscode 当前打开的目录
  return (...args: any) => {
    try {
      // TODO 有可能会报错，待研究原因
      return execFileSync('git', [`--git-dir`, `${ws.uri.fsPath}/.git/`, ...args]).toString().trim();
    } catch (e) {
      console.error(e);
      return '';
    }
  }
}

const getRepoInfo = () => {
  try {
    const git = gitClient();

    const branch = git('rev-parse', '--abbrev-ref', 'HEAD').trim();
    const remote = git('config', '--get', `branch.${branch}.remote`) || 'origin';
    const url = git('config', '--get', `remote.${remote}.url`);

    const { domain, project } = gitUrlParser(url);

    const info = {
      domain,
      project,
      currentBranch: branch === 'HEAD' ? 'master' : branch // HEAD if it is a tag instead of a branch
    };
    return info;
  } catch (err) {
    window.showErrorMessage(err as string);
    throw err;
  }
}

const migrateV1toV2 = (userSettings: any): any => new Promise((resolve, reject) => {
  if ( userSettings.has('tokens') || userSettings.has('notifyOnFailed') || userSettings.has('interval')) {
    const tokens = userSettings.get('tokens') || {};
    const interval = userSettings.get('interval') || 10000;
    const notifyOnFailedSettings = userSettings.get('notifyOnFailed') || {};

    const configV2 = Object.keys(tokens).reduce(
      (cfg, domain) => ({
        ...cfg,
        [domain]: {
          token: tokens[domain],
          notifyOnFailed: notifyOnFailedSettings[domain] || false,
          interval
        }
      }),
      {}
    );
    resolve(configV2);
  }
  resolve(userSettings);
});

export const getExtensionSettings = async (domain: string) => {
  const defaultSettings = {
    token: null,
    interval: 10000,
    notifyOnFailed: false,
    apiUrl: `https://${domain}/api/v4`,
    version: 2
  };
  const config = workspace.getConfiguration(`GitLabPipelines`);
  const settings = await migrateV1toV2(config);
  const usersettings = { ...defaultSettings, ...settings[domain] };
  return usersettings;
}

const createGitLabClient = (apiUrl: string, project: string, token: string): any => {
  const url = (_: any) => `${apiUrl}/projects/${encodeURIComponent(project)}${_}`;
  return async (endpoint: string) => {
    const uri = url(endpoint);
    try {
      const { data } = await axios({
        url: uri,
        headers: {
          'PRIVATE-TOKEN': token
        }
      });
      return data || [];
    } catch (e) {{
      console.error(e);
      return [];
    }}
  }
}

export const getConfig = async () => {
  const repository = getRepoInfo();
  const settings = await getExtensionSettings(repository[`domain`] as string);
  const conf = { ...settings, ...repository };
  return conf;
}

/**
 * 获取当前正在运行的job
 */
export async function getCurrentRunningJob(conf: any) {
  if (conf?.pipeline?.status !== 'running') return {};
  const getData = createGitLabClient(conf.apiUrl, conf.project, conf.token);
  if (!conf.token){
    throw new Error(`No token for '${conf.domain}'`);
  }
  try {
    const arrJobs = await getData(`/pipelines/${conf?.pipeline?.id}/jobs?scope=running`);
    return arrJobs[0] || {};
  } catch (e) {
    return {};
  }
}

/**
 * 获取最近运行的20条pipeline
 */
export default async function getRunningPipelines(conf: any) {
  const getData = createGitLabClient(conf.apiUrl, conf.project, conf.token);
  if (!conf.token){
    throw new Error(`No token for '${conf.domain}'`);
  }
  if (!conf.branch) conf.branch = [];
  conf.branch.unshift('master');
  conf.branch.unshift(conf.currentBranch);
  conf.branch = Array.from(new Set(conf.branch));
  // const arrReqs = conf.branch.map(ref => getData(`/pipelines/?ref=${ref}`));
  const arrPipelines = await getData(`/pipelines`);
  return arrPipelines || [];
};
