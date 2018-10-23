<template>
<x-column>
	<span slot="header">
		%fa:user%<span>{{ title }}</span>
	</span>

	<div class="zubukjlciycdsyynicqrnlsmdwmymzqu" v-if="user">
		<div class="is-remote" v-if="user.host != null">
			<details>
				<summary>%fa:exclamation-triangle% %i18n:common.is-remote-user%</summary>
				<a :href="user.url || user.uri" target="_blank">%i18n:common.view-on-remote%</a>
			</details>
		</div>
		<header :style="bannerStyle">
			<div>
				<button class="menu" @click="menu" ref="menu">%fa:ellipsis-h%</button>
				<mk-follow-button v-if="$store.getters.isSignedIn && user.id != $store.state.i.id" :user="user" class="follow"/>
				<mk-avatar class="avatar" :user="user" :disable-preview="true"/>
				<span class="name">{{ user | userName }}</span>
				<span class="acct">@{{ user | acct }}</span>
			</div>
		</header>
		<div class="info">
			<div class="description">
				<misskey-flavored-markdown v-if="user.description" :text="user.description" :i="$store.state.i"/>
			</div>
		</div>
		<div class="pinned" v-if="user.pinnedNotes && user.pinnedNotes.length > 0">
			<p>%fa:thumbtack% %i18n:@pinned-notes%</p>
			<div class="notes">
				<x-note v-for="n in user.pinnedNotes" :key="n.id" :note="n" :mini="true"/>
			</div>
		</div>
		<div class="images" v-if="images.length > 0">
			<router-link v-for="image in images"
				:style="`background-image: url(${image.thumbnailUrl})`"
				:key="`${image.id}:${image._note.id}`"
				:to="image._note | notePage"
				:title="`${image.name}\n${(new Date(image.createdAt)).toLocaleString()}`"
			></router-link>
		</div>
		<div class="activity">
			<div ref="chart"></div>
		</div>
		<div class="tl">
			<x-notes ref="timeline" :more="existMore ? fetchMoreNotes : null"/>
		</div>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import parseAcct from '../../../../../../misc/acct/parse';
import XColumn from './deck.column.vue';
import XNotes from './deck.notes.vue';
import XNote from '../../components/note.vue';
import Menu from '../../../../common/views/components/menu.vue';
import MkUserListsWindow from '../../components/user-lists-window.vue';
import Ok from '../../../../common/views/components/ok.vue';
import { concat } from '../../../../../../prelude/array';
import * as ApexCharts from 'apexcharts';

const fetchLimit = 10;

export default Vue.extend({
	components: {
		XColumn,
		XNotes,
		XNote
	},

	props: {
		acct: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			user: null,
			fetching: true,
			existMore: false,
			moreFetching: false,
			withFiles: false,
			images: []
		};
	},

	computed: {
		title(): string {
			return this.user ? Vue.filter('userName')(this.user) : '';
		},

		bannerStyle(): any {
			if (this.user == null) return {};
			if (this.user.bannerUrl == null) return {};
			return {
				backgroundColor: this.user.bannerColor && this.user.bannerColor.length == 3 ? `rgb(${ this.user.bannerColor.join(',') })` : null,
				backgroundImage: `url(${ this.user.bannerUrl })`
			};
		},
	},

	created() {
		(this as any).api('users/show', parseAcct(this.acct)).then(user => {
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

			(this as any).api('users/notes', {
				userId: this.user.id,
				fileType: image,
				limit: 9
			}).then(notes => {
				notes.forEach(note => {
					note.files.forEach(file => {
						file._note = note;
					});
				});
				const files = concat(notes.map((n: any): any[] => n.files));
				this.images = files.filter(f => image.includes(f.type)).slice(0, 9);
			});

			(this as any).api('charts/user/notes', {
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
							columnWidth: '90%',
							endingShape: 'rounded'
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

	methods: {
		initTl() {
			return new Promise((res, rej) => {
				(this as any).api('users/notes', {
					userId: this.user.id,
					limit: fetchLimit + 1,
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

			const promise = (this as any).api('users/notes', {
				userId: this.user.id,
				limit: fetchLimit + 1,
				untilId: (this.$refs.timeline as any).tail().id,
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
				notes.forEach(n => (this.$refs.timeline as any).append(n));
				this.moreFetching = false;
			});

			return promise;
		},

		menu() {
			let menu = [{
				icon: '%fa:list%',
				text: '%i18n:@push-to-a-list%',
				action: () => {
					const w = (this as any).os.new(MkUserListsWindow);
					w.$once('choosen', async list => {
						w.close();
						await (this as any).api('users/lists/push', {
							listId: list.id,
							userId: this.user.id
						});
						(this as any).os.new(Ok);
					});
				}
			}];

			this.os.new(Menu, {
				source: this.$refs.menu,
				compact: false,
				items: menu
			});
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
				font-size 14px
				opacity 0.7
				text-shadow 0 0 8px #000

	> .info
		padding 16px
		font-size 12px
		color var(--text)
		text-align center
		background var(--face)
		border-bottom solid 1px var(--faceDivider)

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

	> .pinned
		padding-bottom 16px
		background var(--deckColumnBg)

		> p
			margin 0
			padding 8px 16px
			font-size 12px
			color var(--text)

		> .notes
			background var(--face)

	> .images
		display grid
		grid-template-columns 1fr 1fr 1fr
		gap 8px
		padding 16px
		margin-bottom 16px
		background var(--face)

		> *
			height 70px
			background-position center center
			background-size cover
			background-clip content-box
			border-radius 4px

	> .activity
		margin-bottom 16px
		background var(--face)

	> .tl
		background var(--face)

</style>
