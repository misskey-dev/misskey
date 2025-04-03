declare module 'search-index:settings' {
	export type GeneratedSearchIndexItem = {
		id: string;
		path?: string;
		label: string;
		keywords: string[];
		icon?: string;
		inlining?: string[];
		children?: GeneratedSearchIndexItem[];
	};

	export const searchIndexes: GeneratedSearchIndexItem[];
}
