<template>
<ui-card>
	<template #title><fa icon="ban"/> {{ $t('mute-and-block') }}</template>

	<section>
		<header>{{ $t('mute') }}</header>
		<ui-info v-if="!muteFetching && mute.length == 0">{{ $t('no-muted-users') }}</ui-info>
		<div class="users" v-if="mute.length != 0">
			<div class="user" v-for="user in mute" :key="user.id">
				<x-user :user="user"/>
				<span @click="unmute(user)">
					<fa icon="times"/>
				</span>
			</div>
			<ui-button v-if="this.muteCursor != null" @click="updateMute()">{{ $t('@.load-more') }}</ui-button>
		</div>
	</section>

	<section>
		<header>{{ $t('block') }}</header>
		<ui-info v-if="!blockFetching && block.length == 0">{{ $t('no-blocked-users') }}</ui-info>
		<div class="users" v-if="block.length != 0">
			<div class="user" v-for="user in block" :key="user.id">
				<x-user :user="user"/>
				<span @click="unblock(user)">
					<fa icon="times"/>
				</span>
			</div>
			<ui-button v-if="this.blockCursor != null" @click="updateBlock()">{{ $t('@.load-more') }}</ui-button>
		</div>
	</section>

	<section>
		<header>{{ $t('word-mute') }}</header>
		<ui-textarea v-model="mutedWords">
			{{ $t('muted-words') }}<template #desc>{{ $t('muted-words-description') }}</template>
		</ui-textarea>
		<ui-button @click="save">{{ $t('save') }}</ui-button>
	</section>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import XUser from './mute-and-block.user.vue';

const fetchLimit = 30;

export default Vue.extend({
	i18n: i18n('common/views/components/mute-and-block.vue'),

	components: {
		XUser
	},

	data() {
		return {
			muteFetching: true,
			blockFetching: true,
			mute: [],
			block: [],
			muteCursor: undefined,
			blockCursor: undefined,
			mutedWords: ''
		};
	},

	computed: {
		_mutedWords: {
			get() { return this.$store.state.settings.mutedWords; },
			set(value) { this.$store.dispatch('settings/set', { key: 'mutedWords', value }); }
		},
	},

	mounted() {
		this.mutedWords = this._mutedWords.map(words => words.join(' ')).join('\n');

		this.updateMute();
		this.updateBlock();
	},

	methods: {
		save() {
			this._mutedWords = this.mutedWords.split('\n').map(line => line.split(' ').filter(x => x != ''));
		},

		unmute(user) {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('unmute-confirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;
				this.$root.api('mute/delete', {
					userId: user.id
				}).then(() => {
					this.muteCursor = undefined;
					this.updateMute();
				});
			});
		},

		unblock(user) {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('unblock-confirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;
				this.$root.api('blocking/delete', {
					userId: user.id
				}).then(() => {
					this.updateBlock();
				});
			});
		},

		updateMute() {
			this.muteFetching = true;
			this.$root.api('mute/list', {
				limit: fetchLimit + 1,
				untilId: this.muteCursor,
			}).then((items: Object[]) => {
				const past = this.muteCursor ? this.mute : [];

				if (items.length === fetchLimit + 1) {
					items.pop()
					this.muteCursor = items[items.length - 1].id;
				} else {
					this.muteCursor = undefined;
				}

				this.mute = past.concat(items.map(x => x.mutee));
				this.muteFetching = false;
			});
		},

		updateBlock() {
			this.blockFetching = true;
			this.$root.api('blocking/list', {
				limit: fetchLimit + 1,
				untilId: this.blockCursor,
			}).then((items: Object[]) => {
				const past = this.blockCursor ? this.block : [];

				if (items.length === fetchLimit + 1) {
					items.pop()
					this.blockCursor = items[items.length - 1].id;
				} else {
					this.blockCursor = undefined;
				}

				this.block = past.concat(items.map(x => x.blockee));
				this.blockFetching = false;
			});
		},
	}
});
</script>

<style lang="stylus" scoped>
	.users
		> .user
			display flex
			align-items center
			justify-content flex-end
			border-radius 6px

			&:hover
				background-color var(--primary)

			> span
				margin-left auto
				cursor pointer
				padding 16px
		
		> button
			margin-top 16px
</style>

