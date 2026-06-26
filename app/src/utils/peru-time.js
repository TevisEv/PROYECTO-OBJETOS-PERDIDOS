const TIME_ZONE = "America/Lima";

function todayLima() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

function formatDateLima(date) {
  return new Date(date).toLocaleDateString("es-PE", { timeZone: TIME_ZONE });
}

function isFutureLima(dateStr) {
  return dateStr > todayLima();
}

module.exports = { TIME_ZONE, todayLima, formatDateLima, isFutureLima };
