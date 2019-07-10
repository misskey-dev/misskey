import {EventEmitter} from 'events';

export class SearchClientBase extends EventEmitter {
	QUALIFIERS = {
		userId: 'userId',
		userHost: 'userHost'
	};
}

