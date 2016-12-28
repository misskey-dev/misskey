import * as express from 'express';

export default (res: express.Response, x?: any, y?: any) => {
	if (x === undefined) {
		res.sendStatus(204);
	} else if (typeof x === 'number') {
		res.status(x).send({
			error: x === 500 ? 'INTERNAL_ERROR' : y
		});
	} else {
		res.send(x);
	}
};
