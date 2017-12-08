import dialog from './dialog';

export default () => {
	dialog('%fa:exclamation-triangle%Not implemented yet',
		'要求された操作は実装されていません。<br>→<a href="https://github.com/syuilo/misskey" target="_blank">Misskeyの開発に参加する</a>', [{
		text: 'OK'
	}]);
};
