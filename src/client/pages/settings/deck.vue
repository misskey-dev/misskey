<template>
<FormBase>

	<section class="_card _vMargin">
		<div class="_title"><Fa :icon="faColumns"/> </div>
		<div class="_content">
			<div>{{ $ts.defaultNavigationBehaviour }}</div>
			<MkSwitch v-model:value="navWindow">{{ $ts.openInWindow }}</MkSwitch>
		</div>
		<div class="_content">
			<MkSwitch v-model:value="alwaysShowMainColumn">
				{{ $ts._deck.alwaysShowMainColumn }}
			</MkSwitch>
		</div>
		<div class="_content">
			<div>{{ $ts._deck.columnAlign }}</div>
			<MkRadio v-model="columnAlign" value="left">{{ $ts.left }}</MkRadio>
			<MkRadio v-model="columnAlign" value="center">{{ $ts.center }}</MkRadio>
		</div>
	</section>

</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faImage, faCog, faColumns } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkSwitch from '@/components/ui/switch.vue';
import MkSelect from '@/components/ui/select.vue';
import MkRadio from '@/components/ui/radio.vue';
import MkRadios from '@/components/ui/radios.vue';
import MkRange from '@/components/ui/range.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormRadios from '@/components/form/radios.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import { deckStore } from '@/ui/deck/deck-store';

export default defineComponent({
	components: {
		MkButton,
		MkSwitch,
		MkSelect,
		MkRadio,
		MkRadios,
		MkRange,
		FormSwitch,
		FormSelect,
		FormRadios,
		FormBase,
		FormGroup,
	},

	emits: ['info'],

	data() {
		return {
			INFO: {
				title: this.$ts.deck,
				icon: faColumns
			},
			faImage, faCog,
		}
	},

	computed: {
		navWindow: deckStore.makeGetterSetter('navWindow'),
		alwaysShowMainColumn: deckStore.makeGetterSetter('alwaysShowMainColumn'),
		columnAlign: deckStore.makeGetterSetter('columnAlign'),
	},

	mounted() {
		this.$emit('info', this.INFO);
	},
});
</script>
