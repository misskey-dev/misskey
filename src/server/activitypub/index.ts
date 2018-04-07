import * as express from 'express';

import user from './user';
import inbox from './inbox';
import outbox from './outbox';
import publicKey from './publickey';
import note from './note';

const app = express();
app.disable('x-powered-by');

app.use(user);
app.use(inbox);
app.use(outbox);
app.use(publicKey);
app.use(note);

export default app;
