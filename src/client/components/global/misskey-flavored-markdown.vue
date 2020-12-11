<template>
<mfm-core v-bind="$attrs" class="havbbuyv" :class="{ nowrap: $attrs['nowrap'] }"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MfmCore from '@/components/mfm';

export default defineComponent({
	components: {
		MfmCore
	}
});
</script>

<style lang="scss">
@keyframes mfm-spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

@keyframes mfm-spinX {
	0% { transform: perspective(128px) rotateX(0deg); }
	100% { transform: perspective(128px) rotateX(360deg); }
}

@keyframes mfm-spinY {
	0% { transform: perspective(128px) rotateY(0deg); }
	100% { transform: perspective(128px) rotateY(360deg); }
}

@keyframes mfm-jump {
	0% { transform: translateY(0); }
	25% { transform: translateY(-16px); }
	50% { transform: translateY(0); }
	75% { transform: translateY(-8px); }
	100% { transform: translateY(0); }
}

@keyframes mfm-bounce {
	0% { transform: translateY(0) scale(1, 1); }
	25% { transform: translateY(-16px) scale(1, 1); }
	50% { transform: translateY(0) scale(1, 1); }
	75% { transform: translateY(0) scale(1.5, 0.75); }
	100% { transform: translateY(0) scale(1, 1); }
}

// const val = () => `translate(${Math.floor(Math.random() * 20) - 10}px, ${Math.floor(Math.random() * 20) - 10}px)`;
// let css = '';
// for (let i = 0; i <= 100; i += 5) { css += `${i}% { transform: ${val()} }\n`; }
@keyframes mfm-twitch {
	0% { transform: translate(7px, -2px) }
	5% { transform: translate(-3px, 1px) }
	10% { transform: translate(-7px, -1px) }
	15% { transform: translate(0px, -1px) }
	20% { transform: translate(-8px, 6px) }
	25% { transform: translate(-4px, -3px) }
	30% { transform: translate(-4px, -6px) }
	35% { transform: translate(-8px, -8px) }
	40% { transform: translate(4px, 6px) }
	45% { transform: translate(-3px, 1px) }
	50% { transform: translate(2px, -10px) }
	55% { transform: translate(-7px, 0px) }
	60% { transform: translate(-2px, 4px) }
	65% { transform: translate(3px, -8px) }
	70% { transform: translate(6px, 7px) }
	75% { transform: translate(-7px, -2px) }
	80% { transform: translate(-7px, -8px) }
	85% { transform: translate(9px, 3px) }
	90% { transform: translate(-3px, -2px) }
	95% { transform: translate(-10px, 2px) }
	100% { transform: translate(-2px, -6px) }
}

// const val = () => `translate(${Math.floor(Math.random() * 6) - 3}px, ${Math.floor(Math.random() * 6) - 3}px) rotate(${Math.floor(Math.random() * 24) - 12}deg)`;
// let css = '';
// for (let i = 0; i <= 100; i += 5) { css += `${i}% { transform: ${val()} }\n`; }
@keyframes mfm-shake {
	0% { transform: translate(-3px, -1px) rotate(-8deg) }
	5% { transform: translate(0px, -1px) rotate(-10deg) }
	10% { transform: translate(1px, -3px) rotate(0deg) }
	15% { transform: translate(1px, 1px) rotate(11deg) }
	20% { transform: translate(-2px, 1px) rotate(1deg) }
	25% { transform: translate(-1px, -2px) rotate(-2deg) }
	30% { transform: translate(-1px, 2px) rotate(-3deg) }
	35% { transform: translate(2px, 1px) rotate(6deg) }
	40% { transform: translate(-2px, -3px) rotate(-9deg) }
	45% { transform: translate(0px, -1px) rotate(-12deg) }
	50% { transform: translate(1px, 2px) rotate(10deg) }
	55% { transform: translate(0px, -3px) rotate(8deg) }
	60% { transform: translate(1px, -1px) rotate(8deg) }
	65% { transform: translate(0px, -1px) rotate(-7deg) }
	70% { transform: translate(-1px, -3px) rotate(6deg) }
	75% { transform: translate(0px, -2px) rotate(4deg) }
	80% { transform: translate(-2px, -1px) rotate(3deg) }
	85% { transform: translate(1px, -3px) rotate(-10deg) }
	90% { transform: translate(1px, 0px) rotate(3deg) }
	95% { transform: translate(-2px, 0px) rotate(-3deg) }
	100% { transform: translate(2px, 1px) rotate(2deg) }
}

@keyframes mfm-rubberBand {
	from { transform: scale3d(1, 1, 1); }
	30% { transform: scale3d(1.25, 0.75, 1); }
	40% { transform: scale3d(0.75, 1.25, 1); }
	50% { transform: scale3d(1.15, 0.85, 1); }
	65% { transform: scale3d(0.95, 1.05, 1); }
	75% { transform: scale3d(1.05, 0.95, 1); }
	to { transform: scale3d(1, 1, 1); }
}
</style>

<style lang="scss" scoped>
.havbbuyv {
	white-space: pre-wrap;

	&.nowrap {
		white-space: pre;
		word-wrap: normal; // https://codeday.me/jp/qa/20190424/690106.html
		overflow: hidden;
		text-overflow: ellipsis;
	}

	::v-deep(.quote) {
		display: block;
		margin: 8px;
		padding: 6px 0 6px 12px;
		color: var(--fg);
		border-left: solid 3px var(--fg);
		opacity: 0.7;
	}

	::v-deep(pre) {
		font-size: 0.8em;
	}

	> ::v-deep(code) {
		font-size: 0.8em;
		word-break: break-all;
		padding: 4px 6px;
	}
}
</style>
