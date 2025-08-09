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
    const { signals, trend, volumeAlert } = signalData;

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

    const iconTrend =
      trend === "UPTREND" ? "🔼↗" : trend === "DOWNTREND" ? "🔽↙" : "➡️";
    let message = `<b>🚨 SIGNAL ALERT</b>\n\n`;
    message += `<b>Pair:</b> ${symbol}\n`;
    message += `<b>Price:</b> <code>${formattedPrice}</code>\n`;
    message += `<b>Trend:</b> ${trend}\n ${iconTrend}\n\n`;

    signals.forEach((signal, index) => {
      const emoji =
        signal.type === "BUY" ? "🟩⬆" : signal.type === "SELL" ? "🟥⬇" : "📊";
      message += ` <b>Signal ${index + 1}:</b> ${signal.type} ${emoji}\n`;
      message += `   Reason: ${signal.reason}\n`;
      message += `   Strength: ${signal.strength}\n`;
      message += `   <b>Volume:</b> ${volumeAlert}\n\n`;
    });

    message += `<i>🕒 ${new Date().toLocaleString("id-ID")}</i>`;

    return message;
  }
}

module.exports = TelegramNotifier;
