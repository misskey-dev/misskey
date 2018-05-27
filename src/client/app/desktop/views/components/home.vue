<template>
<div class="mk-home" :data-customize="customize">
	<div class="customize" v-if="customize">
		<router-link to="/">%fa:check%%i18n:@done%</router-link>
		<div>
			<div class="adder">
				<p>%i18n:@add-widget%</p>
				<select v-model="widgetAdderSelected">
					<option value="profile">%i18n:@profile%</option>
					<option value="calendar">%i18n:@calendar%</option>
					<option value="timemachine">%i18n:@timemachine%</option>
					<option value="activity">%i18n:@activity%</option>
					<option value="rss">%i18n:@rss%</option>
					<option value="trends">%i18n:@trends%</option>
					<option value="photo-stream">%i18n:@photo-stream%</option>
					<option value="slideshow">%i18n:@slideshow%</option>
					<option value="version">%i18n:@version%</option>
					<option value="broadcast">%i18n:@broadcast%</option>
					<option value="notifications">%i18n:@notifications%</option>
					<option value="users">%i18n:@users%</option>
					<option value="polls">%i18n:@polls%</option>
					<option value="post-form">%i18n:@post-form%</option>
					<option value="messaging">%i18n:@messaging%</option>
					<option value="server">%i18n:@server%</option>
					<option value="donation">%i18n:@donation%</option>
					<option value="nav">%i18n:@nav%</option>
					<option value="tips">%i18n:@tips%</option>
				</select>
				<button @click="addWidget">%i18n:@add%</button>
			</div>
			<div class="trash">
				<x-draggable v-model="trash" :options="{ group: 'x' }" @add="onTrash"></x-draggable>
				<p>ゴミ箱</p>
			</div>
		</div>
	</div>
	<div class="main">
		<template v-if="customize">
			<x-draggable v-for="place in ['left', 'right']"
				:list="widgets[place]"
				:class="place"
				:data-place="place"
				:options="{ group: 'x', animation: 150 }"
				@sort="onWidgetSort"
				:key="place"
			>
				<div v-for="widget in widgets[place]" class="customize-container" :key="widget.id" @contextmenu.stop.prevent="onWidgetContextmenu(widget.id)">
					<component :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id" :is-customize-mode="true"/>
				</div>
			</x-draggable>
			<div class="main">
				<a @click="hint">カスタマイズのヒント</a>
				<div>
					<mk-post-form v-if="$store.state.settings.showPostFormOnTopOfTl"/>
					<mk-timeline ref="tl" @loaded="onTlLoaded"/>
				</div>
			</div>
		</template>
		<template v-else>
			<div v-for="place in ['left', 'right']" :class="place">
				<component v-for="widget in widgets[place]" :is="`mkw-${widget.name}`" :key="widget.id" :ref="widget.id" :widget="widget" @chosen="warp"/>
			</div>
			<div class="main">
				<mk-post-form v-if="$store.state.settings.showPostFormOnTopOfTl"/>
				<mk-timeline ref="tl" @loaded="onTlLoaded" v-if="mode == 'timeline'"/>
				<mk-mentions @loaded="onTlLoaded" v-if="mode == 'mentions'"/>
			</div>
		</template>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as XDraggable from 'vuedraggable';
import * as uuid from 'uuid';

export default Vue.extend({
	components: {
		XDraggable
	},

	props: {
		customize: {
			type: Boolean,
			default: false
		},
		mode: {
			type: String,
			default: 'timeline'
		}
	},

	data() {
		return {
			connection: null,
			connectionId: null,
			widgetAdderSelected: null,
			trash: []
		};
	},

	computed: {
		home(): any[] {
			return this.$store.state.settings.home;
		},
		left(): any[] {
			return this.home.filter(w => w.place == 'left');
		},
		right(): any[] {
			return this.home.filter(w => w.place == 'right');
		},
		widgets(): any {
			return {
				left: this.left,
				right: this.right
			};
		}
	},

	mounted() {
		this.connection = (this as any).os.stream.getConnection();
		this.connectionId = (this as any).os.stream.use();
	},

	beforeDestroy() {
		(this as any).os.stream.dispose(this.connectionId);
	},

	methods: {
		hint() {
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
		},

		onTlLoaded() {
			this.$emit('loaded');
		},

		onWidgetContextmenu(widgetId) {
			const w = (this.$refs[widgetId] as any)[0];
			if (w.func) w.func();
		},

		onWidgetSort() {
			this.saveHome();
		},

		onTrash(evt) {
			this.saveHome();
		},

		addWidget() {
			this.$store.dispatch('settings/addHomeWidget', {
				name: this.widgetAdderSelected,
				id: uuid(),
				place: 'left',
				data: {}
			});
		},

		saveHome() {
			const left = this.widgets.left;
			const right = this.widgets.right;
			this.$store.commit('settings/setHome', left.concat(right));
			left.forEach(w => w.place = 'left');
			right.forEach(w => w.place = 'right');
			(this as any).api('i/update_home', {
				home: this.home
			});
		},

		warp(date) {
			(this.$refs.tl as any).warp(date);
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	display block

	&[data-customize]
		padding-top 48px
		background-image url('/assets/desktop/grid.svg')

		> .main > .main
			> a
				display block
				margin-bottom 8px
				text-align center

			> div
				cursor not-allowed !important

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
		color isDark ? #fff : #000
		background isDark ? #313543 : #f7f7f7
		box-shadow 0 1px 1px rgba(#000, 0.075)

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
			max-width 1220px - 32px

			> div
				width 50%

				&.adder
					> p
						display inline
						line-height 48px

				&.trash
					border-left solid 1px isDark ? #1c2023 : #ddd

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
		max-width 1220px

		> *
			.customize-container
				cursor move
				border-radius 6px

				&:hover
					box-shadow 0 0 8px rgba(64, 120, 200, 0.3)

				> *
					pointer-events none

		> .main
			padding 16px
			width calc(100% - 275px * 2)
			order 2

			.mk-post-form
				margin-bottom 16px
				border solid 1px rgba(#000, 0.075)
				border-radius 4px

		> *:not(.main)
			width 275px
			padding 16px 0 16px 0

			> *:not(:last-child)
				margin-bottom 16px

		> .left
			padding-left 16px
			order 1

		> .right
			padding-right 16px
			order 3

		@media (max-width 1100px)
			> *:not(.main)
				display none

			> .main
				float none
				width 100%
				max-width 700px
				margin 0 auto

.mk-home[data-darkmode]
	root(true)

.mk-home:not([data-darkmode])
	root(false)

</style>
