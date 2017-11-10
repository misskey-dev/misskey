<mk-home data-customize={ opts.customize }>
	<div class="customize" if={ opts.customize }>
		<div class="adder">
			<p>ウィジェットを追加:</p>
			<select ref="widgetSelector">
				<option value="profile">プロフィール</option>
				<option value="calendar">カレンダー</option>
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
				<option value="channel">チャンネル</option>
				<option value="server">サーバー情報</option>
				<option value="donation">寄付のお願い</option>
				<option value="nav">ナビゲーション</option>
				<option value="tips">ヒント</option>
			</select>
			<button onclick={ addWidget }>追加</button>
		</div>
		<div class="trash">
			<div ref="trash"></div>
			<p><b>ゴミ箱</b><br>(ここにウィジェットをドロップすると削除できます)</p>
		</div>
	</div>
	<div class="main">
		<div class="left" ref="left"></div>
		<main>
			<mk-timeline-home-widget ref="tl" if={ mode == 'timeline' }/>
			<mk-mentions-home-widget ref="tl" if={ mode == 'mentions' }/>
		</main>
		<div class="right" ref="right"></div>
	</div>
	<style>
		:scope
			display block

			&:not([data-customize])
				> .main > *:empty
					display none

			> .customize
				display flex
				margin 0 auto
				max-width 1200px - 32px
				background #fff
				border-radius 0 0 16px 16px
				border solid 1px #ddd
				border-top none

				> div
					width 50%

					&.adder
						padding 16px

						> p
							display inline

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
							margin 0
							text-align center
							pointer-events none

			> .main
				display flex
				justify-content center
				margin 0 auto
				max-width 1200px

				> *
					> *:not(.customize-container)
					> .customize-container > *
						display block
						border solid 1px rgba(0, 0, 0, 0.075)
						border-radius 6px

					> *:not(.customize-container)
					> .customize-container
						&:not(:last-child)
							margin-bottom 16px

				> main
					padding 16px
					width calc(100% - 275px * 2)

				> *:not(main)
					width 275px

					> .customize-container
						cursor move

						> *
							pointer-events none

				> .left
					padding 16px 0 16px 16px

				> .right
					padding 16px 16px 16px 0

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

		this.mixin('i');
		this.mixin('api');

		this.mode = this.opts.mode || 'timeline';

		this.home = [];

		this.on('mount', () => {
			this.refs.tl.on('loaded', () => {
				this.trigger('loaded');
			});

			this.I.client_settings.home.forEach(widget => {
				try {
					this.setWidget(widget);
				} catch (e) {
					// noop
				}
			});

			if (this.opts.customize) {
				const sortableOption = {
					group: 'kyoppie',
					animation: 150,
					onSort: this.saveHome
				};

				new Sortable(this.refs.left, sortableOption);
				new Sortable(this.refs.right, sortableOption);
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
		});

		this.on('unmount', () => {
			this.home.forEach(widget => {
				widget.unmount();
			});
		});

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
			}

			this.home.push(riot.mount(el, {
				id: widget.id,
				data: widget.data
			})[0]);
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

			this.api('i/update_home', {
				home: data
			}).then(() => {
				this.I.client_settings.home = data;
				this.I.update();
			});
		};
	</script>
</mk-home>
