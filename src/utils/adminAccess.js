const ADMIN_EMAIL = (process.env.REACT_APP_ADMIN_EMAIL || "").toLowerCase();

export const isAdminUser = (user) => {
  const email = user?.email ? String(user.email).toLowerCase() : "";
  return Boolean(email) && email === ADMIN_EMAIL;
};

