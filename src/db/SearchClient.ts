import {EventEmitter} from "events";

export class SearchClient extends EventEmitter {
	QUALIFIERS = {
		userId: "userId",
		userHost: "userHost"
	};
}
