<mk-home data-customize={ opts.customize }>
	<div class="customize" if={ opts.customize }>
		<a href="/">%fa:check%完了</a>
		<div>
			<div class="adder">
				<p>ウィジェットを追加:</p>
				<select ref="widgetSelector">
					<option value="profile">プロフィール</option>
					<option value="calendar">カレンダー</option>
					<option value="timemachine">カレンダー(タイムマシン)</option>
					<option value="activity">アクティビティ</option>
					<option value="rss-reader">RSSリーダー</option>
					<option value="trends">トレンド</option>
					<option value="photo-stream">フォトストリーム</option>
					<option value="slideshow">スライドショー</option>
					<option value="version">バージョン</option>
					<option value="broadcast">ブロードキャスト</option>
					<option value="notifications">通知</option>
					<option value="user-recommendation">おすすめユーザー</option>
					<option value="recommended-polls">投票</option>
					<option value="post-form">投稿フォーム</option>
					<option value="messaging">メッセージ</option>
					<option value="channel">チャンネル</option>
					<option value="access-log">アクセスログ</option>
					<option value="server">サーバー情報</option>
					<option value="donation">寄付のお願い</option>
					<option value="nav">ナビゲーション</option>
					<option value="tips">ヒント</option>
				</select>
				<button @click="addWidget">追加</button>
			</div>
			<div class="trash">
				<div ref="trash"></div>
				<p>ゴミ箱</p>
			</div>
		</div>
	</div>
	<div class="main">
		<div class="left">
			<div ref="left" data-place="left"></div>
		</div>
		<main ref="main">
			<div class="maintop" ref="maintop" data-place="main" if={ opts.customize }></div>
			<mk-timeline-home-widget ref="tl" if={ mode == 'timeline' }/>
			<mk-mentions-home-widget ref="tl" if={ mode == 'mentions' }/>
		</main>
		<div class="right">
			<div ref="right" data-place="right"></div>
		</div>
	</div>
	<style>
		:scope
			display block

			&[data-customize]
				padding-top 48px
				background-image url('/assets/desktop/grid.svg')

				> .main > main > *:not(.maintop)
					cursor not-allowed

					> *
						pointer-events none

			&:not([data-customize])
				> .main > *:empty
					display none

			> .customize
				position fixed
				z-index 1000
				top 0
				left 0
				width 100%
				height 48px
				background #f7f7f7
				box-shadow 0 1px 1px rgba(0, 0, 0, 0.075)

				> a
					display block
					position absolute
					z-index 1001
					top 0
					right 0
					padding 0 16px
					line-height 48px
					text-decoration none
					color $theme-color-foreground
					background $theme-color
					transition background 0.1s ease

					&:hover
						background lighten($theme-color, 10%)

					&:active
						background darken($theme-color, 10%)
						transition background 0s ease

					> [data-fa]
						margin-right 8px

				> div
					display flex
					margin 0 auto
					max-width 1200px - 32px

					> div
						width 50%

						&.adder
							> p
								display inline
								line-height 48px

						&.trash
							border-left solid 1px #ddd

							> div
								width 100%
								height 100%

							> p
								position absolute
								top 0
								left 0
								width 100%
								line-height 48px
								margin 0
								text-align center
								pointer-events none

			> .main
				display flex
				justify-content center
				margin 0 auto
				max-width 1200px

				> *
					.customize-container
						cursor move

						> *
							pointer-events none

				> main
					padding 16px
					width calc(100% - 275px * 2)

					> *:not(.maintop):not(:last-child)
					> .maintop > *:not(:last-child)
						margin-bottom 16px

					> .maintop
						min-height 64px
						margin-bottom 16px

				> *:not(main)
					width 275px

					> *
						padding 16px 0 16px 0

						> *:not(:last-child)
							margin-bottom 16px

				> .left
					padding-left 16px

				> .right
					padding-right 16px

				@media (max-width 1100px)
					> *:not(main)
						display none

					> main
						float none
						width 100%
						max-width 700px
						margin 0 auto

	</style>
	<script>
		import uuid from 'uuid';
		import Sortable from 'sortablejs';
		import dialog from '../scripts/dialog';
		import ScrollFollower from '../scripts/scroll-follower';

		this.mixin('i');
		this.mixin('api');

		this.mode = this.opts.mode || 'timeline';

		this.home = [];

		this.bakeHomeData = () => JSON.stringify(this.I.client_settings.home);
		this.bakedHomeData = this.bakeHomeData();

		this.on('mount', () => {
			this.refs.tl.on('loaded', () => {
				this.trigger('loaded');
			});

			this.I.on('refreshed', this.onMeRefreshed);

			this.I.client_settings.home.forEach(widget => {
				try {
					this.setWidget(widget);
				} catch (e) {
					// noop
				}
			});

			if (!this.opts.customize) {
				if (this.refs.left.children.length == 0) {
					this.refs.left.parentNode.removeChild(this.refs.left);
				}
				if (this.refs.right.children.length == 0) {
					this.refs.right.parentNode.removeChild(this.refs.right);
				}
			}

			if (this.opts.customize) {
				dialog('%fa:info-circle%カスタマイズのヒント',
					'<p>ホームのカスタマイズでは、ウィジェットを追加/削除したり、ドラッグ&ドロップして並べ替えたりすることができます。</p>' +
					'<p>一部のウィジェットは、<strong><strong>右</strong>クリック</strong>することで表示を変更することができます。</p>' +
					'<p>ウィジェットを削除するには、ヘッダーの<strong>「ゴミ箱」</strong>と書かれたエリアにウィジェットをドラッグ&ドロップします。</p>' +
					'<p>カスタマイズを終了するには、右上の「完了」をクリックします。</p>',
				[{
					text: 'Got it!'
				}]);

				const sortableOption = {
					group: 'kyoppie',
					animation: 150,
					onMove: evt => {
						const id = evt.dragged.getAttribute('data-widget-id');
						this.home.find(tag => tag.id == id).update({ place: evt.to.getAttribute('data-place') });
					},
					onSort: () => {
						this.saveHome();
					}
				};

				new Sortable(this.refs.left, sortableOption);
				new Sortable(this.refs.right, sortableOption);
				new Sortable(this.refs.maintop, sortableOption);
				new Sortable(this.refs.trash, Object.assign({}, sortableOption, {
					onAdd: evt => {
						const el = evt.item;
						const id = el.getAttribute('data-widget-id');
						el.parentNode.removeChild(el);
						this.I.client_settings.home = this.I.client_settings.home.filter(w => w.id != id);
						this.saveHome();
					}
				}));
			}

			if (!this.opts.customize) {
				this.scrollFollowerLeft = this.refs.left.parentNode ? new ScrollFollower(this.refs.left, this.root.getBoundingClientRect().top) : null;
				this.scrollFollowerRight = this.refs.right.parentNode ? new ScrollFollower(this.refs.right, this.root.getBoundingClientRect().top) : null;
			}
		});

		this.on('unmount', () => {
			this.I.off('refreshed', this.onMeRefreshed);

			this.home.forEach(widget => {
				widget.unmount();
			});

			if (!this.opts.customize) {
				if (this.scrollFollowerLeft) this.scrollFollowerLeft.dispose();
				if (this.scrollFollowerRight) this.scrollFollowerRight.dispose();
			}
		});

		this.onMeRefreshed = () => {
			if (this.bakedHomeData != this.bakeHomeData()) {
				alert('別の場所でホームが編集されました。ページを再度読み込みすると編集が反映されます。');
			}
		};

		this.setWidget = (widget, prepend = false) => {
			const el = document.createElement(`mk-${widget.name}-home-widget`);

			let actualEl;

			if (this.opts.customize) {
				const container = document.createElement('div');
				container.classList.add('customize-container');
				container.setAttribute('data-widget-id', widget.id);
				container.appendChild(el);
				actualEl = container;
			} else {
				actualEl = el;
			}

			switch (widget.place) {
				case 'left':
					if (prepend) {
						this.refs.left.insertBefore(actualEl, this.refs.left.firstChild);
					} else {
						this.refs.left.appendChild(actualEl);
					}
					break;
				case 'right':
					if (prepend) {
						this.refs.right.insertBefore(actualEl, this.refs.right.firstChild);
					} else {
						this.refs.right.appendChild(actualEl);
					}
					break;
				case 'main':
					if (this.opts.customize) {
						this.refs.maintop.appendChild(actualEl);
					} else {
						this.refs.main.insertBefore(actualEl, this.refs.tl.root);
					}
					break;
			}

			const tag = riot.mount(el, {
				id: widget.id,
				data: widget.data,
				place: widget.place,
				tl: this.refs.tl
			})[0];

			this.home.push(tag);

			if (this.opts.customize) {
				actualEl.oncontextmenu = e => {
					e.preventDefault();
					e.stopImmediatePropagation();
					if (tag.func) tag.func();
					return false;
				};
			}
		};

		this.addWidget = () => {
			const widget = {
				name: this.refs.widgetSelector.options[this.refs.widgetSelector.selectedIndex].value,
				id: uuid(),
				place: 'left',
				data: {}
			};

			this.I.client_settings.home.unshift(widget);

			this.setWidget(widget, true);

			this.saveHome();
		};

		this.saveHome = () => {
			const data = [];

			Array.from(this.refs.left.children).forEach(el => {
				const id = el.getAttribute('data-widget-id');
				const widget = this.I.client_settings.home.find(w => w.id == id);
				widget.place = 'left';
				data.push(widget);
			});

			Array.from(this.refs.right.children).forEach(el => {
				const id = el.getAttribute('data-widget-id');
				const widget = this.I.client_settings.home.find(w => w.id == id);
				widget.place = 'right';
				data.push(widget);
			});

			Array.from(this.refs.maintop.children).forEach(el => {
				const id = el.getAttribute('data-widget-id');
				const widget = this.I.client_settings.home.find(w => w.id == id);
				widget.place = 'main';
				data.push(widget);
			});

			this.api('i/update_home', {
				home: data
			}).then(() => {
				this.I.update();
			});
		};
	</script>
</mk-home>
