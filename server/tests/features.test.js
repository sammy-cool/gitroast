const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { generateRoast, buildLanguageSection } = require("../services/roastEngine");
const { analyzeWrapped } = require("../services/githubService");

describe("Feature #1 — Language Roast Packs", () => {
    it("should return Python roast line for Python", () => {
        const line = buildLanguageSection("Python", "savage");
        assert.ok(line && line.length > 0);
        const hasPythonJoke = /python|indent|env|pip|requirements/i.test(line);
        assert.ok(
            hasPythonJoke,
            `Expected language section to mention Python tropes, got: ${line}`,
        );
    });

    it("should handle case-insensitive top language lookup for Go, Rust, and JavaScript", () => {
        const goLine = buildLanguageSection("go", "savage");
        assert.ok(/err != nil|gopher|go/i.test(goLine), `Expected Go tropes, got: ${goLine}`);

        const rustLine = buildLanguageSection("RUST", "savage");
        assert.ok(/borrow|compiler|rust/i.test(rustLine), `Expected Rust tropes, got: ${rustLine}`);

        const jsLine = buildLanguageSection("javascript", "savage");
        assert.ok(/node|state management|framework|javascript|npm/i.test(jsLine), `Expected JS tropes, got: ${jsLine}`);
    });

    it("should return empty string for Nothing or undefined language", () => {
        assert.equal(buildLanguageSection("Nothing", "savage"), "");
        assert.equal(buildLanguageSection(undefined, "savage"), "");
    });
});

describe("Feature #4 — GitHub Wrapped 2025", () => {
    it("should generate a complete wrapped report with archetype, streak, and worst month", async () => {
        // Test analyzeWrapped with mocked fetch
        const originalFetch = global.fetch;

        global.fetch = async (url) => {
            if (url.includes("/users/testdev/repos") || url.includes("/user/repos")) {
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers(),
                    json: async () => [
                        {
                            name: "abandoned-ai-startup",
                            fork: false,
                            created_at: "2025-02-10T10:00:00Z",
                            pushed_at: "2025-02-11T12:00:00Z",
                            stargazers_count: 0,
                            language: "TypeScript",
                            description: "Disrupting everything with AI",
                        },
                        {
                            name: "weekend-hacks",
                            fork: false,
                            created_at: "2025-01-01T00:00:00Z",
                            pushed_at: "2025-11-20T18:00:00Z",
                            stargazers_count: 3,
                            language: "JavaScript",
                            description: "Random experiments",
                        },
                    ],
                };
            }
            if (url.includes("/users/testdev")) {
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers(),
                    json: async () => ({
                        login: "testdev",
                        public_repos: 2,
                        followers: 12,
                        following: 10,
                        created_at: "2021-06-01T00:00:00Z",
                        avatar_url: "https://github.com/testdev.png",
                    }),
                };
            }
            if (url.includes("/commits")) {
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers(),
                    json: async () => [
                        {
                            commit: {
                                author: { date: "2025-03-01T12:00:00Z" },
                                message: "initial commit",
                            },
                        },
                        {
                            commit: {
                                author: { date: "2025-03-02T14:00:00Z" },
                                message: "fix stuff",
                            },
                        },
                        {
                            commit: {
                                author: { date: "2025-03-03T16:00:00Z" },
                                message: "wip final",
                            },
                        },
                    ],
                };
            }
            return {
                ok: true,
                status: 200,
                headers: new Headers(),
                json: async () => ({}),
            };
        };

        try {
            const report = await analyzeWrapped("testdev", 2025);

            assert.equal(report.year, 2025);
            assert.equal(report.username, "testdev");
            assert.ok(report.totalCommits >= 3);
            assert.ok(report.archetype.length > 0);
            assert.ok(report.archetypeEmoji.length > 0);
            assert.ok(report.worstMonth.month.length > 0);
            assert.ok(report.bestStreak >= 1);
            assert.equal(report.mostAbandonedRepo.name, "abandoned-ai-startup");
            assert.equal(report.mostAbandonedRepo.daysAlive, 1);
            assert.equal(report.monthlyCommits.length, 12);
            assert.ok(report.annualScore > 0);
            assert.ok(report.annualRoast.includes("testdev"));
        } finally {
            global.fetch = originalFetch;
        }
    });

    it("should reject organizations with ORGANIZATION_NOT_SUPPORTED", async () => {
        const { analyzeProfile } = require("../services/githubService");
        const originalFetch = global.fetch;

        global.fetch = async (url) => {
            if (url.includes("/users/google")) {
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers(),
                    json: async () => ({
                        login: "google",
                        type: "Organization",
                    }),
                };
            }
            return {
                ok: true,
                status: 200,
                headers: new Headers(),
                json: async () => ([]),
            };
        };

        try {
            await assert.rejects(
                async () => {
                    await analyzeProfile("google");
                },
                { message: "ORGANIZATION_NOT_SUPPORTED" },
            );
        } finally {
            global.fetch = originalFetch;
        }
    });

    it("should query /users/:username/repos when roasting another developer even if userToken is present", async () => {
        const { analyzeProfile } = require("../services/githubService");
        const originalFetch = global.fetch;
        let queriedEndpoint = null;

        global.fetch = async (url) => {
            if (url.includes("/repos")) {
                queriedEndpoint = url;
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers(),
                    json: async () => [],
                };
            }
            if (url.includes("/users/otherdev")) {
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers(),
                    json: async () => ({
                        login: "otherdev",
                        type: "User",
                        public_repos: 0,
                        created_at: "2023-01-01T00:00:00Z",
                    }),
                };
            }
            return {
                ok: true,
                status: 200,
                headers: new Headers(),
                json: async () => ({}),
            };
        };

        try {
            // Logged in as "callerdev", but roasting "otherdev"
            await analyzeProfile("otherdev", "caller_token_123", "callerdev", false);
            assert.ok(
                queriedEndpoint && queriedEndpoint.includes("/users/otherdev/repos"),
                `Expected /users/otherdev/repos to be called, got: ${queriedEndpoint}`,
            );
        } finally {
            global.fetch = originalFetch;
        }
    });

    it("should provide dedicated ghost roast for accounts with zero repositories", () => {
        const ghostData = {
            username: "ghostie",
            score: 15,
            grade: "F-",
            repoAnalysis: { totalOwn: 0 },
            commitAnalysis: { qualityScore: 0, shameList: [] },
        };
        const roast = generateRoast(ghostData, "savage");
        assert.ok(roast && roast.length > 0);
        assert.ok(/zero|empty|404|ghost/i.test(roast), `Expected ghost roast tropes, got: ${roast}`);
    });
});

describe("Security & Defensive Integrity", () => {
    const mongoose = require("mongoose");
    const crypto = require("crypto");
    const { verifyPayment } = require("../services/paymentService");

    it("should safely reject payment verification when secrets or fields are missing", () => {
        const originalSecret = process.env.RAZORPAY_KEY_SECRET;
        try {
            delete process.env.RAZORPAY_KEY_SECRET;
            const res = verifyPayment({
                orderId: "order_123",
                paymentId: "pay_123",
                signature: "sig_123",
            });
            assert.equal(res, false, "Should return false when RAZORPAY_KEY_SECRET is unset");
        } finally {
            if (originalSecret) process.env.RAZORPAY_KEY_SECRET = originalSecret;
        }

        assert.equal(
            verifyPayment({ orderId: "", paymentId: "pay_123", signature: "sig" }),
            false,
        );
        assert.equal(
            verifyPayment({ orderId: "order_123", paymentId: "", signature: "sig" }),
            false,
        );
        assert.equal(
            verifyPayment({ orderId: "order_123", paymentId: "pay_123", signature: "" }),
            false,
        );
    });

    it("should verify valid HMAC signature and reject tampered signature with timing-safe comparison", () => {
        const secret = "test_secret_key_12345";
        process.env.RAZORPAY_KEY_SECRET = secret;

        const orderId = "order_abc123";
        const paymentId = "pay_xyz789";
        const expectedSig = crypto
            .createHmac("sha256", secret)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");

        const isValid = verifyPayment({
            orderId,
            paymentId,
            signature: expectedSig,
        });
        assert.equal(isValid, true, "Valid HMAC signature must verify successfully");

        const isTampered = verifyPayment({
            orderId,
            paymentId,
            signature: "tampered_sig_" + expectedSig.slice(13),
        });
        assert.equal(isTampered, false, "Tampered signature must be rejected");
    });

    it("should validate MongoDB ObjectId format correctly to prevent CastError", () => {
        assert.equal(mongoose.Types.ObjectId.isValid("65f1a2b3c4d5e6f7a8b9c0d1"), true);
        assert.equal(mongoose.Types.ObjectId.isValid("invalid-id-here"), false);
        assert.equal(mongoose.Types.ObjectId.isValid(""), false);
        assert.equal(mongoose.Types.ObjectId.isValid("12345"), false);
    });

    it("should allow upgraded rate limits (+15 allowance) before returning 429", () => {
        const { createRateLimiter } = require("../middleware/rateLimiter");
        const limiter = createRateLimiter({
            windowMs: 60 * 1000,
            maxRequests: 20, // upgraded roast limit: 5 + 15
        });

        let nextCallCount = 0;
        let lastStatus = null;
        let lastJson = null;

        const fakeRes = {
            headers: {},
            setHeader(name, val) {
                this.headers[name] = val;
            },
            status(code) {
                lastStatus = code;
                return {
                    json(data) {
                        lastJson = data;
                    },
                };
            },
        };

        const fakeReq = {
            headers: { "x-forwarded-for": "192.168.1.99" },
            baseUrl: "/api/roast",
            path: "/testuser",
        };

        // 20 requests must pass
        for (let i = 0; i < 20; i++) {
            limiter(fakeReq, fakeRes, () => {
                nextCallCount++;
            });
        }
        assert.equal(nextCallCount, 20, "All 20 upgraded requests should be permitted");
        assert.equal(lastStatus, null, "Status should not be 429 within quota");

        // 21st request must trigger 429
        limiter(fakeReq, fakeRes, () => {
            nextCallCount++;
        });
        assert.equal(lastStatus, 429, "21st request should receive 429");
        assert.equal(lastJson?.error, "RATE_LIMIT_EXCEEDED");
    });

    it("should resolve correct keep-alive target URL based on environment", () => {
        const { getHealthUrl } = require("../services/keepAliveService");
        const originalRender = process.env.RENDER_EXTERNAL_URL;
        try {
            process.env.RENDER_EXTERNAL_URL = "https://custom-service.onrender.com";
            assert.equal(
                getHealthUrl(),
                "https://custom-service.onrender.com/health",
            );
            delete process.env.RENDER_EXTERNAL_URL;
            assert.equal(
                getHealthUrl(),
                "https://gitroast-latest.onrender.com/health",
            );
        } finally {
            if (originalRender) process.env.RENDER_EXTERNAL_URL = originalRender;
        }
    });
});
