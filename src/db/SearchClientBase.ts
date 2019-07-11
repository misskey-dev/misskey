import {EventEmitter} from 'events';

export class SearchClientBase extends EventEmitter {
	public QUALIFIERS = {
		userId: 'userId',
		userHost: 'userHost'
	};
}
