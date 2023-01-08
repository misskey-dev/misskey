<template>
<div>
	<div v-if="game.ready" :class="$style.game">
		<div :class="$style.count" class=""><i class="ti ti-cookie" style="font-size: 70%;"></i> {{ number(cookies) }}</div>
		<button v-click-anime class="_button" :class="$style.button" @click="onClick">
			<img src="/client-assets/cookie.png" :class="$style.img">
		</button>
	</div>
	<div v-else>
		<MkLoading/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onMounted, onUnmounted } from 'vue';
import MkPlusOneEffect from '@/components/MkPlusOneEffect.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import * as game from '@/scripts/clicker-game';
import number from '@/filters/number';

defineProps<{
}>();

const saveData = game.saveData;
const cookies = computed(() => saveData.value?.cookies);

function onClick(ev: MouseEvent) {
	saveData.value!.cookies++;
	saveData.value!.clicked++;

	const x = ev.clientX;
	const y = ev.clientY;
	os.popup(MkPlusOneEffect, { x, y }, {}, 'end');
}

useInterval(game.save, 1000 * 5, {
	immediate: false,
	afterMounted: true,
});

onMounted(async () => {
	await game.load();
});

onUnmounted(() => {
	game.save();
});
</script>

<style lang="scss" module>
.game {
	padding: 16px;
	text-align: center;
}

.count {
	font-size: 1.3em;
	margin-bottom: 6px;
}

.button {

}

.img {
	max-width: 90px;
}
</style>
