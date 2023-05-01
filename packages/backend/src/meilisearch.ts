import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
	host: 'http://127.0.0.1:7700',
	apiKey: 'masterKey', //TODO: Masterkeyをコンフィグから読み込む
});

const index = client.index('misskey'); //TODO: ここもコンフィグから読み込む

export default index;

// 動かない。
