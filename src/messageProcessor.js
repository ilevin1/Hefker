const { analyzeHefkerMessage } = require("./hefkerDetector");

class MessageProcessor {
  constructor({ stateStore, logger, claimedText, isEnabled, setEnabled, debugLogs }) {
    this.stateStore = stateStore;
    this.logger = logger;
    this.claimedText = claimedText;
    this.isEnabled = isEnabled;
    this.setEnabled = setEnabled;
    this.debugLogs = debugLogs;
  }

  async processMessage(message) {
    const messageId = message?.id?._serialized;
    if (!messageId) {
      this.logger.warn("Skipping message with no ID");
      return;
    }

    if (message.fromMe) {
      return;
    }

    const body = message.body || "";

    if (this.handleToggleCommand(body, message)) {
      return;
    }

    if (!this.isEnabled()) {
      if (this.debugLogs) {
        this.logger.debug("Skipping incoming message because bot is disabled", { messageId });
      }
      return;
    }

    if (this.stateStore.hasProcessed(messageId)) {
      if (this.debugLogs) {
        this.logger.debug("Skipping already-processed message", { messageId });
      }
      return;
    }

    const analysis = analyzeHefkerMessage(body);
    this.logger.info("Message analyzed", {
      messageId,
      reason: analysis.reason,
      text: body,
    });

    if (!analysis.isHefker) {
      return;
    }

    try {
      await message.reply(this.claimedText);
      this.stateStore.markProcessed(messageId);
      this.logger.info("Replied to hefker message", { messageId });
    } catch (error) {
      this.logger.error("Failed to send reply", {
        messageId,
        error: error.message,
      });
    }
  }

  handleToggleCommand(body, message) {
    if (!message.fromMe) {
      return false;
    }

    const command = String(body || "").trim().toLowerCase();
    if (command === "!bot on") {
      this.setEnabled(true);
      this.logger.info("Bot enabled via WhatsApp command");
      return true;
    }

    if (command === "!bot off") {
      this.setEnabled(false);
      this.logger.info("Bot disabled via WhatsApp command");
      return true;
    }

    if (command === "!bot status") {
      this.logger.info("Bot status requested", { enabled: this.isEnabled() });
      return true;
    }

    return false;
  }
}

module.exports = { MessageProcessor };
