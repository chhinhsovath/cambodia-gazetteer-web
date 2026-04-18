#!/usr/bin/env node
// Generate the static /api/v1/* JSON tree from cambodia_gazetteer.json.
// Writes into <outDir>/api/v1/.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outRoot = path.resolve(process.argv[2] || "./dist");
const apiOut = path.join(outRoot, "api", "v1");

const SOURCE = path.join(repoRoot, "cambodia_gazetteer.json");
const VERSION = "v1";
const GENERATED = new Date().toISOString();

console.log(`[api] reading  ${path.relative(repoRoot, SOURCE)}`);
console.log(`[api] writing  ${path.relative(repoRoot, apiOut)}/`);

const provinces = JSON.parse(await fs.readFile(SOURCE, "utf8"));

await fs.rm(apiOut, { recursive: true, force: true });
await fs.mkdir(apiOut, { recursive: true });
await fs.mkdir(path.join(apiOut, "provinces"), { recursive: true });
await fs.mkdir(path.join(apiOut, "districts"), { recursive: true });
await fs.mkdir(path.join(apiOut, "communes"), { recursive: true });

let counts = { province: 0, district: 0, commune: 0, village: 0 };
for (const p of provinces) {
  counts.province++;
  for (const d of p.districts) {
    counts.district++;
    for (const c of d.communes) {
      counts.commune++;
      counts.village += c.villages.length;
    }
  }
}
const total = counts.province + counts.district + counts.commune + counts.village;

const meta = {
  version: VERSION,
  generated: GENERATED,
  source: "https://db.ncdd.gov.kh/gazetteer",
  counts: { ...counts, total },
};

const writeJson = async (relPath, data) => {
  const full = path.join(apiOut, relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, JSON.stringify(data));
};

// -------- Index --------
await writeJson("index.json", {
  ...meta,
  endpoints: {
    list_provinces: "/api/v1/provinces",
    province: "/api/v1/provinces/{code}",
    district: "/api/v1/districts/{code}",
    commune: "/api/v1/communes/{code}",
    search: "/api/v1/search?q={query}&type={type?}&limit={n?}",
    full: "/api/v1/full.json",
    openapi: "/api/v1/openapi.json",
  },
  examples: {
    province: "/api/v1/provinces/01",
    district: "/api/v1/districts/000102",
    commune: "/api/v1/communes/10201",
    search: "/api/v1/search?q=banteay&type=village&limit=10",
  },
});

// -------- Full original (mirror) --------
await fs.copyFile(SOURCE, path.join(apiOut, "full.json"));

// -------- /provinces (list) --------
await writeJson("provinces.json", {
  meta: { ...meta, count: counts.province },
  data: provinces.map((p) => ({
    code: p.code,
    khmer: p.khmer,
    latin: p.latin,
    href: `/api/v1/provinces/${p.code}`,
    counts: {
      districts: p.districts.length,
    },
  })),
});

// -------- /provinces/{code}, /districts/{code}, /communes/{code} --------
for (const p of provinces) {
  await writeJson(`provinces/${p.code}.json`, {
    meta,
    data: {
      code: p.code,
      khmer: p.khmer,
      latin: p.latin,
      boundary: p.boundary,
      counts: {
        districts: p.districts.length,
        communes: p.districts.reduce((n, d) => n + d.communes.length, 0),
        villages: p.districts.reduce(
          (n, d) =>
            n + d.communes.reduce((m, c) => m + c.villages.length, 0),
          0,
        ),
      },
      districts: p.districts.map((d) => ({
        code: d.code,
        khmer: d.khmer,
        latin: d.latin,
        href: `/api/v1/districts/${d.code}`,
        counts: { communes: d.communes.length },
      })),
    },
  });

  for (const d of p.districts) {
    await writeJson(`districts/${d.code}.json`, {
      meta,
      data: {
        code: d.code,
        khmer: d.khmer,
        latin: d.latin,
        province: { code: p.code, khmer: p.khmer, latin: p.latin },
        counts: {
          communes: d.communes.length,
          villages: d.communes.reduce((n, c) => n + c.villages.length, 0),
        },
        communes: d.communes.map((c) => ({
          code: c.code,
          khmer: c.khmer,
          latin: c.latin,
          href: `/api/v1/communes/${c.code}`,
          counts: { villages: c.villages.length },
        })),
      },
    });

    for (const c of d.communes) {
      await writeJson(`communes/${c.code}.json`, {
        meta,
        data: {
          code: c.code,
          khmer: c.khmer,
          latin: c.latin,
          district: { code: d.code, khmer: d.khmer, latin: d.latin },
          province: { code: p.code, khmer: p.khmer, latin: p.latin },
          counts: { villages: c.villages.length },
          villages: c.villages.map((v) => ({
            code: v.code,
            khmer: v.khmer,
            latin: v.latin,
          })),
        },
      });
    }
  }
}

// -------- OpenAPI 3.1 spec --------
const openapi = {
  openapi: "3.1.0",
  info: {
    title: "Cambodia Gazetteer API",
    version: "1.0.0",
    description:
      "Read-only API for Cambodia's administrative divisions (Province → District → Commune → Village) in Khmer and Latin script. Sourced from db.ncdd.gov.kh.",
    license: { name: "MIT" },
  },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/provinces": {
      get: {
        summary: "List all provinces",
        responses: { "200": { description: "Array of provinces" } },
      },
    },
    "/provinces/{code}": {
      get: {
        summary: "Get a province with its districts",
        parameters: [
          {
            name: "code",
            in: "path",
            required: true,
            schema: { type: "string", example: "01" },
          },
        ],
        responses: {
          "200": { description: "Province details" },
          "404": { description: "Not found" },
        },
      },
    },
    "/districts/{code}": {
      get: {
        summary: "Get a district with its communes",
        parameters: [
          {
            name: "code",
            in: "path",
            required: true,
            schema: { type: "string", example: "000102" },
          },
        ],
        responses: {
          "200": { description: "District details" },
          "404": { description: "Not found" },
        },
      },
    },
    "/communes/{code}": {
      get: {
        summary: "Get a commune with its villages",
        parameters: [
          {
            name: "code",
            in: "path",
            required: true,
            schema: { type: "string", example: "10201" },
          },
        ],
        responses: {
          "200": { description: "Commune details" },
          "404": { description: "Not found" },
        },
      },
    },
    "/search": {
      get: {
        summary: "Search across all admin units",
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            schema: { type: "string", example: "banteay" },
          },
          {
            name: "type",
            in: "query",
            schema: {
              type: "string",
              enum: ["province", "district", "commune", "village"],
            },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 25, maximum: 200 },
          },
        ],
        responses: { "200": { description: "Matches" } },
      },
    },
    "/full.json": {
      get: {
        summary: "Download the entire dataset (original nested form)",
        responses: { "200": { description: "Full dataset" } },
      },
    },
  },
};
await writeJson("openapi.json", openapi);

const fileCount =
  1 + // index
  1 + // full
  1 + // provinces list
  counts.province +
  counts.district +
  counts.commune +
  1; // openapi

console.log(
  `[api] wrote ${fileCount} files — ${counts.province} provinces / ${counts.district} districts / ${counts.commune} communes / ${counts.village} villages`,
);
