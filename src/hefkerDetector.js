const OFFER_KEYWORD_PATTERNS = [
  /\bhefker\b/i,
  /\bfree\b/i,
  /\bup for grabs\b/i,
  /\banyone (want|needs?)\b/i,
  /\bleftover(s)?\b/i,
  /\bextra food\b/i,
  /\bcome take\b/i,
  /\bfood available\b/i,
  /מי רוצה/,
  /הפקר/,
  /חינם/,
  /יש אוכל/,
  /נשאר/,
  /עודף/,
  /מי לוקח/,
];

const OFFER_INTENT_PATTERNS = [
  /\bi have\b/i,
  /\bwe have\b/i,
  /\bthere is\b/i,
  /\bleft in\b/i,
  /\bcome take\b/i,
  /\bavailable\b/i,
  /יש לי/,
  /נשאר לי/,
  /נשאר אצלי/,
  /יש פה/,
  /מוכן למסירה/,
  /לבוא לקחת/,
];

const REQUEST_PATTERNS = [
  /\blooking for\b/i,
  /\bdoes anyone have\b/i,
  /\banyone have\b/i,
  /\bcan i get\b/i,
  /\bi need\b/i,
  /\bneed food\b/i,
  /\bwho has\b/i,
  /\bany free food\b/i,
  /\bwhere can i get\b/i,
  /מחפש/,
  /מחפשת/,
  /צריך אוכל/,
  /צריכה אוכל/,
  /יש למישהו/,
  /אפשר לקבל/,
  /מי יכול להביא/,
  /anyone\?/i,
  /help me find/i,
  /where.*food/i,
  /יש מצב/,
  /אפשר למצוא/,
  /למישהו יש/,
];

const TAKEN_PATTERNS = [
  /\btaken\b/i,
  /\bclaimed\b/i,
  /\bgone\b/i,
  /\bno longer available\b/i,
  /\balready taken\b/i,
  /נתפס/,
  /נלקח/,
  /כבר אין/,
  /לא רלוונטי/,
  /נגמר/,
  /אזל/,
];

const normalizeText = (text) => {
  return String(text || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
};

const analyzeHefkerMessage = (rawText) => {
  const text = normalizeText(rawText);

  if (!text) {
    return { isHefker: false, reason: "empty_message" };
  }

  // User requirement: any message with a question mark is treated as a request/question.
  if (text.includes("?") || text.includes("؟") || text.includes("？")) {
    return { isHefker: false, reason: "question_message_signal" };
  }

  const hasTakenSignal = TAKEN_PATTERNS.some((pattern) => pattern.test(text));
  if (hasTakenSignal) {
    return { isHefker: false, reason: "already_taken_signal" };
  }

  const hasOfferKeyword = OFFER_KEYWORD_PATTERNS.some((pattern) => pattern.test(text));
  if (!hasOfferKeyword) {
    return { isHefker: false, reason: "no_hefker_signal" };
  }

  const hasOfferIntent = OFFER_INTENT_PATTERNS.some((pattern) => pattern.test(text));
  const hasRequestSignal = REQUEST_PATTERNS.some((pattern) => pattern.test(text));

  // If someone asks for free food, skip (protect against false-claims).
  if (hasRequestSignal) {
    return { isHefker: false, reason: "request_for_food_signal" };
  }

  return { isHefker: true, reason: "hefker_detected" };
};

module.exports = { analyzeHefkerMessage };
