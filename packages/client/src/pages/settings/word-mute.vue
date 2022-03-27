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
			<MkInfo class="_formBlock">{{ $ts._wordMute.hardDescription }} {{ $ts.reflectMayTakeTime }}</MkInfo>
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
import MkKeyValue from '@/components/key-value.vue';
import MkButton from '@/components/ui/button.vue';
import MkInfo from '@/components/ui/info.vue';
import MkTab from '@/components/tab.vue';
import * as os from '@/os';
import number from '@/filters/number';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
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
		const render = (mutedWords) => mutedWords.map(x => {
			if (Array.isArray(x)) {
				return x.join(' ');
			} else {
				return x;
			}
		}).join('\n');

		this.softMutedWords = render(this.$store.state.mutedWords);
		this.hardMutedWords = render(this.$i.mutedWords);

		this.hardWordMutedNotesCount = (await os.api('i/get-word-muted-notes-count', {})).count;
	},

	methods: {
		async save() {
			const parseMutes = (mutes, tab) => {
				// split into lines, remove empty lines and unnecessary whitespace
				let lines = mutes.trim().split('\n').map(line => line.trim()).filter(line => line != '');

				// check each line if it is a RegExp or not
				for (let i = 0; i < lines.length; i++) {
					const line = lines[i]
					const regexp = line.match(/^\/(.+)\/(.*)$/);
					if (regexp) {
						// check that the RegExp is valid
						try {
							new RegExp(regexp[1], regexp[2]);
							// note that regex lines will not be split by spaces!
						} catch (err) {
							// invalid syntax: do not save, do not reset changed flag
							os.alert({
								type: 'error',
								title: this.$ts.regexpError,
								text: this.$t('regexpErrorDescription', { tab, line: i + 1 }) + "\n" + err.toString()
							});
							// re-throw error so these invalid settings are not saved
							throw err;
						}
					} else {
						lines[i] = line.split(' ');
					}
				}

				return lines;
			};

			let softMutes, hardMutes;
			try {
				softMutes = parseMutes(this.softMutedWords, this.$ts._wordMute.soft);
				hardMutes = parseMutes(this.hardMutedWords, this.$ts._wordMute.hard);
			} catch (err) {
				// already displayed error message in parseMutes
				return;
			}

			this.$store.set('mutedWords', softMutes);
			await os.api('i/update', {
				mutedWords: hardMutes,
			});

			this.changed = false;
		},

		number
	}
});
</script>
