import { $i } from '@/account';
import { popup } from '@/os';

export function promptLoginOrRedirect(path: string = '/') {
    if (!$i) {
        popup(import('@/components/signin-dialog.vue'), {
            autoSet: true
        }, {
            close: () => {
                window.location.href = path;
            },
        }, 'closed');
    }
}
