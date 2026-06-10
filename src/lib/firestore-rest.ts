/**
 * Firestore REST API helper module.
 * Replaces firebase-admin SDK which fails to load on Vercel's serverless environment.
 * Uses the Firestore REST API v1 to perform CRUD operations on documents.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "youth-research-50cd9";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

console.log("Firestore REST: API Key available:", !!FIREBASE_API_KEY, "| Project ID:", PROJECT_ID);

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ---- Type helpers for Firestore REST value encoding/decoding ----

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  nullValue?: null;
  mapValue?: { fields: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
}

interface FirestoreDocument {
  name?: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

/**
 * Encode a JS value into a Firestore REST value object.
 */
function encodeValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === "string") {
    return { stringValue: value };
  }
  if (typeof value === "boolean") {
    return { booleanValue: value };
  }
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return { integerValue: String(value) };
    }
    return { doubleValue: value };
  }
  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeValue) } };
  }
  if (typeof value === "object") {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = encodeValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

/**
 * Decode a Firestore REST value object into a plain JS value.
 */
function decodeValue(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return value.timestampValue;
  if ("mapValue" in value && value.mapValue?.fields) {
    return decodeFields(value.mapValue.fields);
  }
  if ("arrayValue" in value && value.arrayValue?.values) {
    return value.arrayValue.values.map(decodeValue);
  }
  return null;
}

/**
 * Decode a Firestore fields object into a plain JS object.
 */
function decodeFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    result[key] = decodeValue(val);
  }
  return result;
}

// ---- Public API ----

/**
 * Get a single document by collection and document ID.
 * Returns null if the document does not exist.
 */
export async function getDocument(
  collection: string,
  docId: string
): Promise<{ exists: boolean; data: Record<string, unknown> | null }> {
  const url = `${BASE_URL}/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url);

  if (res.status === 404) {
    return { exists: false, data: null };
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Firestore REST GET failed (${res.status}): ${errBody}`);
  }

  const doc: FirestoreDocument = await res.json();
  return {
    exists: true,
    data: doc.fields ? decodeFields(doc.fields) : {},
  };
}

/**
 * Create or overwrite a document with a specific ID.
 */
export async function setDocument(
  collection: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const url = `${BASE_URL}/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, val] of Object.entries(data)) {
    fields[key] = encodeValue(val);
  }

  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Firestore REST SET failed (${res.status}): ${errBody}`);
  }
}

/**
 * Update specific fields of a document (merge semantics).
 * Only the specified fields are overwritten; other fields remain unchanged.
 */
export async function updateDocument(
  collection: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const fieldMask = Object.keys(data)
    .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
    .join("&");

  const url = `${BASE_URL}/${collection}/${docId}?${fieldMask}&key=${FIREBASE_API_KEY}`;

  const fields: Record<string, FirestoreValue> = {};
  for (const [key, val] of Object.entries(data)) {
    fields[key] = encodeValue(val);
  }

  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Firestore REST UPDATE failed (${res.status}): ${errBody}`);
  }
}

/**
 * Query a collection for documents matching a field filter.
 * Returns an array of { id, data } objects.
 */
export async function queryCollection(
  collection: string,
  fieldPath: string,
  op: "EQUAL" | "NOT_EQUAL" | "LESS_THAN" | "GREATER_THAN",
  value: unknown,
  limit?: number
): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`;

  const structuredQuery: Record<string, unknown> = {
    from: [{ collectionId: collection }],
    where: {
      fieldFilter: {
        field: { fieldPath },
        op,
        value: encodeValue(value),
      },
    },
  };

  if (limit) {
    structuredQuery.limit = limit;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Firestore REST QUERY failed (${res.status}): ${errBody}`);
  }

  const results: Array<{ document?: FirestoreDocument; readTime?: string }> = await res.json();

  const docs: Array<{ id: string; data: Record<string, unknown> }> = [];
  for (const result of results) {
    if (result.document) {
      // Extract document ID from the full name path
      const nameParts = result.document.name!.split("/");
      const id = nameParts[nameParts.length - 1];
      docs.push({
        id,
        data: result.document.fields ? decodeFields(result.document.fields) : {},
      });
    }
  }

  return docs;
}
