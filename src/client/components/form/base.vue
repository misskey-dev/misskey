<template>
<div class="rbusrurv" :class="{ wide: forceWide }" v-size="{ max: [400] }">
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
	--formXPadding: 32px;
	--formYPadding: 32px;

	line-height: 1.3em;
	background: var(--bg);
	padding: var(--formYPadding) var(--formXPadding);

	&:not(.wide).max-width_400px {
		--formXPadding: 0px;

		> ::v-deep(*) {
			._formPanel {
				border: solid 0.5px var(--divider);
				border-radius: 0;
				border-left: none;
				border-right: none;
			}

			._form_group {
				> *:not(._formNoConcat) {
					&:not(:last-child):not(._formNoConcatPrev) {
						&._formPanel, ._formPanel {
							border-bottom: solid 0.5px var(--divider);
						}
					}

					&:not(:first-child):not(._formNoConcatNext) {
						&._formPanel, ._formPanel {
							border-top: none;
						}
					}
				}
			}
		}
	}
}
</style>
