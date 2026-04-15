const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const puppeteer = require("puppeteer");

class WhatsappBot {
  constructor({ config, logger, messageProcessor }) {
    this.config = config;
    this.logger = logger;
    this.messageProcessor = messageProcessor;
    this.targetGroupId = null;
    this.lastTargetLookupAt = 0;
    this.hasLoggedAuthenticated = false;
    this.hasLoggedGroupSuggestions = false;

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: this.config.whatsappAuthPath,
      }),
      puppeteer: this.buildPuppeteerConfig(),
    });
  }

  buildPuppeteerConfig() {
    const executablePath =
      this.config.puppeteerExecutablePath ||
      (typeof puppeteer.executablePath === "function" ? puppeteer.executablePath() : undefined);

    return {
      headless: this.config.puppeteerHeadless,
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };
  }

  async start() {
    this.attachCoreEventHandlers();
    await this.client.initialize();
  }

  attachCoreEventHandlers() {
    this.client.on("qr", (qr) => {
      this.logger.info("Scan this QR code once to authenticate");
      qrcode.generate(qr, { small: true });
    });

    this.client.on("authenticated", () => {
      if (this.hasLoggedAuthenticated) {
        return;
      }

      this.hasLoggedAuthenticated = true;
      this.logger.info("WhatsApp authenticated");
    });

    this.client.on("ready", async () => {
      this.logger.info("WhatsApp client is ready");
      await this.resolveTargetGroupId(true);
      this.startTargetGroupRetryLoop();
    });

    this.client.on("message", async (message) => {
      try {
        const isTargetGroupMessage = await this.isTargetGroupMessage(message);
        if (!isTargetGroupMessage) {
          return;
        }

        await this.messageProcessor.processMessage(message);
      } catch (error) {
        this.logger.error("Error handling message event", { error: error.message });
      }
    });

    this.client.on("auth_failure", (message) => {
      this.logger.error("Authentication failed", { message });
    });

    this.client.on("disconnected", (reason) => {
      this.logger.warn("WhatsApp client disconnected", { reason });
    });
  }

  async isTargetGroupMessage(message) {
    if (!this.targetGroupId) {
      await this.resolveTargetGroupId();
    }

    if (!this.targetGroupId && this.isGroupJid(message.from)) {
      await this.tryResolveTargetFromIncomingMessage(message);
    }

    if (!this.targetGroupId) {
      return false;
    }

    return message.from === this.targetGroupId;
  }

  async resolveTargetGroupId(force = false) {
    const now = Date.now();
    if (!force && now - this.lastTargetLookupAt < 30000) {
      return;
    }

    this.lastTargetLookupAt = now;

    if (!this.config.targetGroupName) {
      this.logger.warn("TARGET_GROUP_NAME is empty. Set it in .env");
      return;
    }

    try {
      const chats = await this.client.getChats();
      const groupChats = chats.filter((chat) => chat.isGroup);
      const target = this.findTargetGroup(groupChats);

      if (!target) {
        this.logger.warn("Target group not found yet", {
          targetGroupName: this.config.targetGroupName,
        });
        this.logGroupSuggestions(groupChats);
        return;
      }

      this.targetGroupId = target.id._serialized;
      this.logger.info("Target group resolved", {
        targetGroupName: target.name,
        targetGroupId: this.targetGroupId,
      });
    } catch (error) {
      this.logger.error("Failed resolving target group", { error: error.message });
    }
  }

  startTargetGroupRetryLoop() {
    if (this.targetGroupRetryInterval) {
      return;
    }

    this.targetGroupRetryInterval = setInterval(async () => {
      if (this.targetGroupId) {
        clearInterval(this.targetGroupRetryInterval);
        this.targetGroupRetryInterval = null;
        return;
      }

      await this.resolveTargetGroupId(true);
    }, 15000);
  }

  normalizeGroupName(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  findTargetGroup(groupChats) {
    const desired = this.normalizeGroupName(this.config.targetGroupName);
    if (!desired) {
      return null;
    }

    const exact = groupChats.find((chat) => this.normalizeGroupName(chat.name) === desired);
    if (exact) {
      return exact;
    }

    const partialMatches = groupChats.filter((chat) => {
      const current = this.normalizeGroupName(chat.name);
      return current.includes(desired) || desired.includes(current);
    });

    if (partialMatches.length === 1) {
      return partialMatches[0];
    }

    return null;
  }

  logGroupSuggestions(groupChats) {
    if (this.hasLoggedGroupSuggestions) {
      return;
    }

    const preview = groupChats.slice(0, 25).map((chat) => chat.name);
    this.logger.info("Available group names preview", {
      count: groupChats.length,
      names: preview,
    });
    this.hasLoggedGroupSuggestions = true;
  }

  isGroupJid(jid) {
    return String(jid || "").endsWith("@g.us");
  }

  async tryResolveTargetFromIncomingMessage(message) {
    try {
      const chat = await message.getChat();
      if (!chat?.isGroup) {
        return;
      }

      const desired = this.normalizeGroupName(this.config.targetGroupName);
      const current = this.normalizeGroupName(chat.name);
      if (!desired || desired !== current) {
        return;
      }

      this.targetGroupId = chat.id._serialized;
      this.logger.info("Target group resolved from incoming message", {
        targetGroupName: chat.name,
        targetGroupId: this.targetGroupId,
      });
    } catch (error) {
      this.logger.error("Failed resolving target from message", { error: error.message });
    }
  }
}

module.exports = { WhatsappBot };
