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
	line-height: 1.4em;
	background: var(--bg);
	padding: 32px;

	&:not(.wide).max-width_400px {
		padding: 32px 0;

		> ::v-deep(*) {
			._form_panel {
				border: solid 0.5px var(--divider);
				border-radius: 0;
				border-left: none;
				border-right: none;
			}

			._form_group {
				> * {
					&:not(:first-child) {
						&._form_panel, ._form_panel {
							border-top: none;
						}
					}

					&:not(:last-child) {
						&._form_panel, ._form_panel {
							border-bottom: solid 0.5px var(--divider);
						}
					}
				}
			}
		}
	}
}
</style>
