import toast from 'react-hot-toast';

/**
 * Display an error notification
 * @param {string} message - Error message to display
 * @param {Object} options - Additional toast options
 */
export const showError = (message, options = {}) => {
    return toast.error(message, {
        duration: 5000,
        position: 'top-right',
        ...options,
    });
};

/**
 * Display a success notification
 * @param {string} message - Success message to display
 * @param {Object} options - Additional toast options
 */
export const showSuccess = (message, options = {}) => {
    return toast.success(message, {
        duration: 4000,
        position: 'top-right',
        ...options,
    });
};

/**
 * Display a warning notification
 * @param {string} message - Warning message to display
 * @param {Object} options - Additional toast options
 */
export const showWarning = (message, options = {}) => {
    return toast(message, {
        duration: 4500,
        position: 'top-right',
        icon: '⚠️',
        ...options,
    });
};

/**
 * Display an info notification
 * @param {string} message - Info message to display
 * @param {Object} options - Additional toast options
 */
export const showInfo = (message, options = {}) => {
    return toast(message, {
        duration: 4000,
        position: 'top-right',
        icon: 'ℹ️',
        ...options,
    });
};

/**
 * Handle API errors and display appropriate toast notifications
 * @param {Error} error - Error object from API call
 * @param {string} fallbackMessage - Fallback message if error doesn't have one
 */
export const handleApiError = (error, fallbackMessage = 'An error occurred. Please try again.') => {
    // Extract error message from various error response formats
    const errorResponse = error?.response?.data;
    const errorMessage =
        errorResponse?.message ||
        errorResponse?.error ||
        error?.message ||
        fallbackMessage;

    // Log error for debugging
    console.error('API Error:', {
        message: errorMessage,
        status: error?.response?.status,
        response: errorResponse,
        error,
    });

    return showError(errorMessage);
};

/**
 * Display a loading toast and return a function to dismiss it
 * @param {string} message - Loading message to display
 * @returns {Function} Function to dismiss the loading toast
 */
export const showLoading = (message = 'Loading...') => {
    const toastId = toast.loading(message, {
        position: 'top-right',
    });

    return () => toast.dismiss(toastId);
};

/**
 * Show a promise toast that updates based on promise state
 * @param {Promise} promise - Promise to track
 * @param {Object} messages - Messages for loading, success, and error states
 */
export const showPromise = (promise, messages = {}) => {
    return toast.promise(
        promise,
        {
            loading: messages.loading || 'Loading...',
            success: messages.success || 'Success!',
            error: messages.error || 'Something went wrong',
        },
        {
            position: 'top-right',
        }
    );
};
