<template>
<div class="_formRoot">
	<MkTab v-model="tab" class="_formBlock">
		<option value="soft">{{ $ts._wordMute.soft }}</option>
		<option value="hard">{{ $ts._wordMute.hard }}</option>
	</MkTab>
	<div class="_formBlock">
		<div v-show="tab === 'soft'">
			<MkInfo class="_formBlock">{{ $ts._wordMute.softDescription }}</MkInfo>
			<FormTextarea v-model="softMutedWords" class="_formBlock">
				<span>{{ $ts._wordMute.muteWords }}</span>
				<template #caption>{{ $ts._wordMute.muteWordsDescription }}<br>{{ $ts._wordMute.muteWordsDescription2 }}</template>
			</FormTextarea>
		</div>
		<div v-show="tab === 'hard'">
			<MkInfo class="_formBlock">{{ $ts._wordMute.hardDescription }}</MkInfo>
			<FormTextarea v-model="hardMutedWords" class="_formBlock">
				<span>{{ $ts._wordMute.muteWords }}</span>
				<template #caption>{{ $ts._wordMute.muteWordsDescription }}<br>{{ $ts._wordMute.muteWordsDescription2 }}</template>
			</FormTextarea>
			<MkKeyValue v-if="hardWordMutedNotesCount != null" class="_formBlock">
				<template #key>{{ $ts._wordMute.mutedNotes }}</template>
				<template #value>{{ number(hardWordMutedNotesCount) }}</template>
			</MkKeyValue>
		</div>
	</div>
	<MkButton primary inline :disabled="!changed" @click="save()"><i class="fas fa-save"></i> {{ $ts.save }}</MkButton>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormBase from '@/components/debobigego/base.vue';
import MkKeyValue from '@/components/key-value.vue';
import MkButton from '@/components/ui/button.vue';
import MkInfo from '@/components/ui/info.vue';
import MkTab from '@/components/tab.vue';
import * as os from '@/os';
import number from '@/filters/number';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormBase,
		MkButton,
		FormTextarea,
		MkKeyValue,
		MkTab,
		MkInfo,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.wordMute,
				icon: 'fas fa-comment-slash',
				bg: 'var(--bg)',
			},
			tab: 'soft',
			softMutedWords: '',
			hardMutedWords: '',
			hardWordMutedNotesCount: null,
			changed: false,
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
		this.softMutedWords = this.$store.state.mutedWords.map(x => x.join(' ')).join('\n');
		this.hardMutedWords = this.$i.mutedWords.map(x => x.join(' ')).join('\n');

		this.hardWordMutedNotesCount = (await os.api('i/get-word-muted-notes-count', {})).count;
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async save() {
			this.$store.set('mutedWords', this.softMutedWords.trim().split('\n').map(x => x.trim().split(' ')));
			await os.api('i/update', {
				mutedWords: this.hardMutedWords.trim().split('\n').map(x => x.trim().split(' ')),
			});
			this.changed = false;
		},

		number
	}
});
</script>
