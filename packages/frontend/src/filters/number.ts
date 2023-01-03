import { numberFormat } from '@/scripts/intl-const';

export default n => n == null ? 'N/A' : numberFormat.format(n);
