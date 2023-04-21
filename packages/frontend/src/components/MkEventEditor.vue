<template>
<div class="zmdxowut">
	<MkInput v-model="title" small type="text" class="input">
		<template #label>*{{ "Title" }}</template>
	</MkInput>
	<section>
		<div>
			<section>
				<MkInput v-model="startDate" small type="date" class="input">
					<template #label>*{{ "Start Date" }}</template>
				</MkInput>
				<MkInput v-model="startTime" small type="time" class="input">
					<template #label>*{{ "Start Time" }}</template>
				</MkInput>
			</section>
			<section>
				<MkInput v-model="endDate" small type="date" class="input">
					<template #label>{{ "End Date" }}</template>
				</MkInput>
				<MkInput v-model="endTime" small type="time" class="input">
					<template #label>{{ "End Time" }}</template>
				</MkInput>
			</section>
		</div>
	</section>
	<p>Details</p>
	<ul>
		<li v-for="(entry, i) in meta" :key="i">
			<MkInput class="input" small :model-value="entry[0]" placeholder="placeholder key"
				@update:model-value="onKeyInput(i, $event)">
			</MkInput>
			<MkInput class="input" small :model-value="entry[1]" placeholder="placeholder value"
				@update:model-value="onValueInput(i, $event)">
			</MkInput>
			<button class="_button" @click="remove(i)">
				<i class="ti ti-x"></i>
			</button>
		</li>
	</ul>
	<MkButton class="add" @click="add">{{ i18n.ts.add }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { Ref, ref, watch } from 'vue';
import MkInput from './MkInput.vue';
import MkButton from './MkButton.vue';
import { formatDateTimeString } from '@/scripts/format-time-string';
import { addTime } from '@/scripts/time';
import { i18n } from '@/i18n';

const props = defineProps<{
	modelValue: {
		title: string,
		start: string,
		end: string | null,
		metadata: Record<string, string>,
	}
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', v: {
		title: string,
		start: string,
		end: string | null,
		metadata: Record<string, string>,
	})
}>();

const title = ref(props.modelValue.title);
const startDate = ref(formatDateTimeString(addTime(new Date(), 1, 'day'), 'yyyy-MM-dd'));
const startTime = ref('00:00');
const endDate = ref('');
const endTime = ref('');
const meta = ref(Object.entries(props.modelValue.metadata));

function add() {
	meta.value.push(['', '']);
}

function onKeyInput(i, newKey) {
	meta.value[i][0] = newKey;
}

function onValueInput(i, value) {
	meta.value[i][1] = value;
}

function remove(i) {
	meta.value.splice(i, 1);
}

function get() {
	const calcAt = (date: Ref<string>, time: Ref<string>): number => (new Date(`${date.value} ${time.value}`)).getTime();

	return {
		title: title.value,
		start: calcAt(startDate, startTime),
		end: endDate.value ? calcAt(endDate, endTime) : null,
		metadata: meta.value.reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {}),
	};
}

watch([title, startDate, startTime, endDate, endTime, meta], () => emit('update:modelValue', get()), {
	deep: true,
});
</script>

<style lang="scss" scoped>
.zmdxowut {
	padding: 8px 16px;

	>.caution {
		margin: 0 0 8px 0;
		font-size: 0.8em;
		color: #f00;

		>i {
			margin-right: 4px;
		}
	}

	>ul {
		display: block;
		margin: 0;
		padding: 0;
		list-style: none;

		>li {
			display: flex;
			margin: 8px 0;
			padding: 0;
			width: 100%;

			>.input {
				flex: 1;
			}

			>button {
				width: 32px;
				padding: 4px 0;
			}
		}
	}

	>.add {
		margin: 8px 0;
		z-index: 1;
	}

	>section {
		margin: 16px 0 0 0;

		>div {
			margin: 0 8px;
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 12px;

			&:last-child {
				flex: 1 0 auto;

				>div {
					flex-grow: 1;
				}

				>section {
					// MAGIC: Prevent div above from growing unless wrapped to its own line
					flex-grow: 9999;
					align-items: end;
					display: flex;
					gap: 4px;

					>.input {
						flex: 1 1 auto;
					}
				}
			}
		}
	}
}
</style>
