<template>
<div class="mk-timeline">
	<mk-post-form class="form" v-if="$store.state.settings.showPostFormOnTopOfTl"/>
	<div class="main">
		<header>
			<span :data-active="src == 'home'" @click="src = 'home'"><fa icon="home"/> {{ $t('home') }}</span>
			<span :data-active="src == 'local'" @click="src = 'local'" v-if="enableLocalTimeline"><fa :icon="['far', 'comments']"/> {{ $t('local') }}</span>
			<span :data-active="src == 'hybrid'" @click="src = 'hybrid'" v-if="enableLocalTimeline"><fa icon="share-alt"/> {{ $t('hybrid') }}</span>
			<span :data-active="src == 'global'" @click="src = 'global'" v-if="enableGlobalTimeline"><fa icon="globe"/> {{ $t('global') }}</span>
			<span :data-active="src == 'tag'" @click="src = 'tag'" v-if="tagTl"><fa icon="hashtag"/> {{ tagTl.title }}</span>
			<span :data-active="src == 'list'" @click="src = 'list'" v-if="list"><fa icon="list"/> {{ list.title }}</span>
			<div class="buttons">
				<button :data-active="src == 'mentions'" @click="src = 'mentions'" :title="$t('mentions')"><fa icon="at"/><i class="badge" v-if="$store.state.i.hasUnreadMentions"><fa icon="circle"/></i></button>
				<button :data-active="src == 'messages'" @click="src = 'messages'" :title="$t('messages')"><fa :icon="['far', 'envelope']"/><i class="badge" v-if="$store.state.i.hasUnreadSpecifiedNotes"><fa icon="circle"/></i></button>
				<button @click="chooseTag" :title="$t('hashtag')" ref="tagButton"><fa icon="hashtag"/></button>
				<button @click="chooseList" :title="$t('list')" ref="listButton"><fa icon="list"/></button>
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
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XCore from './timeline.core.vue';
import Menu from '../../../common/views/components/menu.vue';
import MkSettingsWindow from '../components/settings-window.vue';

export default Vue.extend({
	i18n: i18n('desktop/views/components/timeline.vue'),
	components: {
		XCore
	},

	data() {
		return {
			src: 'home',
			list: null,
			tagTl: null,
			enableLocalTimeline: false,
			enableGlobalTimeline: false,
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
		this.$root.getMeta().then((meta: Record<string, any>) => {
			if (!(
				this.enableGlobalTimeline = !meta.disableGlobalTimeline || this.$store.state.i.isModerator || this.$store.state.i.isAdmin
			) && this.src === 'global') this.src = 'local';
			if (!(
				this.enableLocalTimeline = !meta.disableLocalTimeline || this.$store.state.i.isModerator || this.$store.state.i.isAdmin
			) && ['local', 'hybrid'].includes(this.src)) this.src = 'home';
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

		focus() {
			(this.$refs.tl as any).focus();
		},

		warp(date) {
			(this.$refs.tl as any).warp(date);
		},

		async chooseList() {
			const lists = await this.$root.api('users/lists/list');

			let menu = [{
				icon: 'plus',
				text: this.$t('add-list'),
				action: () => {
					this.$root.dialog({
						title: this.$t('list-name'),
						input: true
					}).then(async ({ canceled, result: title }) => {
						if (canceled) return;
						const list = await this.$root.api('users/lists/create', {
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
				icon: 'list',
				text: list.title,
				action: () => {
					this.list = list;
					this.src = 'list';
				}
			})));

			this.$root.new(Menu, {
				source: this.$refs.listButton,
				items: menu
			});
		},

		chooseTag() {
			let menu = [{
				icon: 'plus',
				text: this.$t('add-tag-timeline'),
				action: () => {
					this.$root.new(MkSettingsWindow, {
						initialPage: 'hashtags'
					});
				}
			}];

			if (this.$store.state.settings.tagTimelines.length > 0) {
				menu.push(null);
			}

			menu = menu.concat(this.$store.state.settings.tagTimelines.map(t => ({
				icon: 'hashtag',
				text: t.title,
				action: () => {
					this.tagTl = t;
					this.src = 'tag';
				}
			})));

			this.$root.new(Menu, {
				source: this.$refs.tagButton,
				items: menu
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-timeline
	> .form
		margin-bottom 16px
		box-shadow var(--shadow)
		border-radius var(--round)

	> .main
		background var(--face)
		box-shadow var(--shadow)
		border-radius var(--round)
		overflow hidden

		> header
			padding 0 8px
			z-index 10
			background var(--faceHeader)
			box-shadow 0 var(--lineWidth) var(--desktopTimelineHeaderShadow)

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
					color var(--faceTextButton)

					> .badge
						position absolute
						top -4px
						right 4px
						font-size 10px
						color var(--notificationIndicator)

					&:hover
						color var(--faceTextButtonHover)

					&[data-active]
						color var(--primary)
						cursor default

						&:before
							content ""
							display block
							position absolute
							bottom 0
							left 0
							width 100%
							height 2px
							background var(--primary)

			> span
				display inline-block
				padding 0 10px
				line-height 42px
				font-size 12px
				user-select none

				&[data-active]
					color var(--primary)
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
						background var(--primary)

				&:not([data-active])
					color var(--desktopTimelineSrc)
					cursor pointer

					&:hover
						color var(--desktopTimelineSrcHover)

</style>
