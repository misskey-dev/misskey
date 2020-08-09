<template>
<section class="_card">
	<div class="_title"><fa :icon="faCommentSlash"/> {{ $t('wordMute') }}</div>
	<div class="_content _noPad">
		<mk-tab v-model="tab" :items="[{ label: $t('_wordMute.soft'), value: 'soft' }, { label: $t('_wordMute.hard'), value: 'hard' }]"/>
	</div>
	<div class="_content" v-show="tab === 'soft'">
		<mk-info>{{ $t('_wordMute.softDescription') }}</mk-info>
		<mk-textarea v-model="softMutedWords">
			<span>{{ $t('_wordMute.muteWords') }}</span>
			<template #desc>{{ $t('_wordMute.muteWordsDescription') }}<br>{{ $t('_wordMute.muteWordsDescription2') }}</template>
		</mk-textarea>
	</div>
	<div class="_content" v-show="tab === 'hard'">
		<mk-info>{{ $t('_wordMute.hardDescription') }}</mk-info>
		<mk-textarea v-model="hardMutedWords">
			<span>{{ $t('_wordMute.muteWords') }}</span>
			<template #desc>{{ $t('_wordMute.muteWordsDescription') }}<br>{{ $t('_wordMute.muteWordsDescription2') }}</template>
		</mk-textarea>
	</div>
	<div class="_footer">
		<mk-button @click="save()" primary inline :disabled="!changed"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCommentSlash, faSave } from '@fortawesome/free-solid-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkTextarea from '../../components/ui/textarea.vue';
import MkTab from '../../components/tab.vue';
import MkInfo from '../../components/ui/info.vue';

export default defineComponent({
	components: {
		MkButton,
		MkTextarea,
		MkTab,
		MkInfo,
	},
	
	data() {
		return {
			tab: 'soft',
			softMutedWords: '',
			hardMutedWords: '',
			changed: false,
			faCommentSlash, faSave,
		}
	},

	watch: {
		softMutedWords() {
			this.changed = true;
		},
		hardMutedWords() {
			this.changed = true;
		},
	},

	created() {
		this.softMutedWords = this.$store.state.settings.mutedWords.map(x => x.join(' ')).join('\n');
		this.hardMutedWords = this.$store.state.i.mutedWords.map(x => x.join(' ')).join('\n');
	},

	methods: {
		async save() {
			this.$store.dispatch('settings/set', { key: 'mutedWords', value: this.softMutedWords.trim().split('\n').map(x => x.trim().split(' ')) });
			await this.$root.api('i/update', {
				mutedWords: this.hardMutedWords.trim().split('\n').map(x => x.trim().split(' ')),
			});
			this.changed = false;
		},
	}
});
</script>
