import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { jsonLdString } from "../jsonLd.js";

describe("jsonLdString", () => {
  it("cannot be used to break out of the script tag", () => {
    const out = jsonLdString({ name: "</script><script>alert(1)</script>", a: "<!-- x -->", amp: "a&b" });
    assert.ok(!out.includes("<"), "no raw < in output");
    assert.ok(!out.includes(">"), "no raw > in output");
    assert.ok(!out.includes("&"), "no raw & in output");
  });
  it("round-trips to the same data", () => {
    const data = { "@type": "Person", name: "x</script>y", n: 5, nested: { ok: true }, ls: "a\u2028b" };
    assert.deepEqual(JSON.parse(jsonLdString(data)), data);
  });
});
