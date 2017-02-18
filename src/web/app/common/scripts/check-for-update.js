module.exports = () => {
	fetch('/api:meta').then(res => {
		res.json().then(meta => {
			if (meta.commit.hash !== VERSION) {
				if (window.confirm('新しいMisskeyのバージョンがあります。更新しますか？\r\n(このメッセージが繰り返し表示される場合は、サーバーにデータがまだ届いていない可能性があるので、少し時間を置いてから再度お試しください)')) {
					location.reload(true);
				}
			}
		});
	});
};
