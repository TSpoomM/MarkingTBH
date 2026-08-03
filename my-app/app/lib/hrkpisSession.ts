// Reads hrkpis's own PHP session (file-based, C:\xampp\tmp\sess_<id>) so this app
// can recognize a user who is already logged into hrkpis, without a separate login.
import { readFile, stat } from "fs/promises";
import path from "path";

const SESSION_COOKIE_NAME = process.env.PHP_SESSION_COOKIE_NAME || "PHPSESSID";
const SESSION_SAVE_PATH = process.env.PHP_SESSION_SAVE_PATH || "C:\\xampp\\tmp";
const SESSION_MAX_AGE_SECONDS = Number(process.env.PHP_SESSION_MAX_AGE_SECONDS) || 1440;

// PHP session ids only ever contain this character set (session.sid_bits_per_character=6 default).
// Validating against it before building a filesystem path also rules out path traversal.
const VALID_SESSION_ID = /^[a-zA-Z0-9,-]{1,128}$/;

export type HrkpisSession = {
  userId: string;
  empId: string;
  userInv: string;
  imgProfile?: string;
  yearAssessment?: string;
};

type PhpValue = string | number | boolean | null | PhpValueRecord;
interface PhpValueRecord {
  [key: string]: PhpValue;
}

function parsePhpValue(raw: string, pos: number): [PhpValue, number] {
  const type = raw[pos];

  if (type === "s") {
    const colon = raw.indexOf(":", pos + 2);
    const len = parseInt(raw.slice(pos + 2, colon), 10);
    const dataStart = colon + 2; // skip ':"'
    const data = raw.slice(dataStart, dataStart + len);
    return [data, dataStart + len + 2]; // skip closing '";'
  }
  if (type === "i") {
    const semi = raw.indexOf(";", pos);
    return [parseInt(raw.slice(pos + 2, semi), 10), semi + 1];
  }
  if (type === "d") {
    const semi = raw.indexOf(";", pos);
    return [parseFloat(raw.slice(pos + 2, semi)), semi + 1];
  }
  if (type === "b") {
    const semi = raw.indexOf(";", pos);
    return [raw.slice(pos + 2, semi) === "1", semi + 1];
  }
  if (type === "N") {
    return [null, pos + 2]; // 'N;'
  }
  if (type === "a") {
    const colon = raw.indexOf(":", pos + 2);
    const count = parseInt(raw.slice(pos + 2, colon), 10);
    let cursor = colon + 2; // skip ':{'
    const result: Record<string, PhpValue> = {};
    for (let i = 0; i < count; i++) {
      const [key, keyEnd] = parsePhpValue(raw, cursor);
      cursor = keyEnd;
      const [value, valueEnd] = parsePhpValue(raw, cursor);
      cursor = valueEnd;
      result[String(key)] = value;
    }
    return [result, cursor + 1]; // skip closing '}'
  }

  throw new Error(`Unsupported PHP serialize type: ${type}`);
}

function parsePhpSessionData(raw: string): Record<string, PhpValue> {
  const result: Record<string, PhpValue> = {};
  let pos = 0;
  while (pos < raw.length) {
    const bar = raw.indexOf("|", pos);
    if (bar === -1) break;
    const key = raw.slice(pos, bar);
    const [value, nextPos] = parsePhpValue(raw, bar + 1);
    result[key] = value;
    pos = nextPos;
  }
  return result;
}

function toStringOrUndefined(value: PhpValue | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  return String(value);
}

export async function readHrkpisSession(sessionId: string | undefined): Promise<HrkpisSession | null> {
  if (!sessionId || !VALID_SESSION_ID.test(sessionId)) return null;

  const filePath = path.join(SESSION_SAVE_PATH, `sess_${sessionId}`);

  let raw: string;
  try {
    const stats = await stat(filePath);
    const ageSeconds = (Date.now() - stats.mtimeMs) / 1000;
    if (ageSeconds > SESSION_MAX_AGE_SECONDS) return null;

    raw = await readFile(filePath, "utf8");
  } catch {
    return null;
  }

  let data: Record<string, PhpValue>;
  try {
    data = parsePhpSessionData(raw);
  } catch {
    return null;
  }

  const userId = toStringOrUndefined(data.userId);
  const empId = toStringOrUndefined(data.emp_id);
  const userInv = toStringOrUndefined(data.userInv);

  if (!userId || !empId || !userInv) return null;

  return {
    userId,
    empId,
    userInv,
    imgProfile: toStringOrUndefined(data.imgProfile),
    yearAssessment: toStringOrUndefined(data.year_assessment),
  };
}

export function getHrkpisSessionCookieName() {
  return SESSION_COOKIE_NAME;
}
