require("dotenv").config();

module.exports = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  binance: {
    apiUrl: process.env.BINANCE_API_URL,
  },
  trading: {
    symbols: process.env.SYMBOLS.split(","),
    timeframe: process.env.TIMEFRAME,
    interval: parseInt(process.env.INTERVAL),
  },
  indicators: {
    bb: {
      period: parseInt(process.env.BB_PERIOD),
      multiplier: parseInt(process.env.BB_MULTIPLIER),
    },
    rsi: {
      period: parseInt(process.env.RSI_PERIOD),
      oversold: parseInt(process.env.RSI_OVERSOLD),
      overbought: parseInt(process.env.RSI_OVERBOUGHT),
    },
    volume: {
      period: parseInt(process.env.VOLUME_PERIOD),
      multiplier: parseFloat(process.env.VOLUME_MULTIPLIER),
    },
    ema: {
      short: parseInt(process.env.EMA_SHORT),
      long: parseInt(process.env.EMA_LONG),
    },
  },
};
