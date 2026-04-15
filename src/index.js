const { config } = require("./config");
const { logger } = require("./logger");
const { StateStore } = require("./stateStore");
const { MessageProcessor } = require("./messageProcessor");
const { WhatsappBot } = require("./whatsappClient");

const stateStore = new StateStore(config.stateFilePath);
stateStore.load();

let enabled = config.botEnabledOnStart;

const setEnabled = (value) => {
  enabled = Boolean(value);
  logger.info("Bot state changed", { enabled });
};

const messageProcessor = new MessageProcessor({
  stateStore,
  logger,
  claimedText: config.claimedResponseText,
  isEnabled: () => enabled,
  setEnabled,
  debugLogs: config.debugLogs,
});

const bot = new WhatsappBot({
  config,
  logger,
  messageProcessor,
});

const setupCliToggle = () => {
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    const command = String(chunk || "").trim().toLowerCase();

    if (command === "on") {
      setEnabled(true);
      return;
    }

    if (command === "off") {
      setEnabled(false);
      return;
    }

    if (command === "status") {
      logger.info("Current bot status", { enabled });
      return;
    }

    if (command === "help") {
      logger.info("CLI commands: on | off | status | help");
      return;
    }
  });
};

const main = async () => {
  logger.info("Starting Hefker bot", {
    targetGroupName: config.targetGroupName || "(not set)",
    enabled,
  });

  setupCliToggle();
  await bot.start();
};

main().catch((error) => {
  logger.error("Fatal startup error", { error: error.message });
  process.exit(1);
});
