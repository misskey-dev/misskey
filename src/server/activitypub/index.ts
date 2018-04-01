import * as express from 'express';

import post from './post';
import user from './user';
import inbox from './inbox';

const app = express();
app.disable('x-powered-by');

app.use(post);
app.use(user);
app.use(inbox);

export default app;
