// src/utils/platform.js
export const platform = {
  datetime: {
    format: (date, formatStr, timezone) => {
      const d = new Date(date);
      const pad = (n) => String(n).padStart(2, '0');
      const YYYY = d.getUTCFullYear();
      const MM = pad(d.getUTCMonth() + 1);
      const DD = pad(d.getUTCDate());
      const HH = pad(d.getUTCHours());
      const mm = pad(d.getUTCMinutes());
      const ss = pad(d.getUTCSeconds());
      
      if (formatStr === 'DD MMM YYYY HH:mm:ss') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${DD} ${months[d.getUTCMonth()]} ${YYYY} ${HH}:${mm}:${ss}`;
      }
      return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
    }
  }
};

export default platform;
