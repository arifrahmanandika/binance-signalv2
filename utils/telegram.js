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

  formatSignalMessage(symbol, signalData, currentPrice) {
    const { signals, trend } = signalData;

    if (signals.length === 0) return null;

    // Format harga dengan presisi yang sesuai
    let formattedPrice;
    if (currentPrice < 1) {
      // Untuk coin dengan harga kecil, tampilkan lebih banyak decimal
      formattedPrice = currentPrice.toFixed(6);
    } else if (currentPrice < 10) {
      formattedPrice = currentPrice.toFixed(4);
    } else {
      formattedPrice = currentPrice.toFixed(2);
    }

    let message = `<b>🚨 TRADING SIGNAL ALERT</b>\n\n`;
    message += `<b>Pair:</b> ${symbol}\n`;
    message += `<b>Price:</b> <code>${formattedPrice}</code>\n`; // Gunakan <code> untuk memudahkan copy
    message += `<b>Trend:</b> ${trend}\n`;

    signals.forEach((signal, index) => {
      const emoji =
        signal.type === "BUY" ? "🟩" : signal.type === "SELL" ? "🟥" : "📊";
      message += `${emoji} <b>Signal ${index + 1}:</b> ${signal.type}\n`;
      message += `   Reason: ${signal.reason}\n`;
      message += `   Strength: ${signal.strength}\n\n`;
    });

    message += `<i>Generated at ${new Date().toLocaleString("id-ID")}</i>`;

    return message;
  }
}

module.exports = TelegramNotifier;
