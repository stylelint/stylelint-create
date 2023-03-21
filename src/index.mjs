/* eslint-disable no-process-exit */
/* eslint no-console: 'off' */

import * as path from 'node:path';
import { cosmiconfigSync } from 'cosmiconfig';
import detectPackageManager from 'which-pm-runs';
import { execa } from 'execa';
import fs from 'fs';
import ora from 'ora';
import picocolors from 'picocolors';
import stripIndent from 'strip-indent';

const DEFAULT_CONFIG_FILE = '.stylelintrc.json';

function getExistingConfigInDirectory() {
	const explorer = cosmiconfigSync('stylelint');

	return explorer.search();
}

/**
 * @param {fs.PathLike} dir
 */
function directoryHasPackageJson(dir) {
	return fs.readdirSync(dir).some((file) => file === 'package.json');
}

/**
 * @param {string} pkgManager
 */
function getInstallCommand(pkgManager) {
	return pkgManager === 'npm' ? 'install' : 'add';
}

/**
 * @param {string} cwd
 * @param {string} pkgManager
 */
function createConfig(cwd, pkgManager) {
	const spinner = ora('Creating config...').start();
	const existingConfigs = getExistingConfigInDirectory();

	if (existingConfigs !== null) {
		const basename = path.basename(existingConfigs.filepath);
		const failureMessage =
			basename === 'package.json'
				? 'The "stylelint" config in "package.json" already exists. Remove it and then try again.'
				: `Failed to create config:\nThe "${basename}" config already exists. Remove it and then try again.`;

		spinner.fail(failureMessage);
		process.exit(1);
	}

	if (!directoryHasPackageJson(cwd)) {
		spinner.fail(
			`Failed to create config:\npackage.json was not found. Run "${pkgManager} init" and then try again.`,
		);
		process.exit(1);
	}

	try {
		fs.writeFileSync(DEFAULT_CONFIG_FILE, '{ "extends": ["stylelint-config-standard"] }');
	} catch (error) {
		spinner.fail(`Failed to create config:\n${error}`);
		process.exit(1);
	}

	spinner.succeed(`Created ${DEFAULT_CONFIG_FILE}.`);
}

/**
 * @param {string} cwd
 * @param {string} pkgManager
 */
async function installPackages(cwd, pkgManager) {
	const spinner = ora('Installing packages...').start();

	try {
		await execa(
			pkgManager,
			[`${getInstallCommand(pkgManager)}`, '-D', 'stylelint', 'stylelint-config-standard'],
			{ cwd },
		);
	} catch (error) {
		spinner.fail(`Failed to install packages:\n${error}`);
		process.exit(1);
	}

	spinner.succeed('Installed packages.');
}

function showNextSteps() {
	console.log(
		stripIndent(`
			${picocolors.green(`You can now lint your CSS files using:
			npx stylelint "**/*.css"`)}

			${picocolors.dim(`We recommend customizing Stylelint:
			https://stylelint.io/user-guide/customize/`)}
		`),
	);
}

export async function main() {
	const pkgManager = detectPackageManager()?.name ?? 'npm';
	const cwd = './';

	createConfig(cwd, pkgManager);
	await installPackages(cwd, pkgManager);
	showNextSteps();
}
