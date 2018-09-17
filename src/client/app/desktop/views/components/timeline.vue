<template>
<div class="mk-timeline">
	<header>
		<span :data-active="src == 'home'" @click="src = 'home'">%fa:home% %i18n:@home%</span>
		<span :data-active="src == 'local'" @click="src = 'local'" v-if="enableLocalTimeline">%fa:R comments% %i18n:@local%</span>
		<span :data-active="src == 'hybrid'" @click="src = 'hybrid'" v-if="enableLocalTimeline">%fa:share-alt% %i18n:@hybrid%</span>
		<span :data-active="src == 'global'" @click="src = 'global'">%fa:globe% %i18n:@global%</span>
		<span :data-active="src == 'tag'" @click="src = 'tag'" v-if="tagTl">%fa:hashtag% {{ tagTl.title }}</span>
		<span :data-active="src == 'list'" @click="src = 'list'" v-if="list">%fa:list% {{ list.title }}</span>
		<div class="buttons">
			<button :data-active="src == 'mentions'" @click="src = 'mentions'" title="%i18n:@mentions%">%fa:at%</button>
			<button :data-active="src == 'messages'" @click="src = 'messages'" title="%i18n:@messages%">%fa:envelope R%</button>
			<button @click="chooseTag" title="%i18n:@hashtag%" ref="tagButton">%fa:hashtag%</button>
			<button @click="chooseList" title="%i18n:@list%" ref="listButton">%fa:list%</button>
		</div>
	</header>
	<x-core v-if="src == 'home'" ref="tl" key="home" src="home"/>
	<x-core v-if="src == 'local'" ref="tl" key="local" src="local"/>
	<x-core v-if="src == 'hybrid'" ref="tl" key="hybrid" src="hybrid"/>
	<x-core v-if="src == 'global'" ref="tl" key="global" src="global"/>
	<x-core v-if="src == 'mentions'" ref="tl" key="mentions" src="mentions"/>
	<x-core v-if="src == 'messages'" ref="tl" key="messages" src="messages"/>
	<x-core v-if="src == 'tag'" ref="tl" key="tag" src="tag" :tag-tl="tagTl"/>
	<mk-user-list-timeline v-if="src == 'list'" ref="tl" :key="list.id" :list="list"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XCore from './timeline.core.vue';
import Menu from '../../../common/views/components/menu.vue';
import MkSettingsWindow from './settings-window.vue';

export default Vue.extend({
	components: {
		XCore
	},

	data() {
		return {
			src: 'home',
			list: null,
			tagTl: null,
			enableLocalTimeline: false
		};
	},

	watch: {
		src() {
			this.saveSrc();
		},

		list(x) {
			this.saveSrc();
			if (x != null) this.tagTl = null;
		},

		tagTl(x) {
			this.saveSrc();
			if (x != null) this.list = null;
		}
	},

	created() {
		(this as any).os.getMeta().then(meta => {
			this.enableLocalTimeline = !meta.disableLocalTimeline;
		});

		if (this.$store.state.device.tl) {
			this.src = this.$store.state.device.tl.src;
			if (this.src == 'list') {
				this.list = this.$store.state.device.tl.arg;
			} else if (this.src == 'tag') {
				this.tagTl = this.$store.state.device.tl.arg;
			}
		} else if (this.$store.state.i.followingCount == 0) {
			this.src = 'hybrid';
		}
	},

	mounted() {
		(this.$refs.tl as any).$once('loaded', () => {
			this.$emit('loaded');
		});
	},

	methods: {
		saveSrc() {
			this.$store.commit('device/setTl', {
				src: this.src,
				arg: this.src == 'list' ? this.list : this.tagTl
			});
		},

		warp(date) {
			(this.$refs.tl as any).warp(date);
		},

		async chooseList() {
			const lists = await (this as any).api('users/lists/list');

			let menu = [{
				icon: '%fa:plus%',
				text: '%i18n:@add-list%',
				action: () => {
					(this as any).apis.input({
						title: '%i18n:@list-name%',
					}).then(async title => {
						const list = await (this as any).api('users/lists/create', {
							title
						});

						this.list = list;
						this.src = 'list';
					});
				}
			}];

			if (lists.length > 0) {
				menu.push(null);
			}

			menu = menu.concat(lists.map(list => ({
				icon: '%fa:list%',
				text: list.title,
				action: () => {
					this.list = list;
					this.src = 'list';
				}
			})));

			this.os.new(Menu, {
				source: this.$refs.listButton,
				compact: false,
				items: menu
			});
		},

		chooseTag() {
			let menu = [{
				icon: '%fa:plus%',
				text: '%i18n:@add-tag-timeline%',
				action: () => {
					(this as any).os.new(MkSettingsWindow, {
						initialPage: 'hashtags'
					});
				}
			}];

			if (this.$store.state.settings.tagTimelines.length > 0) {
				menu.push(null);
			}

			menu = menu.concat(this.$store.state.settings.tagTimelines.map(t => ({
				icon: '%fa:hashtag%',
				text: t.title,
				action: () => {
					this.tagTl = t;
					this.src = 'tag';
				}
			})));

			this.os.new(Menu, {
				source: this.$refs.tagButton,
				compact: false,
				items: menu
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	background isDark ? #282C37 : #fff
	border solid 1px rgba(#000, 0.075)
	border-radius 6px

	> header
		padding 0 8px
		z-index 10
		background isDark ? #313543 : #fff
		border-radius 6px 6px 0 0
		box-shadow 0 1px isDark ? rgba(#000, 0.15) : rgba(#000, 0.08)

		> .buttons
			position absolute
			z-index 2
			top 0
			right 0
			padding-right 8px

			> button
				padding 0 8px
				font-size 0.9em
				line-height 42px
				color isDark ? #9baec8 : #ccc

				&:hover
					color isDark ? #b2c1d5 : #aaa

				&:active
					color isDark ? #b2c1d5 : #999

				&[data-active]
					color $theme-color
					cursor default

					&:before
						content ""
						display block
						position absolute
						bottom 0
						left 0
						width 100%
						height 2px
						background $theme-color

		> span
			display inline-block
			padding 0 10px
			line-height 42px
			font-size 12px
			user-select none

			&[data-active]
				color $theme-color
				cursor default
				font-weight bold

				&:before
					content ""
					display block
					position absolute
					bottom 0
					left -8px
					width calc(100% + 16px)
					height 2px
					background $theme-color

			&:not([data-active])
				color isDark ? #9aa2a7 : #6f7477
				cursor pointer

				&:hover
					color isDark ? #d9dcde : #525a5f

.mk-timeline[data-darkmode]
	root(true)

.mk-timeline:not([data-darkmode])
	root(false)

</style>
