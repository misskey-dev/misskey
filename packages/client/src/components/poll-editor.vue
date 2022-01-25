<template>
<div class="zmdxowus">
	<p v-if="poll.choices.length < 2" class="caution">
		<i class="fas fa-exclamation-triangle"></i>{{ $ts._poll.noOnlyOneChoice }}
	</p>
	<ul ref="choices">
		<li v-for="(choice, i) in poll.choices" :key="i">
			<MkInput class="input" :model-value="choice" :placeholder="$t('_poll.choiceN', { n: i + 1 })" @update:modelValue="onInput(i, $event)">
			</MkInput>
			<button class="_button" @click="remove(i)">
				<i class="fas fa-times"></i>
			</button>
		</li>
	</ul>
	<MkButton v-if="poll.choices.length < 10" class="add" @click="add">{{ $ts.add }}</MkButton>
	<MkButton v-else class="add" disabled>{{ $ts._poll.noMore }}</MkButton>
	<MkSwitch v-model="poll.multiple">{{ $ts._poll.canMultipleVote }}</MkSwitch>
	<section>
		<div>
			<MkSelect v-model="expiration">
				<template #label>{{ $ts._poll.expiration }}</template>
				<option value="infinite">{{ $ts._poll.infinite }}</option>
				<option value="at">{{ $ts._poll.at }}</option>
				<option value="after">{{ $ts._poll.after }}</option>
			</MkSelect>
			<section v-if="expiration === 'at'">
				<MkInput v-model="atDate" type="date" class="input">
					<template #label>{{ $ts._poll.deadlineDate }}</template>
				</MkInput>
				<MkInput v-model="atTime" type="time" class="input">
					<template #label>{{ $ts._poll.deadlineTime }}</template>
				</MkInput>
			</section>
			<section v-if="expiration === 'after'">
				<MkInput v-model="after" type="number" class="input">
					<template #label>{{ $ts._poll.duration }}</template>
				</MkInput>
				<MkSelect v-model="unit">
					<option value="second">{{ $ts._time.second }}</option>
					<option value="minute">{{ $ts._time.minute }}</option>
					<option value="hour">{{ $ts._time.hour }}</option>
					<option value="day">{{ $ts._time.day }}</option>
				</MkSelect>
			</section>
		</div>
	</section>
</div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { addTime } from '@/scripts/time';
import { formatDateTimeString } from '@/scripts/format-time-string';
import MkInput from './form/input.vue';
import MkSelect from './form/select.vue';
import MkSwitch from './form/switch.vue';
import MkButton from './ui/button.vue';

const { poll } = defineProps({
	poll: {
		type: Object,
		required: true,
	},
});
const emit = defineEmits(['updated']);

const expiration = ref('infinite');
const atDate = ref(formatDateTimeString(addTime(new Date(), 1, 'day'), 'yyyy-MM-dd'));
const atTime = ref('00:00');
const after = ref(0);
const unit = ref('second');

if (poll.expiresAt) {
	expiration.value = 'at';
	atDate.value = atTime.value = poll.expiresAt;
} else if (typeof poll.expiredAfter === 'number') {
	expiration.value = 'after';
	after.value = poll.expiredAfter / 1000;
} else {
	expiration.value = 'infinite';
}

function onInput(i, e) {
	poll.choices[i] = e;
}

function add() {
	poll.choices.push('');
	// TODO
	// nextTick(() => {
	//   (this.$refs.choices as any).childNodes[this.choices.length - 1].childNodes[0].focus();
	// });
}

function remove(i) {
	poll.choices = poll.choices.filter((_, _i) => _i != i);
}

function get() {
	const calcAt = () => {
		return new Date(`${atDate.value} ${atTime.value}`).getTime();
	};

	const calcAfter = () => {
		let base = parseInt(after.value);
		switch (unit) {
			case 'day': base *= 24;
			case 'hour': base *= 60;
			case 'minute': base *= 60;
			case 'second': return base *= 1000;
			default: return null;
		}
	};

	return {
		choices: poll.choices,
		multiple: poll.multiple,
		...(
			expiration.value === 'at' ? { expiresAt: calcAt() } :
			expiration.value === 'after' ? { expiredAfter: calcAfter() } : {}
		)
	};
}

watch([poll, expiration, atDate, after, unit], () => emit('updated', get()));
</script>

<style lang="scss" scoped>
.zmdxowus {
	padding: 8px;

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
