<template>
<div v-size="{ max: [400] }" class="rbusrurv" :class="{ wide: forceWide }">
	<slot></slot>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		forceWide: {
			type: Boolean,
			required: false,
			default: false,
		}
	}
});
</script>

<style lang="scss" scoped>
.rbusrurv {
	// 他のCSSからも参照されるので消さないように
	--debobigegoXPadding: 32px;
	--debobigegoYPadding: 32px;

	--debobigegoContentHMargin: 16px;

	font-size: 95%;
	line-height: 1.3em;
	background: var(--bg);
	padding: var(--debobigegoYPadding) var(--debobigegoXPadding);
	max-width: 750px;
	margin: 0 auto;

	&:not(.wide).max-width_400px {
		--debobigegoXPadding: 0px;

		> ::v-deep(*) {
			._debobigegoPanel {
				border: solid 0.5px var(--divider);
				border-radius: 0;
				border-left: none;
				border-right: none;
			}

			._debobigego_group {
				> *:not(._debobigegoNoConcat) {
					&:not(:last-child):not(._debobigegoNoConcatPrev) {
						&._debobigegoPanel, ._debobigegoPanel {
							border-bottom: solid 0.5px var(--divider);
						}
					}

					&:not(:first-child):not(._debobigegoNoConcatNext) {
						&._debobigegoPanel, ._debobigegoPanel {
							border-top: none;
						}
					}
				}
			}
		}
	}
}
</style>
