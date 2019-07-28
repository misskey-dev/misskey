<template>
<ui-card>
	<template #title><fa icon="ban"/> {{ $t('mute-and-block') }}</template>

	<section>
		<header>{{ $t('mute') }}</header>
		<ui-info v-if="!muteFetching && mute.length == 0">{{ $t('no-muted-users') }}</ui-info>
		<div class="users" v-if="mute.length != 0">
			<div class="user" v-for="user in mute" :key="user.id">
				<a :href="user | userPage(null, true)"><p><b><mk-user-name :user="user"/></b> @{{ user | acct }}</p></a>
				<span @click="unmute(user)">
					<fa icon="times"/>
				</span>
			</div>
		</div>
	</section>

	<section>
		<header>{{ $t('block') }}</header>
		<ui-info v-if="!blockFetching && block.length == 0">{{ $t('no-blocked-users') }}</ui-info>
		<div class="users" v-if="block.length != 0">
			<div class="user" v-for="user in block" :key="user.id">
				<a :href="user | userPage(null, true)"><p><b><mk-user-name :user="user"/></b> @{{ user | acct }}</p></a>
				<span @click="unblock(user)">
					<fa icon="times"/>
				</span>
			</div>
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

export default Vue.extend({
	i18n: i18n('common/views/components/mute-and-block.vue'),

	data() {
		return {
			muteFetching: true,
			blockFetching: true,
			mute: [],
			block: [],
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
				});
				this.updateMute();
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
				});
				this.updateMute();
			});
		},
		updateMute() {
			this.muteFetching = true;
			this.$root.api('mute/list').then(mute => {
				this.mute = mute.map(x => x.mutee);
				this.muteFetching = false;
			});
		},
		updateBlock() {
			this.blockFetching = true;
			this.$root.api('blocking/list').then(blocking => {
				this.block = blocking.map(x => x.blockee);
				this.blockFetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
	.users 
		.user
			display flex
			align-items center
			justify-content flex-end
			a
				color var(--face-text)
			span 
				margin-left auto
				cursor pointer
			span:hover
				text-decoration underline

</style>

