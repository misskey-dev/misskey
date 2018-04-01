import * as express from 'express';

import user from './user';
import inbox from './inbox';

const app = express();
app.disable('x-powered-by');

app.use(user);
app.use(inbox);

export default app;
