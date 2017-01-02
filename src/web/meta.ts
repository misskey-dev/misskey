import * as express from 'express';
import git = require('git-last-commit');

module.exports = async (req: express.Request, res: express.Response) => {
	// Get commit info
	git.getLastCommit((err, commit) => {
		res.send({
			commit: commit
		});
	}, {
		dst: `${__dirname}/../../`
	});
};
