<template>
<mk-ui>
	<span slot="header" @click="showNav = true">
		<span>
			<span v-if="src == 'home'">%fa:home%%i18n:@home%</span>
			<span v-if="src == 'local'">%fa:R comments%%i18n:@local%</span>
			<span v-if="src == 'hybrid'">%fa:share-alt%%i18n:@hybrid%</span>
			<span v-if="src == 'global'">%fa:globe%%i18n:@global%</span>
			<span v-if="src == 'mentions'">%fa:at%%i18n:@mentions%</span>
			<span v-if="src == 'messages'">%fa:envelope R%%i18n:@messages%</span>
			<span v-if="src == 'list'">%fa:list%{{ list.title }}</span>
			<span v-if="src == 'tag'">%fa:hashtag%{{ tagTl.title }}</span>
		</span>
		<span style="margin-left:8px">
			<template v-if="!showNav">%fa:angle-down%</template>
			<template v-else>%fa:angle-up%</template>
		</span>
	</span>

	<template slot="func">
		<button @click="fn">%fa:pencil-alt%</button>
	</template>

	<main :data-darkmode="$store.state.device.darkmode">
		<div class="nav" v-if="showNav">
			<div class="bg" @click="showNav = false"></div>
			<div class="pointer"></div>
			<div class="body">
				<div>
					<span :data-active="src == 'home'" @click="src = 'home'">%fa:home% %i18n:@home%</span>
					<span :data-active="src == 'local'" @click="src = 'local'" v-if="enableLocalTimeline">%fa:R comments% %i18n:@local%</span>
					<span :data-active="src == 'hybrid'" @click="src = 'hybrid'" v-if="enableLocalTimeline">%fa:share-alt% %i18n:@hybrid%</span>
					<span :data-active="src == 'global'" @click="src = 'global'">%fa:globe% %i18n:@global%</span>
					<div class="hr"></div>
					<span :data-active="src == 'mentions'" @click="src = 'mentions'">%fa:at% %i18n:@mentions%</span>
					<span :data-active="src == 'messages'" @click="src = 'messages'">%fa:envelope R% %i18n:@messages%</span>
					<template v-if="lists">
						<div class="hr"></div>
						<span v-for="l in lists" :data-active="src == 'list' && list == l" @click="src = 'list'; list = l" :key="l.id">%fa:list% {{ l.title }}</span>
					</template>
					<div class="hr" v-if="$store.state.settings.tagTimelines && $store.state.settings.tagTimelines.length > 0"></div>
					<span v-for="tl in $store.state.settings.tagTimelines" :data-active="src == 'tag' && tagTl == tl" @click="src = 'tag'; tagTl = tl" :key="tl.id">%fa:hashtag% {{ tl.title }}</span>
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
import Progress from '../../../common/scripts/loading';
import XTl from './home.timeline.vue';

export default Vue.extend({
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
			enableLocalTimeline: false
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
				(this as any).api('users/lists/list').then(lists => {
					this.lists = lists;
				});
			}
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
		document.title = (this as any).os.instanceName;

		Progress.start();

		(this.$refs.tl as any).$once('loaded', () => {
			Progress.done();
		});
	},

	methods: {
		fn() {
			(this as any).apis.post();
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
@import '~const.styl'

root(isDark)
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
				border-bottom solid $size isDark ? #272f3a : #fff

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
			background isDark ? #272f3a : #fff
			border-radius 8px
			box-shadow 0 0 16px rgba(#000, 0.1)

			> div
				padding 8px 0

				> .hr
					margin 8px 0
					border-top solid 1px isDark ? rgba(#000, 0.3) : rgba(#000, 0.1)

				> *:not(.hr)
					display block
					padding 8px 16px
					color isDark ? #cdd0d8 : #666

					&[data-active]
						color $theme-color-foreground
						background $theme-color

					&:not([data-active]):hover
						background isDark ? #353e4a : #eee

	> .tl
		max-width 680px
		margin 0 auto
		padding 8px

		@media (min-width 500px)
			padding 16px

		@media (min-width 600px)
			padding 32px

main[data-darkmode]
	root(true)

main:not([data-darkmode])
	root(false)

</style>
