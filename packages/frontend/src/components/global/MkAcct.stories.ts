/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkAcct from './MkAcct.vue';
const meta = {
	title: 'components/global/MkAcct',
	component: MkAcct,
} satisfies Meta<typeof MkAcct>;
export const Default = {
	render(args) {
		return {
			components: {
				MkAcct,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkAcct v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAcct>;
export default meta;
