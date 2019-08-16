<template>
<div class="pwbzawku">
	<x-post-form class="form" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }" v-if="$store.state.settings.showPostFormOnTopOfTl"/>
	<div class="main">
		<component :is="src == 'list' ? 'mk-user-list-timeline' : 'x-core'" ref="tl" v-bind="options">
			<header class="zahtxcqi">
				<div :data-active="src == 'home'" @click="src = 'home'"><fa icon="home"/> {{ $t('home') }}</div>
				<div :data-active="src == 'local'" @click="src = 'local'" v-if="enableLocalTimeline"><fa :icon="['far', 'comments']"/> {{ $t('local') }}</div>
				<div :data-active="src == 'hybrid'" @click="src = 'hybrid'" v-if="enableLocalTimeline"><fa icon="share-alt"/> {{ $t('hybrid') }}</div>
				<div :data-active="src == 'global'" @click="src = 'global'" v-if="enableGlobalTimeline"><fa icon="globe"/> {{ $t('global') }}</div>
				<div :data-active="src == 'tag'" @click="src = 'tag'" v-if="tagTl"><fa icon="hashtag"/> {{ tagTl.title }}</div>
				<div :data-active="src == 'list'" @click="src = 'list'" v-if="list"><fa icon="list"/> {{ list.name }}</div>
				<div class="buttons">
					<button :data-active="src == 'mentions'" @click="src = 'mentions'" :title="$t('mentions')"><fa icon="at"/><i class="indicator" v-if="$store.state.i.hasUnreadMentions"><fa icon="circle"/></i></button>
					<button :data-active="src == 'messages'" @click="src = 'messages'" :title="$t('messages')"><fa :icon="['far', 'envelope']"/><i class="indicator" v-if="$store.state.i.hasUnreadSpecifiedNotes"><fa icon="circle"/></i></button>
					<button @click="chooseTag" :title="$t('hashtag')" ref="tagButton"><fa icon="hashtag"/></button>
					<button @click="chooseList" :title="$t('list')" ref="listButton"><fa icon="list"/></button>
				</div>
			</header>
		</component>
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
		XCore,
		XPostForm: () => import('../components/post-form.vue').then(m => m.default)
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

	computed: {
		options(): any {
			return {
				...(this.src == 'list' ? { list: this.list } : { src: this.src }),
				...(this.src == 'tag' ? { tagTl: this.tagTl } : {}),
				key: this.src == 'list' ? this.list.id : this.src
			}
		}
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
		}
	},

	mounted() {
		document.title = this.$root.instanceName;

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
					}).then(async ({ canceled, result: name }) => {
						if (canceled) return;
						const list = await this.$root.api('users/lists/create', {
							name
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
				text: list.name,
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
.pwbzawku
	> .form
		margin-bottom 16px

		&.round
			border-radius 6px

		&.shadow
			box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)

	header.zahtxcqi
		display flex
		flex-wrap wrap
		padding 0 8px
		z-index 10
		background var(--faceHeader)
		box-shadow 0 var(--lineWidth) var(--desktopTimelineHeaderShadow)

		> *
			flex-shrink 0

		> .buttons
			margin-left auto

			> button
				padding 0 8px
				font-size 0.9em
				line-height 42px
				color var(--faceTextButton)

				> .indicator
					position absolute
					top -4px
					right 4px
					font-size 10px
					color var(--notificationIndicator)
					animation blink 1s infinite

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

		> div:not(.buttons)
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
