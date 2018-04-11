import rndstr from 'rndstr';

export default () => `!${rndstr('a-zA-Z0-9', 32)}`;
