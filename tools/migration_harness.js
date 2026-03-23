#!/usr/bin/env node
"use strict";

const fs = require("fs");

const RUN_SCHEMA_VERSION = 2;

function getPayloadSchemaVersion(raw) {
  const value = Number(raw && raw.schemaVersion);
  if (Number.isFinite(value) && value >= 1) return value;
  return 1;
}

function migrateV1ToV2(raw) {
  return {
    ...raw,
    schemaVersion: 2,
    runCreatedAt: Number(raw && raw.runCreatedAt) || Number(raw && raw.lastSavedAt) || Date.now(),
  };
}

function migrateRunSaveData(raw) {
  if (!raw || typeof raw !== "object") return null;

  const incomingVersion = getPayloadSchemaVersion(raw);
  if (incomingVersion > RUN_SCHEMA_VERSION) return null;

  let working = { ...raw };
  let version = incomingVersion;

  while (version < RUN_SCHEMA_VERSION) {
    if (version === 1) {
      working = migrateV1ToV2(working);
      version = 2;
      continue;
    }
    return null;
  }

  return working;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runBuiltInTests() {
  const v1Payload = {
    runName: "Legacy Run",
    wood: 120,
    structures: { sawmill: 1, quarry: 1, forge: 0, reactor: 0 },
    lastSavedAt: 1700000000000,
  };

  const migratedV1 = migrateRunSaveData(v1Payload);
  assert(migratedV1 !== null, "v1 payload should migrate");
  assert(migratedV1.schemaVersion === 2, "v1 payload should become schemaVersion=2");
  assert(Number(migratedV1.runCreatedAt) > 0, "v1 payload should get runCreatedAt");

  const v2Payload = {
    schemaVersion: 2,
    runCreatedAt: 1711111111111,
    runName: "Modern Run",
    structures: { sawmill: 2, quarry: 2, forge: 1, reactor: 1 },
  };

  const migratedV2 = migrateRunSaveData(v2Payload);
  assert(migratedV2 !== null, "v2 payload should be accepted");
  assert(migratedV2.schemaVersion === 2, "v2 schema version should remain 2");
  assert(migratedV2.runCreatedAt === 1711111111111, "v2 runCreatedAt should be preserved");

  const futurePayload = {
    schemaVersion: 3,
    runName: "Future Run",
    structures: { sawmill: 0, quarry: 0, forge: 0, reactor: 0 },
  };

  const migratedFuture = migrateRunSaveData(futurePayload);
  assert(migratedFuture === null, "future schema should be rejected");

  console.log("PASS: Built-in migration tests succeeded.");
}

function testFile(filePath, printOutput) {
  const rawText = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(rawText);
  const migrated = migrateRunSaveData(parsed);

  if (!migrated) {
    console.error("FAIL: Unsupported or invalid payload schema.");
    process.exit(1);
  }

  if (printOutput) {
    console.log(JSON.stringify(migrated, null, 2));
  } else {
    console.log(`PASS: ${filePath} migrated/validated as schema v${migrated.schemaVersion}.`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((arg) => !arg.startsWith("--"));
  const printOutput = args.includes("--print");

  if (!filePath) {
    runBuiltInTests();
    return;
  }

  testFile(filePath, printOutput);
}

main();
