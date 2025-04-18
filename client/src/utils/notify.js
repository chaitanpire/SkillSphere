import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const notify = {
    success: (message) => toast.success(message),
    error: (message) => toast.error(message),
    info: (message) => toast.info(message),
    warning: (message) => toast.warning(message)
};