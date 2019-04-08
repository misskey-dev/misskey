import rndstr from 'rndstr';

export default () => `0${rndstr('a-zA-Z0-9', 15)}`;
