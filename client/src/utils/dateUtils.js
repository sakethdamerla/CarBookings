import moment from 'moment';

/**
 * Converts any date to Indian Standard Time (UTC+5:30) and formats it.
 * @param {Date|String|Number} date - The date to format
 * @param {String} formatStr - Moment format string
 * @returns {String} Formatted IST date string
 */
export const formatIST = (date, formatStr = 'DD MMM, hh:mm A') => {
    if (!date) return 'N/A';
    // Force UTC then offset to IST
    return moment.utc(date).utcOffset("+05:30").format(formatStr);
};

/**
 * Returns a moment object currently set to IST.
 * @param {Date|String|Number} date - Optional date to wrap
 * @returns {Object} Moment object in IST
 */
export const getIST = (date) => {
    return moment.utc(date || new Date()).utcOffset("+05:30");
};
