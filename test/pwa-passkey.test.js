import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { getAdminWebAuthnContext } from "../server/admin-auth.js";

function makeRequest(headers = {}, protocol = "http") {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
  return {
    protocol,
    secure: protocol === "https",
    get(name) {
      return normalized[String(name).toLowerCase()] || "";
    }
  };
}

test("admin passkeys are bound to the canonical production domain", () => {
  const context = getAdminWebAuthnContext(
    makeRequest({
      origin: "https://vmestevkusnee.ru",
      host: "vmestevkusnee.ru",
      "x-forwarded-proto": "https"
    })
  );

  assert.deepEqual(context, {
    rpID: "vmestevkusnee.ru",
    origin: "https://vmestevkusnee.ru"
  });
});

test("admin passkeys keep the exact local secure-context origin", () => {
  const context = getAdminWebAuthnContext(
    makeRequest({
      origin: "http://localhost:5173",
      host: "localhost:5173"
    })
  );

  assert.deepEqual(context, {
    rpID: "localhost",
    origin: "http://localhost:5173"
  });
});

test("public, manager and staff PWAs have distinct identities and correct start routes", () => {
  const site = JSON.parse(fs.readFileSync("public/site-manifest.json", "utf8"));
  const manager = JSON.parse(fs.readFileSync("public/admin-manifest.json", "utf8"));
  const staff = JSON.parse(fs.readFileSync("public/admin-staff-manifest.json", "utf8"));

  assert.equal(site.id, "/");
  assert.equal(site.start_url, "/");
  assert.equal(manager.id, "/admin/manager");
  assert.equal(manager.start_url, "/admin?role=manager");
  assert.equal(staff.id, "/admin/staff");
  assert.equal(staff.start_url, "/admin?role=admin");
  assert.equal(new Set([site.id, manager.id, staff.id]).size, 3);
});
