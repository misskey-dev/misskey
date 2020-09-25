<template>
<section class="_section">
	<div class="_title"><Fa :icon="faCommentSlash"/> {{ $t('wordMute') }}</div>
	<div class="_content">
		<MkTab v-model:value="tab" :items="[{ label: $t('_wordMute.soft'), value: 'soft' }, { label: $t('_wordMute.hard'), value: 'hard' }]" style="margin-bottom: var(--margin);"/>
		<div v-show="tab === 'soft'">
			<MkInfo>{{ $t('_wordMute.softDescription') }}</MkInfo>
			<MkTextarea v-model:value="softMutedWords">
				<span>{{ $t('_wordMute.muteWords') }}</span>
				<template #desc>{{ $t('_wordMute.muteWordsDescription') }}<br>{{ $t('_wordMute.muteWordsDescription2') }}</template>
			</MkTextarea>
		</div>
		<div v-show="tab === 'hard'">
			<MkInfo>{{ $t('_wordMute.hardDescription') }}</MkInfo>
			<MkTextarea v-model:value="hardMutedWords" style="margin-bottom: 16px;">
				<span>{{ $t('_wordMute.muteWords') }}</span>
				<template #desc>{{ $t('_wordMute.muteWordsDescription') }}<br>{{ $t('_wordMute.muteWordsDescription2') }}</template>
			</MkTextarea>
			<div v-if="hardWordMutedNotesCount != null" class="_caption">{{ $t('_wordMute.mutedNotes') }}: {{ hardWordMutedNotesCount | number }}</div>
		</div>
	</div>
	<div class="_footer">
		<MkButton @click="save()" primary inline :disabled="!changed"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCommentSlash, faSave } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import MkTab from '@/components/tab.vue';
import MkInfo from '@/components/ui/info.vue';
import * as os from '@/os';

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
			hardWordMutedNotesCount: null,
			changed: false,
			faCommentSlash, faSave,
		}
	},

	watch: {
		softMutedWords: {
			handler() {
				this.changed = true;
			},
			deep: true
		},
		hardMutedWords: {
			handler() {
				this.changed = true;
			},
			deep: true
		},
	},

	async created() {
		this.softMutedWords = this.$store.state.settings.mutedWords.map(x => x.join(' ')).join('\n');
		this.hardMutedWords = this.$store.state.i.mutedWords.map(x => x.join(' ')).join('\n');

		this.hardWordMutedNotesCount = (await os.api('i/get-word-muted-notes-count', {})).count;
	},

	methods: {
		async save() {
			this.$store.dispatch('settings/set', { key: 'mutedWords', value: this.softMutedWords.trim().split('\n').map(x => x.trim().split(' ')) });
			await os.api('i/update', {
				mutedWords: this.hardMutedWords.trim().split('\n').map(x => x.trim().split(' ')),
			});
			this.changed = false;
		},
	}
});
</script>
