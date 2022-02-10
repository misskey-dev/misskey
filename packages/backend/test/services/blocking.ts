process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { async, signup, request, post, startServer, shutdownServer, initTestDb } from '../utils';
import * as sinon from 'sinon';

describe('Creating a block activity', () => {
	let p: childProcess.ChildProcess;

	// alice blocks bob
	let alice: any;
	let bob: any;
	let carol: any;

	before(async () => {
		await initTestDb();
		p = await startServer();
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		carol = await signup({ username: 'carol' });
		bob.host = 'http://remote';
		carol.host = 'http://remote';
	});

	beforeEach(() => {
		sinon.restore();
	});

	after(async () => {
		await shutdownServer(p);
	});

	it('Should federate blocks normally', async(async () => {
		const createBlock = (await import('../../src/services/blocking/create')).default;
		const deleteBlock = (await import('../../src/services/blocking/delete')).default;

		const queues = await import('../../src/queue/index');
		const spy = sinon.spy(queues, 'deliver');
		await createBlock(alice, bob);
		assert(spy.calledOnce);
		await deleteBlock(alice, bob);
		assert(spy.calledTwice);
	}));

	it('Should not federate blocks if federateBlocks is false', async () => {
		const createBlock = (await import('../../src/services/blocking/create')).default;
		const deleteBlock = (await import('../../src/services/blocking/delete')).default;

		alice.federateBlocks = true;

		const queues = await import('../../src/queue/index');
		const spy = sinon.spy(queues, 'deliver');
		await createBlock(alice, carol);
		await deleteBlock(alice, carol);
		assert(spy.notCalled);
	});
});
