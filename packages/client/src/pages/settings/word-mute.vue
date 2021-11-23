<template>
<div>
	<MkTab v-model="tab">
		<option value="soft">{{ $ts._wordMute.soft }}</option>
		<option value="hard">{{ $ts._wordMute.hard }}</option>
	</MkTab>
	<FormBase>
		<div class="_debobigegoItem">
			<div v-show="tab === 'soft'">
				<FormInfo>{{ $ts._wordMute.softDescription }}</FormInfo>
				<FormTextarea v-model="softMutedWords">
					<span>{{ $ts._wordMute.muteWords }}</span>
					<template #desc>{{ $ts._wordMute.muteWordsDescription }}<br>{{ $ts._wordMute.muteWordsDescription2 }}</template>
				</FormTextarea>
			</div>
			<div v-show="tab === 'hard'">
				<FormInfo>{{ $ts._wordMute.hardDescription }}</FormInfo>
				<FormTextarea v-model="hardMutedWords">
					<span>{{ $ts._wordMute.muteWords }}</span>
					<template #desc>{{ $ts._wordMute.muteWordsDescription }}<br>{{ $ts._wordMute.muteWordsDescription2 }}</template>
				</FormTextarea>
				<FormKeyValueView v-if="hardWordMutedNotesCount != null">
					<template #key>{{ $ts._wordMute.mutedNotes }}</template>
					<template #value>{{ number(hardWordMutedNotesCount) }}</template>
				</FormKeyValueView>
			</div>
		</div>
		<FormButton primary inline :disabled="!changed" @click="save()"><i class="fas fa-save"></i> {{ $ts.save }}</FormButton>
	</FormBase>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormKeyValueView from '@/components/debobigego/key-value-view.vue';
import FormButton from '@/components/debobigego/button.vue';
import FormInfo from '@/components/debobigego/info.vue';
import MkTab from '@/components/tab.vue';
import * as os from '@/os';
import number from '@/filters/number';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormButton,
		FormTextarea,
		FormKeyValueView,
		MkTab,
		FormInfo,
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
