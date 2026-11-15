import test from "node:test";
import assert from "node:assert/strict";
import { validateListing, validateMessage } from "../src/lib/validation.ts";

const listing = { title: "A very good chair", description: "A comfortable chair with a warm wooden frame and a clean woven seat.", price: "24.50", category: "Furniture", condition: "Good", seller_name: "Alex", seller_email: "Alex@example.com", location: "Downtown", image_path: "c37cba76-799b-4125-ae38-95ef9aa29acd.jpg" };

test("preserves a free listing and normalizes contact information", () => {
  const data = validateListing({ ...listing, price: 0, seller_email: "  Alex@Example.com  " });
  assert.equal(data.price, 0); assert.equal(data.seller_email, "alex@example.com");
});

test("requires only the core listing fields and supplies sensible optional defaults", () => {
  const { seller_name, location, condition, ...core } = listing;
  const data = validateListing(core);
  assert.equal(data.seller_name, "Community seller");
  assert.equal(data.location, "Local pickup");
  assert.equal(data.condition, "Good");
});

test("rejects missing, negative, non-finite, excessive, and fractional-cent prices", () => {
  for (const price of ["", " ", -1, "hello", Infinity, 10000001, 1.001, null]) assert.throws(() => validateListing({ ...listing, price }));
  assert.equal(validateListing(listing).price, 24.5);
});

test("only permits the supported image paths and categories", () => {
  for (const image_path of ["https://example.com/a.jpg", "../a.jpg", "x.png", "c37cba76-799b-4125-ae38-95ef9aa29acd.svg"]) assert.throws(() => validateListing({ ...listing, image_path }));
  assert.throws(() => validateListing({ ...listing, category: "Unknown category" }));
  assert.throws(() => validateListing({ ...listing, description: "Too short" }));
});

test("validates the listing identity and contact details of buyer messages", () => {
  const message = { listing_id: "c37cba76-799b-4125-ae38-95ef9aa29acd", buyer_name: "Sam", buyer_email: "SAM@example.com", body: "Hi, is your chair still available?" };
  assert.equal(validateMessage(message).buyer_email, "sam@example.com");
  assert.throws(() => validateMessage({ ...message, listing_id: "missing" }));
  assert.throws(() => validateMessage({ ...message, buyer_email: "not-an-email" }));
  assert.throws(() => validateMessage({ ...message, body: "Hi" }));
  assert.throws(() => validateMessage({ ...message, body: "x".repeat(2001) }));
});
