const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERU_PHONE_RE = /^\d{9}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;
const NAME_MAX = 100;

module.exports = { EMAIL_RE, PERU_PHONE_RE, PASSWORD_RE, NAME_MAX };
