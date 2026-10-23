// Audits the production dependencies like
// `npm audit --omit=dev --audit-level=high`: any high or critical advisory
// fails, except the reviewed ones in ACCEPTED (used by CI).
//
//   node scripts/audit.mjs
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const FAILING = new Set(["high", "critical"]);

/**
 * Advisories that were reviewed and don't affect this app. Each entry only
 * applies while the packages in `onlyWith` are locked at those versions, so
 * an upgrade brings the advisory back for a new review.
 */
const ACCEPTED = [
  {
    ids: ["GHSA-cg2g-xh64-v4q7", "GHSA-mrv2-3pqr-j5jr"],
    onlyWith: { "monaco-editor": "0.57.0" },
    reason:
      "Monaco 0.57.0 pins dompurify 3.4.15 and bundles its own copy, so an " +
      "npm override wouldn't change the code the site serves. The advisories " +
      "need SAFE_FOR_TEMPLATES or IN_PLACE, which Monaco never sets: its " +
      "sanitizer (vs/base/browser/domSanitize.js) only sets ALLOWED_TAGS, " +
      "ALLOWED_ATTR and ALLOW_UNKNOWN_PROTOCOLS. Remove this entry once " +
      "Monaco ships dompurify 3.4.17 or newer.",
  },
];

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const locked = (name) => lock.packages?.[`node_modules/${name}`]?.version;

const accepted = new Map();
for (const entry of ACCEPTED) {
  const applies = Object.entries(entry.onlyWith).every(
    ([name, version]) => locked(name) === version,
  );
  if (applies) for (const id of entry.ids) accepted.set(id, entry);
}

// npm audit exits non-zero whenever it finds anything; read its report.
const result = spawnSync("npm audit --omit=dev --json", {
  shell: true,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error(result.stderr || result.stdout || "npm audit failed");
  process.exit(1);
}
if (report.error) {
  console.error(`npm audit failed: ${report.error.summary ?? report.error}`);
  process.exit(1);
}

// Dependents list the vulnerable package by name; the advisories themselves
// are the objects in `via`.
const advisories = new Map();
for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vulnerability.via) {
    if (typeof via === "object") advisories.set(via.url, via);
  }
}

const failures = [];
const used = new Set();
for (const advisory of advisories.values()) {
  if (!FAILING.has(advisory.severity)) continue;
  const id = advisory.url.split("/").pop();
  const line = `${advisory.severity}: ${advisory.name} ${advisory.range}, ${advisory.title} (${advisory.url})`;
  const entry = accepted.get(id);
  if (entry) {
    used.add(entry);
    console.log(`accepted ${line}`);
  } else {
    failures.push(line);
  }
}
for (const entry of used) console.log(`  reason: ${entry.reason}`);

const stale = [...accepted.keys()].filter(
  (id) => ![...advisories.values()].some((a) => a.url.endsWith(`/${id}`)),
);
if (stale.length) {
  console.log(`no longer reported, remove from ACCEPTED: ${stale.join(", ")}`);
}

if (failures.length) {
  console.error(
    `\n${failures.length} high or critical advisories in production dependencies:`,
  );
  for (const line of failures) console.error(`  ${line}`);
  process.exit(1);
}
console.log(
  "No unaccepted high or critical advisories in production dependencies.",
);
