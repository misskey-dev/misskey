<template>
<x-column>
	<span slot="header">
		%fa:user%<span>{{ title }}</span>
	</span>

	<div class="zubukjlciycdsyynicqrnlsmdwmymzqu" v-if="user">
		<div class="is-remote" v-if="user.host != null">%fa:exclamation-triangle% %i18n:@is-remote%<a :href="user.url || user.uri" target="_blank">%i18n:@view-remote%</a></div>
		<header :style="bannerStyle">
			<div>
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
			<router-link v-for="image in images" :style="`background-image: url(${image.thumbnailUrl})`" :key="`${image.id}:${image._note.id}`" :to="image._note | notePage"></router-link>
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

			(this as any).api('users/notes', {
				userId: this.user.id,
				withFiles: true,
				limit: 9
			}).then(notes => {
				notes.forEach(note => {
					note.files.forEach(file => {
						file._note = note;
						if (this.images.length < 9) this.images.push(file);
					});
				});
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
	}
});
</script>

<style lang="stylus" scoped>
.zubukjlciycdsyynicqrnlsmdwmymzqu
	background var(--deckUserColumnBg)

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
		font-size 14px
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
		background var(--deckUserColumnBg)

		> p
			margin 0
			padding 8px 16px
			font-size 14px
			color var(--text)

		> .notes
			background var(--face)

	> .images
		display grid
		grid-template-rows 1fr 1fr 1fr
		grid-template-columns 1fr 1fr 1fr
		gap 4px
		height 250px
		padding 16px
		margin-bottom 16px
		background var(--face)

		> *
			background-position center center
			background-size cover
			background-clip content-box

	> .tl
		background var(--face)

</style>
