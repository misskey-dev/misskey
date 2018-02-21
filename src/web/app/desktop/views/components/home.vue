<template>
<div class="mk-home" :data-customize="customize">
	<div class="customize" v-if="customize">
		<a href="/">%fa:check%完了</a>
		<div>
			<div class="adder">
				<p>ウィジェットを追加:</p>
				<select v-model="widgetAdderSelected">
					<option value="profile">プロフィール</option>
					<option value="calendar">カレンダー</option>
					<option value="timemachine">カレンダー(タイムマシン)</option>
					<option value="activity">アクティビティ</option>
					<option value="rss">RSSリーダー</option>
					<option value="trends">トレンド</option>
					<option value="photo-stream">フォトストリーム</option>
					<option value="slideshow">スライドショー</option>
					<option value="version">バージョン</option>
					<option value="broadcast">ブロードキャスト</option>
					<option value="notifications">通知</option>
					<option value="users">おすすめユーザー</option>
					<option value="polls">投票</option>
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
		<div v-for="place in ['left', 'main', 'right']" :class="place" :ref="place" :data-place="place">
			<template v-if="place != 'main'">
				<template v-for="widget in widgets[place]">
					<div class="customize-container" v-if="customize" :key="widget.id" @contextmenu.stop.prevent="onWidgetContextmenu(widget.id)" :data-widget-id="widget.id">
						<component :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id"/>
					</div>
					<template v-else>
						<component :is="`mkw-${widget.name}`" :key="widget.id" :widget="widget" :ref="widget.id" @chosen="warp"/>
					</template>
				</template>
			</template>
			<template v-else>
				<mk-timeline ref="tl" @loaded="onTlLoaded" v-if="place == 'main' && mode == 'timeline'"/>
				<mk-mentions @loaded="onTlLoaded" v-if="place == 'main' && mode == 'mentions'"/>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as uuid from 'uuid';
import * as Sortable from 'sortablejs';

export default Vue.extend({
	props: {
		customize: Boolean,
		mode: {
			type: String,
			default: 'timeline'
		}
	},
	data() {
		return {
			widgetAdderSelected: null
		};
	},
	computed: {
		home(): any {
			//#region 互換性のため
			(this as any).os.i.client_settings.home.forEach(w => {
				if (w.name == 'rss-reader') w.name = 'rss';
				if (w.name == 'user-recommendation') w.name = 'users';
				if (w.name == 'recommended-polls') w.name = 'polls';
			});
			//#endregion
			return (this as any).os.i.client_settings.home;
		},
		leftWidgets(): any {
			return this.home.filter(w => w.place == 'left');
		},
		rightWidgets(): any {
			return this.home.filter(w => w.place == 'right');
		},
		widgets(): any {
			return {
				left: this.leftWidgets,
				right: this.rightWidgets,
			};
		},
		leftEl(): Element {
			return (this.$refs.left as Element[])[0];
		},
		rightEl(): Element {
			return (this.$refs.right as Element[])[0];
		}
	},
	mounted() {
		this.$nextTick(() => {
			if (!this.customize) {
				if (this.leftEl.children.length == 0) {
					this.leftEl.parentNode.removeChild(this.leftEl);
				}
				if (this.rightEl.children.length == 0) {
					this.rightEl.parentNode.removeChild(this.rightEl);
				}
			}

			if (this.customize) {
				(this as any).apis.dialog({
					title: '%fa:info-circle%カスタマイズのヒント',
					text: '<p>ホームのカスタマイズでは、ウィジェットを追加/削除したり、ドラッグ&ドロップして並べ替えたりすることができます。</p>' +
						'<p>一部のウィジェットは、<strong><strong>右</strong>クリック</strong>することで表示を変更することができます。</p>' +
						'<p>ウィジェットを削除するには、ヘッダーの<strong>「ゴミ箱」</strong>と書かれたエリアにウィジェットをドラッグ&ドロップします。</p>' +
						'<p>カスタマイズを終了するには、右上の「完了」をクリックします。</p>',
					actions: [{
						text: 'Got it!'
					}]
				});

				const sortableOption = {
					group: 'kyoppie',
					animation: 150,
					onMove: evt => {
						const id = evt.dragged.getAttribute('data-widget-id');
						this.home.find(w => w.id == id).place = evt.to.getAttribute('data-place');
					},
					onSort: () => {
						this.saveHome();
					}
				};

				new Sortable(this.leftEl, sortableOption);
				new Sortable(this.rightEl, sortableOption);
				new Sortable(this.$refs.trash, Object.assign({}, sortableOption, {
					onAdd: evt => {
						const el = evt.item;
						const id = el.getAttribute('data-widget-id');
						el.parentNode.removeChild(el);
						(this as any).os.i.client_settings.home = this.home.filter(w => w.id != id);
						this.saveHome();
					}
				}));
			}
		});
	},
	methods: {
		onTlLoaded() {
			this.$emit('loaded');
		},
		onWidgetContextmenu(widgetId) {
			(this.$refs[widgetId] as any)[0].func();
		},
		addWidget() {
			const widget = {
				name: this.widgetAdderSelected,
				id: uuid(),
				place: 'left',
				data: {}
			};

			this.home.unshift(widget);

			this.saveHome();
		},
		saveHome() {
			(this as any).api('i/update_home', {
				home: this.home
			});
		},
		warp(date) {
			(this.$refs.tl as any)[0].warp(date);
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-home
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

		> .main
			padding 16px
			width calc(100% - 275px * 2)

		> *:not(main)
			width 275px
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

			> .main
				float none
				width 100%
				max-width 700px
				margin 0 auto

</style>
