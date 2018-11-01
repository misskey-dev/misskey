export type IMastodonTag = {
	name: string,
	url: string,
	history?: {
		day: string,
		uses: number,
		accounts: number
	}
};

// TODO: Implement converter for Misskey's tags
