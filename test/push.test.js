import assert from "node:assert/strict";
import test from "node:test";
import { buildPushTopic } from "../server/push.js";

test("push topic keeps short safe values unchanged", () => {
  assert.equal(buildPushTopic("admin-test"), "admin-test");
});

test("push topic safely compacts long order identifiers", () => {
  const topic = buildPushTopic("admin-order-WEB-PUSH-DIAGNOSTIC-20260724");

  assert.match(topic, /^[A-Za-z0-9_-]+$/);
  assert.ok(topic.length <= 32);
  assert.equal(topic, buildPushTopic("admin-order-WEB-PUSH-DIAGNOSTIC-20260724"));
  assert.notEqual(topic, buildPushTopic("admin-order-WEB-PUSH-DIAGNOSTIC-20260725"));
});
