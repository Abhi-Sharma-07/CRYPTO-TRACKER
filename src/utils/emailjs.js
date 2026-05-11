const EMAILJS_SERVICE_ID =
  process.env.REACT_APP_EMAILJS_SERVICE_ID || "SERVICE_ID";
const EMAILJS_TEMPLATE_ID =
  process.env.REACT_APP_EMAILJS_TEMPLATE_ID || "TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY =
  process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY";

const OWNER_EMAIL = process.env.REACT_APP_OWNER_NOTIFICATION_EMAIL || "";

const isPlaceholder = (value, placeholder) => value === placeholder;

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
  if (!hasEmailJsConfig()) {
    return;
  }

  const templateParams = {
    to_email: OWNER_EMAIL,
    user_email: userEmail,
    from_email: userEmail,
    sender_email: userEmail,
    reply_to: userEmail,
    from_name: "App User",
    sender_name: "App User",
    event_type: type,
    event_time: new Date().toISOString(),
  };

  await sendViaEmailJs(templateParams);
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
