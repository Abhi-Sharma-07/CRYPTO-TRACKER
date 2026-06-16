const EMAILJS_SERVICE_ID =
  process.env.REACT_APP_EMAILJS_SERVICE_ID || "SERVICE_ID";
const EMAILJS_TEMPLATE_ID =
  process.env.REACT_APP_EMAILJS_TEMPLATE_ID || "TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY =
  process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY";

const OWNER_EMAIL = process.env.REACT_APP_OWNER_NOTIFICATION_EMAIL || "";

const isPlaceholder = (value, placeholder) => {
  if (!value) return true;
  const val = value.trim().toLowerCase();
  return (
    val === "" ||
    val === placeholder.toLowerCase() ||
    val.includes("placeholder") ||
    val.includes("your_")
  );
};

export const hasEmailJsConfig = () =>
  !(
    isPlaceholder(EMAILJS_SERVICE_ID, "SERVICE_ID") ||
    isPlaceholder(EMAILJS_TEMPLATE_ID, "TEMPLATE_ID") ||
    isPlaceholder(EMAILJS_PUBLIC_KEY, "YOUR_PUBLIC_KEY")
  );

const sendViaEmailJs = async (templateParams) => {
  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: templateParams,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EmailJS failed: ${response.status} ${errorText}`);
  }
};

export const sendOwnerNotification = async ({ type, userEmail }) => {
  const promises = [];

  // 1. EmailJS Notification
  if (hasEmailJsConfig()) {
    const templateParams = {
      to_email: OWNER_EMAIL || "abhisharmawork07@gmail.com",
      user_email: userEmail,
      from_email: userEmail,
      sender_email: userEmail,
      reply_to: userEmail,
      from_name: "App User",
      sender_name: "App User",
      event_type: type,
      event_time: new Date().toISOString(),
    };
    promises.push(
      sendViaEmailJs(templateParams).catch((err) =>
        console.error("EmailJS notification failed:", err)
      )
    );
  }

  // 2. Discord Webhook Notification
  const discordUrl = process.env.REACT_APP_DISCORD_WEBHOOK_URL;
  if (discordUrl && !discordUrl.includes("your_discord_webhook") && !discordUrl.includes("placeholder")) {
    const discordBody = {
      embeds: [
        {
          title: `🔐 Auth Event: ${type.toUpperCase()}`,
          color: type.includes("login") ? 5763719 : 15548997, // Green-ish (5763719) for login, Red-ish (15548997) for signup
          fields: [
            {
              name: "User Email",
              value: userEmail,
              inline: true,
            },
            {
              name: "Event Type",
              value: type,
              inline: true,
            },
            {
              name: "Time",
              value: new Date().toLocaleString(),
              inline: false,
            },
            {
              name: "User Agent",
              value: navigator.userAgent || "Unknown",
              inline: false,
            },
          ],
          footer: {
            text: "Crypto Tracker Security Bot",
          },
        },
      ],
    };
    promises.push(
      fetch(discordUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordBody),
      }).catch((err) => console.error("Discord Webhook notification failed:", err))
    );
  }

  // 3. Telegram Bot Notification
  const telegramToken = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.REACT_APP_TELEGRAM_CHAT_ID;
  if (
    telegramToken &&
    telegramChatId &&
    !telegramToken.includes("your_telegram_bot") &&
    !telegramToken.includes("placeholder")
  ) {
    const escapedEmail = userEmail.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&");
    const escapedType = type.toUpperCase().replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&");
    const message = `🔐 *Auth Event:* ${escapedType}\n*User:* ${escapedEmail}\n*Time:* ${new Date().toLocaleString().replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&")}`;
    const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    promises.push(
      fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: "MarkdownV2",
        }),
      }).catch((err) => console.error("Telegram notification failed:", err))
    );
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }
};

export const sendContactMessage = async ({
  name,
  email,
  subject,
  message,
}) => {
  if (!hasEmailJsConfig()) {
    throw new Error(
      "EmailJS is not configured. Set REACT_APP_EMAILJS_SERVICE_ID, REACT_APP_EMAILJS_TEMPLATE_ID, and REACT_APP_EMAILJS_PUBLIC_KEY in .env."
    );
  }

  const templateParams = {
    to_email: OWNER_EMAIL,
    from_name: name,
    sender_name: name,
    from_email: email,
    sender_email: email,
    user_email: email,
    reply_to: email,
    subject,
    message,
  };

  await sendViaEmailJs(templateParams);
};
