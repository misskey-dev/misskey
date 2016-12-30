import Logger from './logger';
import * as chalk from 'chalk';
const prominence = require('prominence');
const git = require('git-last-commit');

export default class LastCommitInfo {
	static async show(): Promise<void> {
		let logger = new Logger('LastCommit');
		try {
			const commit = await prominence(git).getLastCommit();
			const shortHash: string = commit.shortHash;
			const hash: string = commit.hash;
			const commitDate = new Date(parseInt(commit.committedOn, 10) * 1000).toLocaleDateString('ja-JP');
			const commitTime = new Date(parseInt(commit.committedOn, 10) * 1000).toLocaleTimeString('ja-JP');
			logger.info(`${shortHash}${chalk.gray(hash.substr(shortHash.length))}`);
			logger.info(`${commit.subject} ${chalk.green(`(${commitDate} ${commitTime})`)} ${chalk.blue(`<${commit.author.name}>`)}`);
		} catch (e) {
			logger.info('No commit information found');
		}
	}
}
