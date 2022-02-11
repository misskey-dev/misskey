declare module 'sonic-channel' {
	type ConnectionListeners = {
		connected?: () => void,
		disconnected?: (err: Error | null) => void,
		timeout?: () => void,
		retrying?: () => void,
		error?: (err: Error) => void,
	};

	type ConnectionParams = {
		host: string,
		port: number,
		auth: string | null
	};

	class Ingest {
		constructor(options: ConnectionParams);

		public connect(handlers: ConnectionListeners): Ingest;
		public close(): Promise<void>;

		public push(collection_id: string, bucket_id: string, object_id: string, text: string, lang?: string): Promise<void>;
	}

	class Search {
		constructor(options: ConnectionParams);

		public connect(handlers: ConnectionListeners): Search;
		public close(): Promise<void>;

		public query(collection_id: string, bucket_id: string, terms_text: string, limit?: number, offset?: number, lang?: string): Promise<string[]>;
	}
}
