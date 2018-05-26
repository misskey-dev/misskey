<template>
<mk-ui>
	<span slot="header">%fa:home%ダッシュボード</span>
	<template slot="func">
		<button @click="customizing = !customizing">%fa:cog%</button>
	</template>
	<main>
		<template v-if="customizing">
			<header>
				<select v-model="widgetAdderSelected">
					<option value="profile">プロフィール</option>
					<option value="calendar">カレンダー</option>
					<option value="activity">アクティビティ</option>
					<option value="rss">RSSリーダー</option>
					<option value="photo-stream">フォトストリーム</option>
					<option value="slideshow">スライドショー</option>
					<option value="version">バージョン</option>
					<option value="server">サーバー情報</option>
					<option value="donation">寄付のお願い</option>
					<option value="nav">ナビゲーション</option>
					<option value="tips">ヒント</option>
				</select>
				<button @click="addWidget">追加</button>
				<p><a @click="hint">カスタマイズのヒント</a></p>
			</header>
			<x-draggable
				:list="widgets"
				:options="{ handle: '.handle', animation: 150 }"
				@sort="onWidgetSort"
			>
				<div v-for="widget in widgets" class="customize-container" :key="widget.id">
					<header>
						<span class="handle">%fa:bars%</span>{{ widget.name }}<button class="remove" @click="removeWidget(widget)">%fa:times%</button>
					</header>
					<div @click="widgetFunc(widget.id)">
						<component :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id" :is-customize-mode="true" :is-mobile="true"/>
					</div>
				</div>
			</x-draggable>
		</template>
		<template v-else>
			<component class="widget" v-for="widget in widgets" :is="`mkw-${widget.name}`" :key="widget.id" :ref="widget.id" :widget="widget" :is-mobile="true"/>
		</template>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import * as XDraggable from 'vuedraggable';
import * as uuid from 'uuid';

export default Vue.extend({
	components: {
		XDraggable
	},

	data() {
		return {
			showNav: false,
			customizing: false,
			widgetAdderSelected: null
		};
	},

	computed: {
		widgets(): any[] {
			return this.$store.state.settings.mobileHome;
		}
	},

	created() {
		if (this.widgets.length == 0) {
			this.widgets = [{
				name: 'calendar',
				id: 'a', data: {}
			}, {
				name: 'activity',
				id: 'b', data: {}
			}, {
				name: 'rss',
				id: 'c', data: {}
			}, {
				name: 'photo-stream',
				id: 'd', data: {}
			}, {
				name: 'donation',
				id: 'e', data: {}
			}, {
				name: 'nav',
				id: 'f', data: {}
			}, {
				name: 'version',
				id: 'g', data: {}
			}];
			this.saveHome();
		}
	},

	mounted() {
		document.title = 'Misskey';
	},

	methods: {
		hint() {
			alert('ウィジェットを追加/削除したり並べ替えたりできます。ウィジェットを移動するには「三」をドラッグします。ウィジェットを削除するには「x」をタップします。いくつかのウィジェットはタップすることで表示を変更できます。');
		},

		widgetFunc(id) {
			const w = this.$refs[id][0];
			if (w.func) w.func();
		},

		onWidgetSort() {
			this.saveHome();
		},

		addWidget() {
			this.$store.dispatch('settings/addMobileHomeWidget', {
				name: this.widgetAdderSelected,
				id: uuid(),
				data: {}
			});
		},

		removeWidget(widget) {
			this.$store.dispatch('settings/removeMobileHomeWidget', widget);
		},

		saveHome() {
			this.$store.commit('settings/setMobileHome', this.widgets);
			(this as any).api('i/update_mobile_home', {
				home: this.widgets
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
main
	margin 0 auto
	padding 8px
	max-width 500px
	width 100%

	@media (min-width 500px)
		padding 16px 8px

	@media (min-width 600px)
		padding 32px 8px

	> header
		padding 8px
		background #fff

	.widget
		margin-bottom 8px

		@media (min-width 600px)
			margin-bottom 16px

	.customize-container
		margin 8px
		background #fff

		> header
			line-height 32px
			background #eee

			> .handle
				padding 0 8px

			> .remove
				position absolute
				top 0
				right 0
				padding 0 8px
				line-height 32px

		> div
			padding 8px

			> *
				pointer-events none

</style>
