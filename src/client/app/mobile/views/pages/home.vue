<template>
<mk-ui>
	<template #header>
		<span @click="showNav = true">
			<span :class="$style.title">
				<span v-if="src == 'home'"><fa icon="home"/>{{ $t('home') }}</span>
				<span v-if="src == 'local'"><fa :icon="['far', 'comments']"/>{{ $t('local') }}</span>
				<span v-if="src == 'hybrid'"><fa icon="share-alt"/>{{ $t('hybrid') }}</span>
				<span v-if="src == 'global'"><fa icon="globe"/>{{ $t('global') }}</span>
				<span v-if="src == 'mentions'"><fa icon="at"/>{{ $t('mentions') }}</span>
				<span v-if="src == 'messages'"><fa :icon="['far', 'envelope']"/>{{ $t('messages') }}</span>
				<span v-if="src == 'list'"><fa icon="list"/>{{ list.title }}</span>
				<span v-if="src == 'tag'"><fa icon="hashtag"/>{{ tagTl.title }}</span>
			</span>
			<span style="margin-left:8px">
				<template v-if="!showNav"><fa icon="angle-down"/></template>
				<template v-else><fa icon="angle-up"/></template>
			</span>
			<i :class="$style.badge" v-if="$store.state.i.hasUnreadMentions || $store.state.i.hasUnreadSpecifiedNotes"><fa icon="circle"/></i>
		</span>
	</template>

	<template #func>
		<button @click="fn"><fa icon="pencil-alt"/></button>
	</template>

	<main>
		<div class="nav" v-if="showNav">
			<div class="bg" @click="showNav = false"></div>
			<div class="pointer"></div>
			<div class="body">
				<div>
					<span :data-active="src == 'home'" @click="src = 'home'"><fa icon="home"/> {{ $t('home') }}</span>
					<span :data-active="src == 'local'" @click="src = 'local'" v-if="enableLocalTimeline"><fa :icon="['far', 'comments']"/> {{ $t('local') }}</span>
					<span :data-active="src == 'hybrid'" @click="src = 'hybrid'" v-if="enableLocalTimeline"><fa icon="share-alt"/> {{ $t('hybrid') }}</span>
					<span :data-active="src == 'global'" @click="src = 'global'" v-if="enableGlobalTimeline"><fa icon="globe"/> {{ $t('global') }}</span>
					<div class="hr"></div>
					<span :data-active="src == 'mentions'" @click="src = 'mentions'"><fa icon="at"/> {{ $t('mentions') }}<i class="badge" v-if="$store.state.i.hasUnreadMentions"><fa icon="circle"/></i></span>
					<span :data-active="src == 'messages'" @click="src = 'messages'"><fa :icon="['far', 'envelope']"/> {{ $t('messages') }}<i class="badge" v-if="$store.state.i.hasUnreadSpecifiedNotes"><fa icon="circle"/></i></span>
					<template v-if="lists">
						<div class="hr" v-if="lists.length > 0"></div>
						<span v-for="l in lists" :data-active="src == 'list' && list == l" @click="src = 'list'; list = l" :key="l.id"><fa icon="list"/> {{ l.title }}</span>
					</template>
					<div class="hr" v-if="$store.state.settings.tagTimelines && $store.state.settings.tagTimelines.length > 0"></div>
					<span v-for="tl in $store.state.settings.tagTimelines" :data-active="src == 'tag' && tagTl == tl" @click="src = 'tag'; tagTl = tl" :key="tl.id"><fa icon="hashtag"/> {{ tl.title }}</span>
				</div>
			</div>
		</div>

		<div class="tl">
			<x-tl v-if="src == 'home'" ref="tl" key="home" src="home"/>
			<x-tl v-if="src == 'local'" ref="tl" key="local" src="local"/>
			<x-tl v-if="src == 'hybrid'" ref="tl" key="hybrid" src="hybrid"/>
			<x-tl v-if="src == 'global'" ref="tl" key="global" src="global"/>
			<x-tl v-if="src == 'mentions'" ref="tl" key="mentions" src="mentions"/>
			<x-tl v-if="src == 'messages'" ref="tl" key="messages" src="messages"/>
			<x-tl v-if="src == 'tag'" ref="tl" key="tag" src="tag" :tag-tl="tagTl"/>
			<mk-user-list-timeline v-if="src == 'list'" ref="tl" :key="list.id" :list="list"/>
		</div>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';
import XTl from './home.timeline.vue';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/home.vue'),

	components: {
		XTl
	},

	data() {
		return {
			src: 'home',
			list: null,
			lists: null,
			tagTl: null,
			showNav: false,
			enableLocalTimeline: false,
			enableGlobalTimeline: false,
		};
	},

	watch: {
		src() {
			this.showNav = false;
			this.saveSrc();
		},

		list(x) {
			this.showNav = false;
			this.saveSrc();
			if (x != null) this.tagTl = null;
		},

		tagTl(x) {
			this.showNav = false;
			this.saveSrc();
			if (x != null) this.list = null;
		},

		showNav(v) {
			if (v && this.lists === null) {
				this.$root.api('users/lists/list').then(lists => {
					this.lists = lists;
				});
			}
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
		document.title = this.$root.instanceName;

		Progress.start();

		(this.$refs.tl as any).$once('loaded', () => {
			Progress.done();
		});
	},

	methods: {
		fn() {
			this.$post();
		},

		saveSrc() {
			this.$store.commit('device/setTl', {
				src: this.src,
				arg: this.src == 'list' ? this.list : this.tagTl
			});
		},

		warp() {

		}
	}
});
</script>

<style lang="stylus" scoped>
main
	> .nav
		> .pointer
			position fixed
			z-index 10002
			top 56px
			left 0
			right 0

			$size = 16px

			&:after
				content ""
				display block
				position absolute
				top -($size * 2)
				left s('calc(50% - %s)', $size)
				border-top solid $size transparent
				border-left solid $size transparent
				border-right solid $size transparent
				border-bottom solid $size var(--popupBg)

		> .bg
			position fixed
			z-index 10000
			top 0
			left 0
			width 100%
			height 100%
			background rgba(#000, 0.5)

		> .body
			position fixed
			z-index 10001
			top 56px
			left 0
			right 0
			width 300px
			max-height calc(100% - 70px)
			margin 0 auto
			overflow auto
			-webkit-overflow-scrolling touch
			background var(--popupBg)
			border-radius 8px
			box-shadow 0 0 16px rgba(#000, 0.1)

			> div
				padding 8px 0

				> .hr
					margin 8px 0
					border-top solid 1px var(--faceDivider)

				> *:not(.hr)
					display block
					padding 8px 16px
					color var(--text)

					&[data-active]
						color var(--primaryForeground)
						background var(--primary)

					&:not([data-active]):hover
						background var(--mobileHomeTlItemHover)

					> .badge
						margin-left 6px
						font-size 10px
						color var(--notificationIndicator)

</style>

<style lang="stylus" module>
.title
	[data-icon]
		margin-right 4px

.badge
	margin-left 6px
	font-size 10px
	color var(--notificationIndicator)
	vertical-align middle

</style>
