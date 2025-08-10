const isProduction = import.meta.env.PROD;

const log = (level, message, context = {}) => {
  if (isProduction && level === 'info') {
    return; // Do not log 'info' messages in production
  }

  const timestamp = new Date().toISOString();
  const logMessage = {
    timestamp,
    level,
    message,
    ...context
  };

  if (level === 'error') {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }
};

export const logger = {
  info: (message, context) => log('info', message, context),
  error: (message, context) => log('error', message, context)
};