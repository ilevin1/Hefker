const fs = require("fs");
const path = require("path");

class StateStore {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.maxProcessedIds = options.maxProcessedIds || 2000;
    this.state = {
      processedMessages: {},
    };
  }

  load() {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(this.filePath)) {
      this.persist();
      return;
    }

    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      this.state = JSON.parse(raw);
    } catch (_error) {
      this.state = { processedMessages: {} };
      this.persist();
    }
  }

  persist() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }

  hasProcessed(messageId) {
    return Boolean(this.state.processedMessages?.[messageId]);
  }

  markProcessed(messageId) {
    if (!this.state.processedMessages) {
      this.state.processedMessages = {};
    }

    this.state.processedMessages[messageId] = Date.now();
    this.prune();
    this.persist();
  }

  prune() {
    const entries = Object.entries(this.state.processedMessages || {});
    if (entries.length <= this.maxProcessedIds) {
      return;
    }

    entries.sort((a, b) => a[1] - b[1]);
    const toDeleteCount = entries.length - this.maxProcessedIds;
    for (let i = 0; i < toDeleteCount; i += 1) {
      delete this.state.processedMessages[entries[i][0]];
    }
  }
}

module.exports = { StateStore };
