<template>
<component :is="customize ? 'mk-dummy' : 'mk-ui'" v-hotkey.global="keymap" v-if="$store.getters.isSignedIn || $route.name != 'index'">
	<div class="wqsofvpm" :data-customize="customize">
		<div class="customize" v-if="customize">
			<a @click="done()"><fa icon="check"/>{{ $t('done') }}</a>
			<div>
				<div class="adder">
					<p>{{ $t('add-widget') }}</p>
					<select v-model="widgetAdderSelected">
						<option value="profile">{{ $t('@.widgets.profile') }}</option>
						<option value="analog-clock">{{ $t('@.widgets.analog-clock') }}</option>
						<option value="calendar">{{ $t('@.widgets.calendar') }}</option>
						<option value="timemachine">{{ $t('@.widgets.timemachine') }}</option>
						<option value="activity">{{ $t('@.widgets.activity') }}</option>
						<option value="rss">{{ $t('@.widgets.rss') }}</option>
						<option value="trends">{{ $t('@.widgets.trends') }}</option>
						<option value="photo-stream">{{ $t('@.widgets.photo-stream') }}</option>
						<option value="slideshow">{{ $t('@.widgets.slideshow') }}</option>
						<option value="version">{{ $t('@.widgets.version') }}</option>
						<option value="broadcast">{{ $t('@.widgets.broadcast') }}</option>
						<option value="notifications">{{ $t('@.widgets.notifications') }}</option>
						<option value="users">{{ $t('@.widgets.users') }}</option>
						<option value="polls">{{ $t('@.widgets.polls') }}</option>
						<option value="post-form">{{ $t('@.widgets.post-form') }}</option>
						<option value="messaging">{{ $t('@.messaging') }}</option>
						<option value="memo">{{ $t('@.widgets.memo') }}</option>
						<option value="hashtags">{{ $t('@.widgets.hashtags') }}</option>
						<option value="posts-monitor">{{ $t('@.widgets.posts-monitor') }}</option>
						<option value="server">{{ $t('@.widgets.server') }}</option>
						<option value="nav">{{ $t('@.widgets.nav') }}</option>
						<option value="tips">{{ $t('@.widgets.tips') }}</option>
					</select>
					<button @click="addWidget">{{ $t('add') }}</button>
				</div>
				<div class="trash">
					<x-draggable v-model="trash" :options="{ group: 'x' }" @add="onTrash"></x-draggable>
					<p>{{ $t('@.trash') }}</p>
				</div>
			</div>
		</div>
		<div class="main" :class="{ side: widgets.left.length == 0 || widgets.right.length == 0 }">
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
						<component :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id" :is-customize-mode="true" platform="desktop"/>
					</div>
				</x-draggable>
				<div class="main">
					<a @click="hint">{{ $t('@.customization-tips.title') }}</a>
					<div>
						<x-timeline/>
					</div>
				</div>
			</template>
			<template v-else>
				<div v-for="place in ['left', 'right']" :class="place">
					<component v-for="widget in widgets[place]" :is="`mkw-${widget.name}`" :key="widget.id" :ref="widget.id" :widget="widget" platform="desktop"/>
				</div>
				<div class="main">
					<router-view ref="content"></router-view>
				</div>
			</template>
		</div>
	</div>
</component>
<x-welcome v-else/>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import * as XDraggable from 'vuedraggable';
import * as uuid from 'uuid';
import XWelcome from '../pages/welcome.vue';

export default Vue.extend({
	i18n: i18n('desktop/views/components/home.vue'),
	components: {
		XDraggable,
		XWelcome
	},

	data() {
		return {
			customize: window.location.search == '?customize',
			connection: null,
			widgetAdderSelected: null,
			trash: [],
			view: null
		};
	},

	computed: {
		home(): any[] {
			if (this.$store.getters.isSignedIn) {
				return this.$store.state.settings.home || [];
			} else {
				return [{
					name: 'instance',
					place: 'right'
				}, {
					name: 'broadcast',
					place: 'right',
					data: {}
				}, {
					name: 'hashtags',
					place: 'right',
					data: {}
				}];
			}
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
		},
		keymap(): any {
			return {
				't': this.focus
			};
		}
	},

	created() {
		if (this.$store.getters.isSignedIn) {
			const defaultDesktopHomeWidgets = {
				left: [
					'profile',
					'calendar',
					'activity',
					'rss',
					'hashtags',
					'photo-stream',
					'version'
				],
				right: [
					'customize',
					'broadcast',
					'notifications',
					'users',
					'polls',
					'server',
					'nav',
					'tips'
				]
			};

			//#region Construct home data
			const _defaultDesktopHomeWidgets = [];

			for (const widget of defaultDesktopHomeWidgets.left) {
				_defaultDesktopHomeWidgets.push({
					name: widget,
					id: uuid(),
					place: 'left',
					data: {}
				});
			}

			for (const widget of defaultDesktopHomeWidgets.right) {
				_defaultDesktopHomeWidgets.push({
					name: widget,
					id: uuid(),
					place: 'right',
					data: {}
				});
			}
			//#endregion

			if (this.$store.state.settings.home == null) {
				this.$root.api('i/update_home', {
					home: _defaultDesktopHomeWidgets
				}).then(() => {
					this.$store.commit('settings/setHome', _defaultDesktopHomeWidgets);
				});
			}
		}
	},

	mounted() {
		this.connection = this.$root.stream.useSharedConnection('main');
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		hint() {
			this.$root.dialog({
				title: this.$t('@.customization-tips.title'),
				text: this.$t('@.customization-tips.paragraph')
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
			for (const w of left) w.place = 'left';
			for (const w of right) w.place = 'right';
			this.$root.api('i/update_home', {
				home: this.home
			});
		},

		done() {
			location.href = '/';
		},

		focus() {
			(this.$refs.content as any).focus();
		}
	}
});
</script>

<style lang="stylus" scoped>
.wqsofvpm
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
		> .main > *:not(.main):empty
			display none

	> .customize
		position fixed
		z-index 1000
		top 0
		left 0
		width 100%
		height 48px
		color var(--text)
		background var(--desktopHeaderBg)
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
			color var(--primaryForeground)
			background var(--primary)
			transition background 0.1s ease

			&:hover
				background var(--primaryLighten10)

			&:active
				background var(--primaryDarken10)
				transition background 0s ease

			> [data-icon]
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
					border-left solid 1px var(--faceDivider)

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
		max-width 1240px

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
			width calc(100% - 280px * 2)
			order 2

		&.side
			> .main
				width calc(100% - 280px)
				max-width 680px

		> *:not(.main)
			width 280px
			padding 16px 0 16px 0

			> *:not(:last-child)
				margin-bottom 16px

		> .left
			padding-left 16px
			order 1

		> .right
			padding-right 16px
			order 3

		&.side
			@media (max-width 1000px)
				> *:not(.main)
					display none

				> .main
					width 100%
					max-width 700px
					margin 0 auto

		&:not(.side)
			@media (max-width 1200px)
				> *:not(.main)
					display none

				> .main
					width 100%
					max-width 700px
					margin 0 auto

</style>
