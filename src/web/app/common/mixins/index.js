import activateMe from './i';
import activateApi from './api';
import activateStream from './stream';

export default (me, stream) => {
	activateMe(me);
	activateApi(me);
	activateStream(stream);
};
