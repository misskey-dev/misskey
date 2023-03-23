/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkDonation from './MkDonation.vue';
const meta = {
	title: 'components/MkDonation',
	component: MkDonation,
} satisfies Meta<typeof MkDonation>;
export const Default = {
	render(args) {
		return {
			components: {
				MkDonation,
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
			template: '<MkDonation v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDonation>;
export default meta;
