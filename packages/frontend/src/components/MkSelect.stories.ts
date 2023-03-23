/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkSelect from './MkSelect.vue';
const meta = {
	title: 'components/MkSelect',
	component: MkSelect,
} satisfies Meta<typeof MkSelect>;
export const Default = {
	render(args) {
		return {
			components: {
				MkSelect,
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
			template: '<MkSelect v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkSelect>;
export default meta;
