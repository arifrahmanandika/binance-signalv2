const axios = require("axios");

class TelegramNotifier {
  constructor(token, chatId) {
    this.token = token;
    this.chatId = chatId;
    this.apiUrl = `https://api.telegram.org/bot${token}`;
  }

  async sendMessage(message) {
    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: this.chatId,
        text: message,
        parse_mode: "HTML",
      });
      return response.data;
    } catch (error) {
      console.error("Telegram send message error:", error.message);
      return null;
    }
  }

  formatSignalMessage(symbol, signalData) {
    const { signals, trend, confidence } = signalData;

    if (signals.length === 0) return null;

    let message = `<b>🚨 TRADING SIGNAL ALERT</b>\n\n`;
    message += `<b>Pair:</b> ${symbol}\n`;
    message += `<b>Trend:</b> ${trend}\n`;
    message += `<b>Confidence:</b> ${confidence}\n\n`;

    signals.forEach((signal, index) => {
      const emoji =
        signal.type === "BUY" ? "🟢" : signal.type === "SELL" ? "🔴" : "📊";
      message += `${emoji} <b>Signal ${index + 1}:</b> ${signal.type}\n`;
      message += `   Reason: ${signal.reason}\n`;
      message += `   Strength: ${signal.strength}\n\n`;
    });

    message += `<i>Generated at ${new Date().toLocaleString("id-ID")}</i>`;

    return message;
  }
}

module.exports = TelegramNotifier;
