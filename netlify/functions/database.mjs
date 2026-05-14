import { getDatabase } from "@netlify/database";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function formatDate(value) {
  if (!value) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function rowToBean(row) {
  return {
    id: row.id,
    roaster: row.roaster ?? "",
    name: row.name ?? "",
    origin: row.origin ?? "",
    datePurchased: formatDate(row.date_purchased),
    notes: Array.isArray(row.notes) ? row.notes : row.notes ?? [],
    greatOn: Array.isArray(row.great_on) ? row.great_on : row.great_on ?? [],
  };
}

function extractKey(event) {
  const qs = event.queryStringParameters || {};
  if (qs.key) return qs.key;
  const path = event.path || "";
  const i = path.indexOf("/bean-");
  if (i >= 0) return path.slice(i + 1);
  return null;
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  const qs = event.queryStringParameters || {};
  const listRequested = qs.list === "true";

  let db;
  try {
    db = getDatabase();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Database unavailable";
    return json(503, { message: msg });
  }

  try {
    if (event.httpMethod === "GET" && listRequested) {
      const rows = await db.sql`SELECT id FROM beans ORDER BY id ASC`;
      const keys = rows.map((r) => `bean-${r.id}`);
      return json(200, { keys });
    }

    const key = extractKey(event);
    if (!key) {
      return json(400, { message: "Missing key or list=true" });
    }

    const m = /^bean-(\d+)$/.exec(key);
    if (!m) {
      return json(400, { message: "Invalid key" });
    }
    const id = parseInt(m[1], 10);

    if (event.httpMethod === "GET") {
      const rows =
        await db.sql`SELECT id, roaster, name, origin, date_purchased, notes, great_on FROM beans WHERE id = ${id}`;
      if (!rows.length) {
        return json(404, { message: "Not found" });
      }
      const bean = rowToBean(rows[0]);
      return json(200, { value: JSON.stringify(bean) });
    }

    if (event.httpMethod === "PUT") {
      const raw = event.body || "{}";
      const body = JSON.parse(raw);
      const bean = JSON.parse(body.value);
      const notesJson = JSON.stringify(bean.notes ?? []);
      const greatOnJson = JSON.stringify(bean.greatOn ?? []);

      await db.pool.query(
        `INSERT INTO beans (id, roaster, name, origin, date_purchased, notes, great_on)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
         ON CONFLICT (id) DO UPDATE SET
           roaster = EXCLUDED.roaster,
           name = EXCLUDED.name,
           origin = EXCLUDED.origin,
           date_purchased = EXCLUDED.date_purchased,
           notes = EXCLUDED.notes,
           great_on = EXCLUDED.great_on`,
        [
          bean.id,
          bean.roaster ?? "",
          bean.name ?? "",
          bean.origin ?? "",
          bean.datePurchased || null,
          notesJson,
          greatOnJson,
        ]
      );

      return json(200, { ok: true });
    }

    return json(405, { message: "Method not allowed" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return json(500, { message: msg });
  }
};
