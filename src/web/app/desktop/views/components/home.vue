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
			<div ref="left" data-place="left">
				<template v-for="widget in leftWidgets">
					<div class="customize-container" v-if="customize" :key="widget.id" @contextmenu.stop.prevent="onWidgetContextmenu(widget.id)">
						<component :is="widget.name" :widget="widget" :ref="widget.id"/>
					</div>
					<template v-else>
						<component :is="widget.name" :key="widget.id" :widget="widget" :ref="widget.id"/>
					</template>
				</template>
			</div>
		</div>
		<main ref="main">
			<div class="maintop" ref="maintop" data-place="main" v-if="customize">
				<template v-for="widget in centerWidgets">
					<div class="customize-container" v-if="customize" :key="widget.id" @contextmenu.stop.prevent="onWidgetContextmenu(widget.id)">
						<component :is="widget.name" :widget="widget" :ref="widget.id"/>
					</div>
					<template v-else>
						<component :is="widget.name" :key="widget.id" :widget="widget" :ref="widget.id"/>
					</template>
				</template>
			</div>
			<mk-timeline-home-widget ref="tl" @loaded="onTlLoaded" v-if="mode == 'timeline'"/>
			<mk-mentions-home-widget ref="tl" @loaded="onTlLoaded" v-if="mode == 'mentions'"/>
		</main>
		<div class="right">
			<div ref="right" data-place="right">
				<template v-for="widget in rightWidgets">
					<div class="customize-container" v-if="customize" :key="widget.id" @contextmenu.stop.prevent="onWidgetContextmenu(widget.id)">
						<component :is="widget.name" :widget="widget" :ref="widget.id"/>
					</div>
					<template v-else>
						<component :is="widget.name" :key="widget.id" :widget="widget" :ref="widget.id"/>
					</template>
				</template>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="typescript">
import Vue from 'vue';
import uuid from 'uuid';
import Sortable from 'sortablejs';

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
			home: [],
			bakedHomeData: null,
			widgetAdderSelected: null
		};
	},
	methods: {
		bakeHomeData() {
			return JSON.stringify(this.$root.$data.os.i.client_settings.home);
		},
		onTlLoaded() {
			this.$emit('loaded');
		},
		onMeRefreshed() {
			if (this.bakedHomeData != this.bakeHomeData()) {
				// TODO: i18n
				alert('別の場所でホームが編集されました。ページを再度読み込みすると編集が反映されます。');
			}
		},
		onWidgetContextmenu(widgetId) {
			(this.$refs[widgetId] as any).func();
		},
		addWidget() {
			const widget = {
				name: this.widgetAdderSelected,
				id: uuid(),
				place: 'left',
				data: {}
			};

			this.$root.$data.os.i.client_settings.home.unshift(widget);

			this.saveHome();
		},
		saveHome() {
			const data = [];

			Array.from((this.$refs.left as Element).children).forEach(el => {
				const id = el.getAttribute('data-widget-id');
				const widget = this.$root.$data.os.i.client_settings.home.find(w => w.id == id);
				widget.place = 'left';
				data.push(widget);
			});

			Array.from((this.$refs.right as Element).children).forEach(el => {
				const id = el.getAttribute('data-widget-id');
				const widget = this.$root.$data.os.i.client_settings.home.find(w => w.id == id);
				widget.place = 'right';
				data.push(widget);
			});

			Array.from((this.$refs.maintop as Element).children).forEach(el => {
				const id = el.getAttribute('data-widget-id');
				const widget = this.$root.$data.os.i.client_settings.home.find(w => w.id == id);
				widget.place = 'main';
				data.push(widget);
			});

			this.$root.$data.os.api('i/update_home', {
				home: data
			});
		}
	},
	computed: {
		leftWidgets(): any {
			return this.$root.$data.os.i.client_settings.home.filter(w => w.place == 'left');
		},
		centerWidgets(): any {
			return this.$root.$data.os.i.client_settings.home.filter(w => w.place == 'center');
		},
		rightWidgets(): any {
			return this.$root.$data.os.i.client_settings.home.filter(w => w.place == 'right');
		}
	},
	created() {
		this.bakedHomeData = this.bakeHomeData();
	},
	mounted() {
		this.$root.$data.os.i.on('refreshed', this.onMeRefreshed);

		this.home = this.$root.$data.os.i.client_settings.home;

		if (!this.customize) {
			if ((this.$refs.left as Element).children.length == 0) {
				(this.$refs.left as Element).parentNode.removeChild((this.$refs.left as Element));
			}
			if ((this.$refs.right as Element).children.length == 0) {
				(this.$refs.right as Element).parentNode.removeChild((this.$refs.right as Element));
			}
		}

		if (this.customize) {
			/*dialog('%fa:info-circle%カスタマイズのヒント',
				'<p>ホームのカスタマイズでは、ウィジェットを追加/削除したり、ドラッグ&ドロップして並べ替えたりすることができます。</p>' +
				'<p>一部のウィジェットは、<strong><strong>右</strong>クリック</strong>することで表示を変更することができます。</p>' +
				'<p>ウィジェットを削除するには、ヘッダーの<strong>「ゴミ箱」</strong>と書かれたエリアにウィジェットをドラッグ&ドロップします。</p>' +
				'<p>カスタマイズを終了するには、右上の「完了」をクリックします。</p>',
			[{
				text: 'Got it!'
			}]);*/

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

			new Sortable(this.$refs.left, sortableOption);
			new Sortable(this.$refs.right, sortableOption);
			new Sortable(this.$refs.maintop, sortableOption);
			new Sortable(this.$refs.trash, Object.assign({}, sortableOption, {
				onAdd: evt => {
					const el = evt.item;
					const id = el.getAttribute('data-widget-id');
					el.parentNode.removeChild(el);
					this.$root.$data.os.i.client_settings.home = this.$root.$data.os.i.client_settings.home.filter(w => w.id != id);
					this.saveHome();
				}
			}));
		}
	},
	beforeDestroy() {
		this.$root.$data.os.i.off('refreshed', this.onMeRefreshed);

		this.home.forEach(widget => {
			widget.unmount();
		});
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
