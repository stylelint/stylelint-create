import process from 'node:process';
import picocolors from 'picocolors';
import * as nodePath from 'node:path';
import { createStylelintConfig, findExistingConfig } from './actions/create-config';
import { installProjectDependencies } from './actions/install';
import { getContext } from './actions/context';
import { showHelpAction } from './actions/help';
import { showNextSteps } from './actions/post-install';
import { promptInstallDependencies } from './prompts/install-now';
import { promptPackageManager } from './prompts/package-manager';

process.on('SIGINT', () => {
	console.log('\n');
	console.log(picocolors.yellow('Operation cancelled by user.'));
	process.exit(0);
});

export async function main(): Promise<void> {
	let context = await getContext(process.argv.slice(2));

	if (context.help) {
		showHelpAction();
		return;
	}

	if (context.dryRun) {
		console.log(picocolors.yellow('Running in dry run mode. No changes will be made.'));
	}

	const existingConfig = findExistingConfig();
	if (existingConfig !== null) {
		const basename = nodePath.basename(existingConfig.filepath);
		const failureMessage =
			basename === 'package.json'
				? "A Stylelint configuration is already defined in your project's `package.json` file."
				: `A Stylelint configuration file named "${basename}" already exists in this project.`;

		console.error(
			picocolors.red(
				`Failed to create the Stylelint configuration file:\n${failureMessage} Please remove the existing configuration file and try again.`,
			),
		);
		context.exit(1);
	}

	const selectedPackageManager = await promptPackageManager();
	context = { ...context, packageManager: selectedPackageManager };

	const dependencies = ['stylelint', 'stylelint-config-standard'];
	const installNow = await promptInstallDependencies(context.packageManager, dependencies);

	if (installNow) {
		await installProjectDependencies(context);
		await createStylelintConfig(context);
		await showNextSteps(context.packageManager);
	} else {
		console.log(picocolors.yellow('Installation cancelled. No changes were made.'));
		context.exit(0);
	}
}

void main();
