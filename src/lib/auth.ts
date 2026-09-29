import { createHmac, timingSafeEqual } from "node:crypto";
import type { Participant } from "@/lib/db";

type JsonObject = Record<string, unknown>;
type TenantConfig = { secretsHex: string[] };

export class AuthError extends Error {}

function encode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function decodeJson(value: string): JsonObject {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as JsonObject;
  } catch {
    throw new AuthError("Jeton mal formé.");
  }
}

function signature(input: string, secret: Buffer) {
  return createHmac("sha256", secret).update(input).digest();
}

function secretFromHex(value: string, label: string) {
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new AuthError(`${label} doit contenir 64 caractères hexadécimaux.`);
  return Buffer.from(value, "hex");
}

function tenantConfigs(): Record<string, TenantConfig> {
  const raw = process.env.RETRO_TENANTS_JSON;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, { secretHex?: string; secretsHex?: string[] }>;
    return Object.fromEntries(Object.entries(parsed).map(([id, config]) => [id, {
      secretsHex: config.secretsHex ?? (config.secretHex ? [config.secretHex] : []),
    }]));
  } catch {
    throw new AuthError("RETRO_TENANTS_JSON est invalide.");
  }
}

function parseJwt(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new AuthError("Jeton mal formé.");
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decodeJson(headerPart);
  if (header.alg !== "HS256" || header.typ !== "JWT") throw new AuthError("Algorithme JWT refusé.");
  return { headerPart, payloadPart, signaturePart, payload: decodeJson(payloadPart) };
}

function verifyWithSecrets(token: string, secretsHex: string[]) {
  const parsed = parseJwt(token);
  const received = Buffer.from(parsed.signaturePart, "base64url");
  const input = `${parsed.headerPart}.${parsed.payloadPart}`;
  const valid = secretsHex.some((item) => {
    const expected = signature(input, secretFromHex(item, "Secret tenant"));
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
  if (!valid) throw new AuthError("Signature JWT invalide.");
  return parsed.payload;
}

function requireText(payload: JsonObject, field: string, maxLength: number) {
  const value = payload[field];
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new AuthError(`Champ ${field} invalide.`);
  }
  return value.trim();
}

function validateTimes(payload: JsonObject, maxLifetimeSeconds: number) {
  const iat = payload.iat;
  const exp = payload.exp;
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(iat) || !Number.isInteger(exp)) throw new AuthError("Dates JWT invalides.");
  if ((iat as number) > now + 30 || (exp as number) <= now) throw new AuthError("Jeton expiré ou émis dans le futur.");
  if ((exp as number) - (iat as number) > maxLifetimeSeconds) throw new AuthError("Durée du jeton excessive.");
}

export type EntryIdentity = {
  tenantId: string;
  userId: string;
  firstName: string;
  lastInitial: string;
};

export function verifyEntryToken(token: string): EntryIdentity {
  // Le cid non vérifié sert uniquement à sélectionner le secret, jamais à autoriser l'utilisateur.
  const unverified = parseJwt(token).payload;
  const candidateTenant = requireText(unverified, "cid", 80);
  const config = tenantConfigs()[candidateTenant];
  if (!config?.secretsHex.length) throw new AuthError("Tenant inconnu.");
  const payload = verifyWithSecrets(token, config.secretsHex);
  const tenantId = requireText(payload, "cid", 80);
  if (tenantId !== candidateTenant) throw new AuthError("Tenant signé incohérent.");
  validateTimes(payload, 300);
  return {
    tenantId,
    userId: requireText(payload, "uid", 100),
    firstName: requireText(payload, "prenom", 40),
    lastInitial: requireText(payload, "initNom", 4).slice(0, 1).toLocaleUpperCase("fr-FR"),
  };
}

function sessionSecret() {
  const value = process.env.SESSION_SECRET_HEX;
  if (!value) {
    if (process.env.NODE_ENV === "production") throw new AuthError("SESSION_SECRET_HEX est absent.");
    return Buffer.from("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "hex");
  }
  return secretFromHex(value, "SESSION_SECRET_HEX");
}

export function createSessionToken(identity: EntryIdentity) {
  const now = Math.floor(Date.now() / 1000);
  const headerPart = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadPart = encode(JSON.stringify({
    cid: identity.tenantId,
    uid: identity.userId,
    name: `${identity.firstName} ${identity.lastInitial}.`,
    iat: now,
    exp: now + 12 * 60 * 60,
  }));
  const input = `${headerPart}.${payloadPart}`;
  return `${input}.${encode(signature(input, sessionSecret()))}`;
}

export function verifySessionToken(token: string): Participant {
  const parsed = parseJwt(token);
  const received = Buffer.from(parsed.signaturePart, "base64url");
  const expected = signature(`${parsed.headerPart}.${parsed.payloadPart}`, sessionSecret());
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new AuthError("Session invalide.");
  }
  validateTimes(parsed.payload, 12 * 60 * 60);
  return {
    tenantId: requireText(parsed.payload, "cid", 80),
    id: requireText(parsed.payload, "uid", 100),
    name: requireText(parsed.payload, "name", 50),
  };
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : null;
}

export function resolveParticipant(request: Request, localName: unknown): Participant {
  const session = bearerToken(request);
  if (session) return verifySessionToken(session);

  const headerId = request.headers.get("x-intranet-user-id")?.trim();
  const headerName = request.headers.get("x-intranet-user-name")?.trim();
  if (headerId || headerName) {
    if (!headerId || !headerName) throw new AuthError("Identité gateway incomplète.");
    return {
      tenantId: process.env.INTRANET_TENANT_ID ?? "primetime",
      id: headerId.slice(0, 100),
      name: headerName.slice(0, 40),
    };
  }

  const allowDevIdentity = process.env.ALLOW_DEV_IDENTITY === "true" || process.env.NODE_ENV !== "production";
  if (!allowDevIdentity) throw new AuthError("Session intranet absente.");
  const name = typeof localName === "string" ? localName.trim().slice(0, 40) : "";
  if (!name) throw new AuthError("Un prénom ou pseudo local est requis.");
  return { tenantId: "local", id: `dev:${name.toLocaleLowerCase("fr-FR")}`, name };
}

export function resolveTenant(request: Request) {
  const session = bearerToken(request);
  if (session) return verifySessionToken(session).tenantId;
  if (request.headers.get("x-intranet-user-id")) return process.env.INTRANET_TENANT_ID ?? "primetime";
  return "local";
}
