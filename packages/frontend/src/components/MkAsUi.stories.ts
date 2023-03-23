/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkAsUi from './MkAsUi.vue';
const meta = {
	title: 'components/MkAsUi',
	component: MkAsUi,
} satisfies Meta<typeof MkAsUi>;
export const Default = {
	render(args) {
		return {
			components: {
				MkAsUi,
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
			template: '<MkAsUi v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAsUi>;
export default meta;
