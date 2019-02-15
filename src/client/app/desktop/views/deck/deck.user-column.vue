<template>
<x-column>
	<span slot="header">
		<fa icon="user"/><mk-user-name :user="user" v-if="user"/>
	</span>

	<div class="zubukjlciycdsyynicqrnlsmdwmymzqu" v-if="user">
		<div class="is-remote" v-if="user.host != null">
			<details>
				<summary><fa icon="exclamation-triangle"/> {{ $t('@.is-remote-user') }}</summary>
				<a :href="user.url || user.uri" target="_blank">{{ $t('@.view-on-remote') }}</a>
			</details>
		</div>
		<header :style="bannerStyle">
			<div>
				<button class="menu" @click="menu" ref="menu"><fa icon="ellipsis-h"/></button>
				<mk-follow-button v-if="$store.getters.isSignedIn && user.id != $store.state.i.id" :user="user" class="follow" mini/>
				<mk-avatar class="avatar" :user="user" :disable-preview="true"/>
				<span class="name">
					<mk-user-name :user="user"/>
				</span>
				<span class="acct">@{{ user | acct }} <fa v-if="user.isLocked == true" class="locked" icon="lock" fixed-width/></span>
				<span class="followed" v-if="user.isFollowed">{{ $t('follows-you') }}</span>
			</div>
		</header>
		<div class="info">
			<div class="description">
				<mfm v-if="user.description" :text="user.description" :author="user" :i="$store.state.i" :custom-emojis="user.emojis"/>
			</div>
			<div class="fields" v-if="user.fields">
				<dl class="field" v-for="(field, i) in user.fields" :key="i">
					<dt class="name">
						<mfm :text="field.name" :should-break="false" :plain-text="true" :custom-emojis="user.emojis"/>
					</dt>
					<dd class="value">
						<mfm :text="field.value" :author="user" :i="$store.state.i" :custom-emojis="user.emojis"/>
					</dd>
				</dl>
			</div>
			<div class="counts">
				<div>
					<b>{{ user.notesCount | number }}</b>
					<span>{{ $t('posts') }}</span>
				</div>
				<div>
					<router-link :to="user | userPage('following')">
						<b>{{ user.followingCount | number }}</b>
						<span>{{ $t('following') }}</span>
					</router-link>
				</div>
				<div>
					<router-link :to="user | userPage('followers')">
						<b>{{ user.followersCount | number }}</b>
						<span>{{ $t('followers') }}</span>
					</router-link>
				</div>
			</div>
		</div>
		<div class="pinned" v-if="user.pinnedNotes && user.pinnedNotes.length > 0">
			<p class="caption" @click="toggleShowPinned"><fa icon="thumbtack"/> {{ $t('pinned-notes') }}</p>
			<span class="angle" v-if="showPinned"><fa icon="angle-up"/></span>
			<span class="angle" v-else><fa icon="angle-down"/></span>
			<div class="notes" v-show="showPinned">
				<x-note v-for="n in user.pinnedNotes" :key="n.id" :note="n" :mini="true"/>
			</div>
		</div>
		<div class="images" v-if="images.length > 0">
			<p class="caption" @click="toggleShowImages"><fa :icon="['far', 'images']"/> {{ $t('images') }}</p>
			<span class="angle" v-if="showImages"><fa icon="angle-up"/></span>
			<span class="angle" v-else><fa icon="angle-down"/></span>
			<div v-show="showImages">
				<router-link v-for="image in images"
					:style="`background-image: url(${image.thumbnailUrl})`"
					:key="`${image.id}:${image._note.id}`"
					:to="image._note | notePage"
					:title="`${image.name}\n${(new Date(image.createdAt)).toLocaleString()}`"
				></router-link>
			</div>
		</div>
		<div class="activity">
			<p class="caption" @click="toggleShowActivity"><fa :icon="['far', 'chart-bar']"/> {{ $t('activity') }}</p>
			<span class="angle" v-if="showActivity"><fa icon="angle-up"/></span>
			<span class="angle" v-else><fa icon="angle-down"/></span>
			<div v-show="showActivity">
				<div ref="chart"></div>
			</div>
		</div>
		<div class="tl">
			<p class="caption"><fa :icon="['far', 'comment-alt']"/> {{ $t('timeline') }}</p>
			<div>
				<x-notes ref="timeline" :more="existMore ? fetchMoreNotes : null"/>
			</div>
		</div>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import parseAcct from '../../../../../misc/acct/parse';
import XColumn from './deck.column.vue';
import XNotes from './deck.notes.vue';
import XNote from '../components/note.vue';
import XUserMenu from '../../../common/views/components/user-menu.vue';
import { concat } from '../../../../../prelude/array';
import ApexCharts from 'apexcharts';

const fetchLimit = 10;

export default Vue.extend({
	i18n: i18n('deck/deck.user-column.vue'),
	components: {
		XColumn,
		XNotes,
		XNote
	},

	data() {
		return {
			user: null,
			fetching: true,
			existMore: false,
			moreFetching: false,
			withFiles: false,
			images: [],
			showPinned: true,
			showImages: true,
			showActivity: true
		};
	},

	computed: {
		bannerStyle(): any {
			if (this.user == null) return {};
			if (this.user.bannerUrl == null) return {};
			return {
				backgroundColor: this.user.bannerColor && this.user.bannerColor.length == 3 ? `rgb(${ this.user.bannerColor.join(',') })` : null,
				backgroundImage: `url(${ this.user.bannerUrl })`
			};
		},
	},

	watch: {
		$route: 'fetch'
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.fetching = true;
			this.$root.api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;

				this.$nextTick(() => {
					(this.$refs.timeline as any).init(() => this.initTl());
				});

				const image = [
					'image/jpeg',
					'image/png',
					'image/gif'
				];

				this.$root.api('users/notes', {
					userId: this.user.id,
					fileType: image,
					excludeNsfw: !this.$store.state.device.alwaysShowNsfw,
					limit: 9,
					untilDate: new Date().getTime() + 1000 * 86400 * 365
				}).then(notes => {
					for (const note of notes) {
						for (const file of note.files) {
							file._note = note;
						}
					}
					const files = concat(notes.map((n: any): any[] => n.files));
					this.images = files.filter(f => image.includes(f.type)).slice(0, 9);
				});

				this.$root.api('charts/user/notes', {
					userId: this.user.id,
					span: 'day',
					limit: 21
				}).then(stats => {
					const normal = [];
					const reply = [];
					const renote = [];

					const now = new Date();
					const y = now.getFullYear();
					const m = now.getMonth();
					const d = now.getDate();

					for (let i = 0; i < 21; i++) {
						const x = new Date(y, m, d - i);
						normal.push([
							x,
							stats.diffs.normal[i]
						]);
						reply.push([
							x,
							stats.diffs.reply[i]
						]);
						renote.push([
							x,
							stats.diffs.renote[i]
						]);
					}

					const chart = new ApexCharts(this.$refs.chart, {
						chart: {
							type: 'bar',
							stacked: true,
							height: 100,
							sparkline: {
								enabled: true
							},
						},
						plotOptions: {
							bar: {
								columnWidth: '90%'
							}
						},
						grid: {
							clipMarkers: false,
							padding: {
								top: 16,
								right: 16,
								bottom: 16,
								left: 16
							}
						},
						tooltip: {
							shared: true,
							intersect: false
						},
						series: [{
							name: 'Normal',
							data: normal
						}, {
							name: 'Reply',
							data: reply
						}, {
							name: 'Renote',
							data: renote
						}],
						xaxis: {
							type: 'datetime',
							crosshairs: {
								width: 1,
								opacity: 1
							}
						}
					});

					chart.render();
				});
			});
		},

		initTl() {
			return new Promise((res, rej) => {
				this.$root.api('users/notes', {
					userId: this.user.id,
					limit: fetchLimit + 1,
					untilDate: new Date().getTime() + 1000 * 86400 * 365,
					withFiles: this.withFiles,
					includeMyRenotes: this.$store.state.settings.showMyRenotes,
					includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
					includeLocalRenotes: this.$store.state.settings.showLocalRenotes
				}).then(notes => {
					if (notes.length == fetchLimit + 1) {
						notes.pop();
						this.existMore = true;
					}
					res(notes);
				}, rej);
			});
		},

		fetchMoreNotes() {
			this.moreFetching = true;

			const promise = this.$root.api('users/notes', {
				userId: this.user.id,
				limit: fetchLimit + 1,
				untilDate: new Date((this.$refs.timeline as any).tail().createdAt).getTime(),
				withFiles: this.withFiles,
				includeMyRenotes: this.$store.state.settings.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.settings.showLocalRenotes
			});

			promise.then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				for (const n of notes) (this.$refs.timeline as any).append(n);
				this.moreFetching = false;
			});

			return promise;
		},

		menu() {
			this.$root.new(XUserMenu, {
				source: this.$refs.menu,
				user: this.user
			});
		},

		toggleShowPinned() {
			this.showPinned = !this.showPinned;
		},

		toggleShowImages() {
			this.showImages = !this.showImages;
		},

		toggleShowActivity() {
			this.showActivity = !this.showActivity;
		}
	}
});
</script>

<style lang="stylus" scoped>
.zubukjlciycdsyynicqrnlsmdwmymzqu
	background var(--deckColumnBg)

	> .is-remote
		padding 8px 16px
		font-size 12px

		&.is-remote
			color var(--remoteInfoFg)
			background var(--remoteInfoBg)

		> a
			font-weight bold

	> header
		overflow hidden
		background-size cover
		background-position center

		> div
			padding 32px
			background rgba(#000, 0.5)
			color #fff
			text-align center

			> .menu
				position absolute
				top 8px
				left 8px
				padding 8px
				font-size 16px
				text-shadow 0 0 8px #000

			> .follow
				position absolute
				top 16px
				right 16px

			> .avatar
				display block
				width 64px
				height 64px
				margin 0 auto

			> .name
				display block
				margin-top 8px
				font-weight bold
				text-shadow 0 0 8px #000

			> .acct
				display block
				font-size 14px
				opacity 0.7
				text-shadow 0 0 8px #000

				> .locked
					opacity 0.8

			> .followed
				display inline-block
				font-size 12px
				background rgba(0, 0, 0, 0.5)
				opacity 0.7
				margin-top: 2px
				padding 4px
				border-radius 4px

	> .info
		padding 16px
		font-size 12px
		color var(--text)
		text-align center
		background var(--face)

		&:before
			content ""
			display blcok
			position absolute
			top -32px
			left 0
			right 0
			width 0px
			margin 0 auto
			border-top solid 16px transparent
			border-left solid 16px transparent
			border-right solid 16px transparent
			border-bottom solid 16px var(--face)

		> .fields
			margin-top 8px

			> .field
				display flex
				padding 0
				margin 0
				align-items center

				> .name
					padding 4px
					margin 4px
					width 30%
					overflow hidden
					white-space nowrap
					text-overflow ellipsis
					font-weight bold

				> .value
					padding 4px
					margin 4px
					width 70%
					overflow hidden
					white-space nowrap
					text-overflow ellipsis

		> .counts
			display grid
			grid-template-columns 2fr 2fr 2fr
			margin-top 8px
			border-top solid var(--lineWidth) var(--faceDivider)

			> div
				padding 8px 8px 0 8px
				text-align center

				> a
					color var(--text)

				>>> b
					display block
					font-size 110%

				>>> span
					display block
					font-size 80%
					opacity 0.7

	> *
		> p.caption
			margin 0
			padding 8px 16px
			font-size 12px
			color var(--text)

			& + .angle
				position absolute
				top 0
				right 8px
				padding 6px
				font-size 14px
				color var(--text)

	> .pinned
		> .notes
			background var(--face)

	> .images
		> div
			display grid
			grid-template-columns 1fr 1fr 1fr
			gap 8px
			padding 16px
			background var(--face)

			> *
				height 70px
				background-position center center
				background-size cover
				background-clip content-box
				border-radius 4px

	> .activity
		> div
			background var(--face)

	> .tl
		> div
			background var(--face)

</style>
