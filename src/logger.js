const formatNow = () => new Date().toISOString();

const write = (level, message, meta) => {
  if (meta !== undefined) {
    console.log(`[${formatNow()}] [${level}] ${message}`, meta);
    return;
  }

  console.log(`[${formatNow()}] [${level}] ${message}`);
};

const logger = {
  info: (message, meta) => write("INFO", message, meta),
  warn: (message, meta) => write("WARN", message, meta),
  error: (message, meta) => write("ERROR", message, meta),
  debug: (message, meta) => write("DEBUG", message, meta),
};

module.exports = { logger };
