import * as express from 'express';

import user from './user';
import inbox from './inbox';
import outbox from './outbox';
import publicKey from './publickey';
import post from './post';

const app = express();
app.disable('x-powered-by');

app.use(user);
app.use(inbox);
app.use(outbox);
app.use(publicKey);
app.use(post);

export default app;
