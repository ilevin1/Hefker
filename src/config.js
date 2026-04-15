const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase().trim());
};

const config = {
  targetGroupName: process.env.TARGET_GROUP_NAME || "",
  botEnabledOnStart: toBoolean(process.env.BOT_ENABLED, true),
  claimedResponseText: process.env.CLAIMED_RESPONSE_TEXT || "Claimed",
  stateFilePath: path.resolve(process.env.STATE_FILE_PATH || "./data/state.json"),
  whatsappAuthPath: path.resolve(process.env.WHATSAPP_AUTH_PATH || "./data/.wwebjs_auth"),
  puppeteerHeadless: toBoolean(process.env.PUPPETEER_HEADLESS, true),
  puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "",
  debugLogs: toBoolean(process.env.DEBUG_LOGS, false),
};

module.exports = { config };
