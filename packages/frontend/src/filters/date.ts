import { dateTimeFormat } from '@/scripts/intl-const';

export default (d: Date | number | undefined) => dateTimeFormat.format(d); 
export const dateString = (d: string) => dateTimeFormat.format(new Date(d));
