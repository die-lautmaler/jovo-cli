import * as childProcess from 'child_process';
const spawn = childProcess.spawn;
import * as path from 'path';



/**
 * Run a "jovo" command async
 *
 * @export
 * @param {string} command The jovo command
 * @param {string[]} parameters The additional parameters
 * @param {string} cwd The directory to run it in
 * @param {string} waitText The text to wait for in the output
 * @returns
 */
export function runJovoCommand(command: string, parameters: string[], cwd: string, waitText: string[] | string | null, errorText?: string): Promise<string> {
	parameters.unshift(command);

	if (waitText !== null && !Array.isArray(waitText)) {
		waitText = [waitText];
	}

	// Get the script from the correct location depending on if we are in main or subfolder
	if (cwd.indexOf(path.sep) === -1) {
		parameters.unshift('../dist/index.js');
	} else {
		parameters.unshift('../../dist/index.js');
	}

	return new Promise((resolve, reject) => {
		const child = spawn('node', parameters, {
			cwd,
		});
		child.stderr.on('data', (data) => {
			child.kill();
			if (errorText && data.toString().indexOf(errorText) > -1) {
				return resolve(data.toString());
			}

			reject(new Error(data.toString()));
		});
		child.stdout.on('data', (data) => {
			console.log(data.toString());
			if (waitText !== null) {
				for (const text of waitText) {
					if (data.toString().indexOf(text) > -1) {
						child.kill();
						return resolve(data.toString());
					}
				}
			}
		});
	});
}
