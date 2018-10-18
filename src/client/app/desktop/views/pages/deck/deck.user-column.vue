<template>
<x-column :is-stacked="false">
	<span slot="header">
		%fa:user%<span>{{ title }}</span>
	</span>

	<div class="zubukjlciycdsyynicqrnlsmdwmymzqu" v-if="user">
		<div class="is-remote" v-if="user.host != null">%fa:exclamation-triangle% %i18n:@is-remote%<a :href="user.url || user.uri" target="_blank">%i18n:@view-remote%</a></div>
		<header :style="bannerStyle">
			<div>
				<mk-avatar class="avatar" :user="user" :disable-preview="true"/>
				<span class="name">{{ user | userName }}</span>
				<span class="acct">@{{ user | acct }}</span>
			</div>
		</header>
		<div class="info">
			<div class="description">
				<misskey-flavored-markdown v-if="user.description" :text="user.description" :i="$store.state.i"/>
			</div>
			<div class="info">
				<span class="location" v-if="user.host === null && user.profile.location">%fa:map-marker% {{ user.profile.location }}</span>
				<span class="birthday" v-if="user.host === null && user.profile.birthday">%fa:birthday-cake% {{ user.profile.birthday.replace('-', '年').replace('-', '月') + '日' }} ({{ age }}歳)</span>
			</div>
			<div class="status">
				<span class="notes-count"><b>{{ user.notesCount | number }}</b>%i18n:@posts%</span>
				<span class="following clickable"><b>{{ user.followingCount | number }}</b>%i18n:@following%</span>
				<span class="followers clickable"><b>{{ user.followersCount | number }}</b>%i18n:@followers%</span>
			</div>
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

const fetchLimit = 10;

export default Vue.extend({
	components: {
		XColumn,
		XNotes
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
			withFiles: false
		};
	},

	computed: {
		title(): string {
			return this.user ? this.user.name || this.user.username : '';
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

</style>
