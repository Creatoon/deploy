import axios from 'axios';
import {
	Deployment,
	DeployStatus,
	LogType
} from 'metacall-protocol/deployment';
import API from 'metacall-protocol/protocol';
import { error, info } from './cli/messages';
import { listSelection } from './cli/selection';
import { startup } from './startup';
import { sleep } from './utils';

const showLogs = async (
	container: string,
	suffix: string,
	type: LogType
): Promise<void> => {
	const config = await startup();
	const api = API(config.token as string, config.baseURL);

	info(`Getting ${type} logs...`);
	info(`This may take some time.`);

	let logsTill: string[] = [''];

	let app: Deployment;
	let status: DeployStatus = 'create';

	while (status !== 'ready') {
		app = (await api.inspect()).filter(dep => dep.suffix === suffix)[0];

		status = app.status;
		const prefix = app.prefix;

		try {
			const allLogs = await api.logs(container, type, suffix, prefix);

			allLogs.split('\n').forEach(el => {
				if (!logsTill.includes(el)) console.log(el);
			});

			logsTill = allLogs.split('\n');
		} catch (err) {
			if (axios.isAxiosError(err)) continue;
		}

		await sleep(10000);
	}
};

export const logs = async (
	containers: string[],
	name: string
): Promise<void> => {
	try {
		const container: string = await listSelection(
			[...containers, 'deploy'],
			'Select a container to get logs'
		);
		const type = container === 'deploy' ? LogType.Deploy : LogType.Job;

		await showLogs(container, name, type);
	} catch (e) {
		error(String(e));
	}
};
