<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="zmdxowus">
	<p v-if="choices.length < 2" class="caution">
		<i class="ti ti-alert-triangle"></i>{{ i18n.ts._poll.noOnlyOneChoice }}
	</p>
	<ul>
		<li v-for="(choice, i) in choices" :key="i">
			<MkInput class="input" small :modelValue="choice" :placeholder="i18n.tsx._poll.choiceN({ n: i + 1 })" @update:modelValue="onInput(i, $event)">
			</MkInput>
			<button class="_button" @click="remove(i)">
				<i class="ti ti-x"></i>
			</button>
		</li>
	</ul>
	<MkButton v-if="choices.length < 10" class="add" @click="add">{{ i18n.ts.add }}</MkButton>
	<MkButton v-else class="add" disabled>{{ i18n.ts._poll.noMore }}</MkButton>
	<MkSwitch v-model="multiple">{{ i18n.ts._poll.canMultipleVote }}</MkSwitch>
	<section>
		<div>
			<MkSelect v-model="expiration" small>
				<template #label>{{ i18n.ts._poll.expiration }}</template>
				<option value="infinite">{{ i18n.ts._poll.infinite }}</option>
				<option value="at">{{ i18n.ts._poll.at }}</option>
				<option value="after">{{ i18n.ts._poll.after }}</option>
			</MkSelect>
			<section v-if="expiration === 'at'">
				<MkInput v-model="atDate" small type="date" class="input">
					<template #label>{{ i18n.ts._poll.deadlineDate }}</template>
				</MkInput>
				<MkInput v-model="atTime" small type="time" class="input">
					<template #label>{{ i18n.ts._poll.deadlineTime }}</template>
				</MkInput>
			</section>
			<section v-else-if="expiration === 'after'">
				<MkInput v-model="after" small type="number" min="1" class="input">
					<template #label>{{ i18n.ts._poll.duration }}</template>
				</MkInput>
				<MkSelect v-model="unit" small>
					<option value="second">{{ i18n.ts._time.second }}</option>
					<option value="minute">{{ i18n.ts._time.minute }}</option>
					<option value="hour">{{ i18n.ts._time.hour }}</option>
					<option value="day">{{ i18n.ts._time.day }}</option>
				</MkSelect>
			</section>
		</div>
	</section>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import MkInput from './MkInput.vue';
import MkSelect from './MkSelect.vue';
import MkSwitch from './MkSwitch.vue';
import MkButton from './MkButton.vue';
import { formatDateTimeString } from '@/scripts/format-time-string.js';
import { addTime } from '@/scripts/time.js';
import { i18n } from '@/i18n.js';

export type PollEditorModelValue = {
	expiresAt: number | null;
	expiredAfter: number | null;
	choices: string[];
	multiple: boolean;
};

const props = defineProps<{
	modelValue: PollEditorModelValue;
}>();
const emit = defineEmits<{
	(ev: 'update:modelValue', v: PollEditorModelValue): void;
}>();

const choices = ref(props.modelValue.choices);
const multiple = ref(props.modelValue.multiple);
const expiration = ref('infinite');
const atDate = ref(formatDateTimeString(addTime(new Date(), 1, 'day'), 'yyyy-MM-dd'));
const atTime = ref('00:00');
const after = ref(0);
const unit = ref('second');

if (props.modelValue.expiresAt) {
	expiration.value = 'at';
	const expiresAt = new Date(props.modelValue.expiresAt);
	atDate.value = formatDateTimeString(expiresAt, 'yyyy-MM-dd');
	atTime.value = formatDateTimeString(expiresAt, 'HH:mm');
} else if (typeof props.modelValue.expiredAfter === 'number') {
	expiration.value = 'after';
	after.value = props.modelValue.expiredAfter / 1000;
} else {
	expiration.value = 'infinite';
}

function onInput(i, value) {
	choices.value[i] = value;
}

function add() {
	choices.value.push('');
	// TODO
	// nextTick(() => {
	//   (this.$refs.choices as any).childNodes[this.choices.length - 1].childNodes[0].focus();
	// });
}

function remove(i) {
	choices.value = choices.value.filter((_, _i) => _i !== i);
}

function get(): PollEditorModelValue {
	const calcAt = () => {
		return new Date(`${atDate.value} ${atTime.value}`).getTime();
	};

	const calcAfter = () => {
		let base = parseInt(after.value.toString());
		switch (unit.value) {
			// @ts-expect-error fallthrough
			case 'day': base *= 24;
			// @ts-expect-error fallthrough
			case 'hour': base *= 60;
			// @ts-expect-error fallthrough
			case 'minute': base *= 60;
			// eslint-disable-next-line no-fallthrough
			case 'second': return base *= 1000;
			default: return null;
		}
	};

	return {
		choices: choices.value,
		multiple: multiple.value,
		expiresAt: expiration.value === 'at' ? calcAt() : null,
		expiredAfter: expiration.value === 'after' ? calcAfter() : null,
	};
}

watch([choices, multiple, expiration, atDate, atTime, after, unit], () => emit('update:modelValue', get()), {
	deep: true,
});
</script>

<style lang="scss" scoped>
.zmdxowus {
	padding: 8px 16px;

	> .caution {
		margin: 0 0 8px 0;
		font-size: 0.8em;
		color: #f00;

		> i {
			margin-right: 4px;
		}
	}

	> ul {
		display: block;
		margin: 0;
		padding: 0;
		list-style: none;

		> li {
			display: flex;
			margin: 8px 0;
			padding: 0;
			width: 100%;

			> .input {
				flex: 1;
			}

			> button {
				width: 32px;
				padding: 4px 0;
			}
		}
	}

	> .add {
		margin: 8px 0;
		z-index: 1;
	}

	> section {
		margin: 16px 0 0 0;

		> div {
			margin: 0 8px;
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 12px;

			&:last-child {
				flex: 1 0 auto;

				> div {
					flex-grow: 1;
				}

				> section {
					// MAGIC: Prevent div above from growing unless wrapped to its own line
					flex-grow: 9999;
					align-items: end;
					display: flex;
					gap: 4px;

					> .input {
						flex: 1 1 auto;
					}
				}
			}
		}
	}
}
</style>
