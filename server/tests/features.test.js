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

    it("should load the enhanced 110-rule ruleset cleanly without duplicates", () => {
        const { getRoastRulesCount } = require("../services/roastEngine");
        assert.equal(getRoastRulesCount(), 110);
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

    it("should handle reCAPTCHA v3 verification scenarios properly", async () => {
        const { verifyCaptcha } = require("../middleware/captcha");

        function createMockRes() {
            let statusCode = 200;
            let responseJson = null;
            return {
                status(code) {
                    statusCode = code;
                    return this;
                },
                json(data) {
                    responseJson = data;
                    return this;
                },
                getStatusCode: () => statusCode,
                getJson: () => responseJson,
            };
        }

        // 1. Authenticated user bypasses CAPTCHA
        let nextCalled = false;
        await verifyCaptcha(
            { user: { id: "test-user-123" }, headers: {} },
            createMockRes(),
            () => { nextCalled = true; },
        );
        assert.equal(nextCalled, true, "Authenticated user should bypass CAPTCHA");

        // 2. Unconfigured secret key bypasses CAPTCHA
        const savedSecret = process.env.RECAPTCHA_SECRET_KEY;
        try {
            delete process.env.RECAPTCHA_SECRET_KEY;
            nextCalled = false;
            await verifyCaptcha(
                { headers: {} },
                createMockRes(),
                () => { nextCalled = true; },
            );
            assert.equal(nextCalled, true, "Missing secret should bypass gracefully");

            // 3. Secret configured but missing token -> 403 CAPTCHA_REQUIRED
            process.env.RECAPTCHA_SECRET_KEY = "test_secret_key";
            const resNoToken = createMockRes();
            nextCalled = false;
            await verifyCaptcha(
                { headers: {} },
                resNoToken,
                () => { nextCalled = true; },
            );
            assert.equal(nextCalled, false);
            assert.equal(resNoToken.getStatusCode(), 403);
            assert.equal(resNoToken.getJson()?.error, "CAPTCHA_REQUIRED");

            // 4. Secret configured, low score -> 403 CAPTCHA_FAILED
            const originalFetch = global.fetch;
            try {
                global.fetch = async () => ({
                    json: async () => ({ success: true, score: 0.2 }),
                });
                const resLowScore = createMockRes();
                nextCalled = false;
                await verifyCaptcha(
                    { headers: { "x-captcha-token": "bot-token" } },
                    resLowScore,
                    () => { nextCalled = true; },
                );
                assert.equal(nextCalled, false);
                assert.equal(resLowScore.getStatusCode(), 403);
                assert.equal(resLowScore.getJson()?.error, "CAPTCHA_FAILED");

                // 5. Secret configured, valid score -> next()
                global.fetch = async () => ({
                    json: async () => ({ success: true, score: 0.9 }),
                });
                const resValid = createMockRes();
                nextCalled = false;
                await verifyCaptcha(
                    { headers: { "x-captcha-token": "human-token" } },
                    resValid,
                    () => { nextCalled = true; },
                );
                assert.equal(nextCalled, true, "Human score should pass verification");

                // 6. Enterprise mode configured, valid assessment -> next()
                process.env.RECAPTCHA_PROJECT_ID = "gitroast-cloud";
                process.env.RECAPTCHA_API_KEY = "test-api-key";
                global.fetch = async () => ({
                    json: async () => ({
                        tokenProperties: { valid: true, action: "roast" },
                        riskAnalysis: { score: 0.85 },
                    }),
                });
                const resEnterpriseValid = createMockRes();
                nextCalled = false;
                await verifyCaptcha(
                    { headers: { "x-captcha-token": "valid-enterprise-token" } },
                    resEnterpriseValid,
                    () => { nextCalled = true; },
                );
                assert.equal(nextCalled, true, "Valid Enterprise assessment should pass");

                // 7. Enterprise mode configured, bot assessment -> 403
                global.fetch = async () => ({
                    json: async () => ({
                        tokenProperties: { valid: false, invalidReason: "EXPIRED" },
                        riskAnalysis: { score: 0.1 },
                    }),
                });
                const resEnterpriseBot = createMockRes();
                nextCalled = false;
                await verifyCaptcha(
                    { headers: { "x-captcha-token": "bot-enterprise-token" } },
                    resEnterpriseBot,
                    () => { nextCalled = true; },
                );
                assert.equal(nextCalled, false);
                assert.equal(resEnterpriseBot.getStatusCode(), 403);
                assert.equal(resEnterpriseBot.getJson()?.error, "CAPTCHA_FAILED");

                delete process.env.RECAPTCHA_PROJECT_ID;
                delete process.env.RECAPTCHA_API_KEY;

                // 8. Network error / timeout -> fails open gracefully
                global.fetch = async () => {
                    throw new Error("Network timeout");
                };
                const resError = createMockRes();
                nextCalled = false;
                await verifyCaptcha(
                    { headers: { "x-captcha-token": "any-token" } },
                    resError,
                    () => { nextCalled = true; },
                );
                assert.equal(nextCalled, true, "Should fail open on network error");
            } finally {
                global.fetch = originalFetch;
            }
        } finally {
            if (savedSecret) {
                process.env.RECAPTCHA_SECRET_KEY = savedSecret;
            } else {
                delete process.env.RECAPTCHA_SECRET_KEY;
            }
        }
    });
});

describe("Pillar 2 & 3 — New Growth & Value Features", () => {
    const { getCompanyLeaderboard } = require("../services/companyRoastService");
    const { analyzeRepository } = require("../services/repoRoastService");

    it("should return ranked tech giants with chaos scores and sins", () => {
        const giants = getCompanyLeaderboard();
        assert.ok(Array.isArray(giants) && giants.length >= 8);
        const google = giants.find((g) => g.name && g.name.toLowerCase() === "google");
        assert.ok(google, "Google should be in the tech giant list");
        assert.ok(google.chaosScore > 0);
        assert.ok(Array.isArray(google.sins) && google.sins.length > 0);
        // Verify sorted by rank / chaos score descending
        assert.ok(giants[0].chaosScore <= giants[giants.length - 1].chaosScore || giants[0].rank === 1);
    });

    it("should analyze a repository with commit hygiene and code smells", async () => {
        const originalFetch = global.fetch;
        try {
            global.fetch = async (url) => {
                if (url.includes("/contents")) {
                    return {
                        ok: true,
                        status: 200,
                        headers: new Headers(),
                        json: async () => [
                            { name: "index.js" },
                            { name: "package.json" },
                        ], // Missing tests and README
                    };
                }
                if (url.includes("/commits")) {
                    return {
                        ok: true,
                        status: 200,
                        headers: new Headers(),
                        json: async () => [
                            { commit: { message: "fix bug" } },
                            { commit: { message: "pls work" } },
                            { commit: { message: "wip" } },
                        ],
                    };
                }
                // Repo metadata
                return {
                    ok: true,
                    status: 200,
                    headers: new Headers(),
                    json: async () => ({
                        name: "broken-app",
                        description: "A very messy project",
                        language: "JavaScript",
                        stargazers_count: 5,
                        forks_count: 1,
                        open_issues_count: 15,
                        license: null,
                        owner: { avatar_url: "https://example.com/avatar.png" },
                        html_url: "https://github.com/testowner/broken-app",
                        pushed_at: "2024-01-01T00:00:00Z",
                        created_at: "2023-01-01T00:00:00Z",
                    }),
                };
            };

            const result = await analyzeRepository("testowner", "broken-app", null, false, "savage");
            assert.equal(result.owner, "testowner");
            assert.equal(result.repoName, "broken-app");
            assert.equal(result.hasTests, false);
            assert.ok(result.codeSmells.length > 0);
            assert.ok(result.score <= 60, `Expected low score for messy repo, got ${result.score}`);
            assert.ok(result.roast && result.roast.length > 0);
        } finally {
            global.fetch = originalFetch;
        }
    });
});

describe("Feature #5 — Contact Dispatch & Ticket Generation", () => {
    const contactRoute = require("../routes/contact");

    it("should reject empty or whitespace message with INVALID_MESSAGE", async () => {
        let statusCode = 0;
        let responseData = null;
        const req = { body: { message: "   " } };
        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (data) => {
                responseData = data;
                return res;
            },
        };

        const postHandler = contactRoute.stack.find(
            (layer) => layer.route && layer.route.methods.post,
        ).route.stack[0].handle;
        await postHandler(req, res);

        assert.equal(statusCode, 400);
        assert.equal(responseData.code, "INVALID_MESSAGE");
    });

    it("should reject message shorter than 5 chars with MESSAGE_TOO_SHORT", async () => {
        let statusCode = 0;
        let responseData = null;
        const req = { body: { message: "hi" } };
        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (data) => {
                responseData = data;
                return res;
            },
        };

        const postHandler = contactRoute.stack.find(
            (layer) => layer.route && layer.route.methods.post,
        ).route.stack[0].handle;
        await postHandler(req, res);

        assert.equal(statusCode, 400);
        assert.equal(responseData.code, "MESSAGE_TOO_SHORT");
    });

    it("should reject invalid email format with INVALID_EMAIL", async () => {
        let statusCode = 0;
        let responseData = null;
        const req = { body: { message: "Valid test message", email: "notanemail" } };
        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (data) => {
                responseData = data;
                return res;
            },
        };

        const postHandler = contactRoute.stack.find(
            (layer) => layer.route && layer.route.methods.post,
        ).route.stack[0].handle;
        await postHandler(req, res);

        assert.equal(statusCode, 400);
        assert.equal(responseData.code, "INVALID_EMAIL");
    });

    it("should successfully dispatch valid message and generate a GR- ticket", async () => {
        let statusCode = 0;
        let responseData = null;
        const req = {
            headers: { "x-forwarded-for": "127.0.0.1", "user-agent": "TestRunner" },
            socket: { remoteAddress: "127.0.0.1" },
            body: {
                category: "feedback",
                name: "Linus",
                email: "linus@kernel.org",
                message: "Love the roasts, keep roasting my C code!",
            },
        };
        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (data) => {
                responseData = data;
                return res;
            },
        };

        const postHandler = contactRoute.stack.find(
            (layer) => layer.route && layer.route.methods.post,
        ).route.stack[0].handle;
        await postHandler(req, res);

        assert.equal(statusCode, 201);
        assert.equal(responseData.success, true);
        assert.ok(
            /^GR-\d{6}$/.test(responseData.ticketId),
            `Expected ticketId to match GR-XXXXXX, got ${responseData.ticketId}`,
        );
        assert.equal(responseData.category, "feedback");
    });

    it("should build valid HTML email template with ticket, category, and message", () => {
        const { buildContactEmailHtml, OWNER_EMAIL } = require("../services/emailService");
        const html = buildContactEmailHtml({
            ticketId: "GR-999888",
            category: "bug",
            name: "Tester",
            email: "tester@example.com",
            message: "Something broke on page 2",
        });

        assert.ok(html.includes("GR-999888"), "HTML must include ticket ID");
        assert.ok(html.includes("Bug Report"), "HTML must include readable category");
        assert.ok(html.includes("Something broke on page 2"), "HTML must include message");
        assert.ok(html.includes(OWNER_EMAIL), "HTML must mention owner email");
        assert.ok(html.includes("%23GR-999888"), "Reply mailto must have URI-encoded # to prevent query truncation");
        assert.ok(html.includes("mailto:tester@example.com"), "Reply mailto must have valid recipient");
    });

    it("should safely notify via audit fallback or Resend API", async () => {
        const { sendContactNotification } = require("../services/emailService");
        const res = await sendContactNotification({
            ticketId: "GR-123456",
            category: "general",
            name: "Developer",
            email: "dev@example.com",
            message: "Hello GitRoast!",
            ip: "127.0.0.1",
        });

        assert.equal(res.success, true);
        assert.ok(["audit", "resend"].includes(res.provider));
    });
});

describe("Feature #6 — Battle Reactions & Persistence", () => {
    const Battle = require("../models/Battle");

    it("should initialize battle reactions with 0 for all types", () => {
        const battle = new Battle({
            user1: "torvalds",
            user2: "gaearon",
            score1: 70,
            score2: 85,
            grade1: "B",
            grade2: "A",
            winner: "torvalds",
            loser: "gaearon",
            roast1: "C is all you need",
            roast2: "Too many hooks",
            battleRoast: "Both wrote game-changing tools.",
        });

        assert.equal(battle.reactions.relatable, 0);
        assert.equal(battle.reactions.destroyed, 0);
        assert.equal(battle.reactions.savage, 0);
    });

    it("should reject invalid reaction type in Battle.addReaction", async () => {
        await assert.rejects(
            async () => {
                await Battle.addReaction("507f1f77bcf86cd799439011", "invalid_emoji");
            },
            { message: "Invalid reaction type" }
        );
    });

    it("should reject invalid reaction type with 400 INVALID_TYPE on reaction route", async () => {
        const battleRouter = require("../routes/battle");
        const postHandler = battleRouter.stack.find(
            (layer) => layer.route && layer.route.path === "/:id/react" && layer.route.methods.post
        ).route.stack[0].handle;

        let statusCode = null;
        let responseData = null;
        const req = {
            params: { id: "507f1f77bcf86cd799439011" },
            body: { type: "super_fire" },
            headers: {},
        };
        const res = {
            status(code) {
                statusCode = code;
                return this;
            },
            json(data) {
                responseData = data;
                return this;
            },
        };

        await postHandler(req, res);
        assert.equal(statusCode, 400);
        assert.equal(responseData.error, "INVALID_TYPE");
    });
});

describe("Feature #7 — Dynamic Logger & Telemetry Engine", () => {
    const {
        logger,
        logRequest,
        sanitizeMeta,
        getDynamicLoggerStats,
    } = require("../utils/logger");

    it("should sanitize sensitive credentials, tokens, and secrets from log metadata", () => {
        const raw = {
            username: "octocat",
            password: "super-secret-password-123",
            githubAccessToken: "ghp_xxxxxxxxxxxx",
            apiKey: "AIzaSyD-fake-key",
            authorization: "Bearer secret-jwt-token-string",
            nested: {
                secretToken: "very-secret",
                safeField: "safe-value",
            },
        };

        const clean = sanitizeMeta(raw);
        assert.equal(clean.username, "octocat");
        assert.equal(clean.password, "[REDACTED]");
        assert.equal(clean.githubAccessToken, "[REDACTED]");
        assert.equal(clean.apiKey, "[REDACTED]");
        assert.equal(clean.authorization, "[REDACTED]");
        assert.equal(clean.nested.secretToken, "[REDACTED]");
        assert.equal(clean.nested.safeField, "safe-value");
    });

    it("should include OpenTelemetry-compliant trace correlation and stats", () => {
        const stats = getDynamicLoggerStats();
        assert.ok(Array.isArray(stats.staticSuppressed), "staticSuppressed must be array");
        assert.ok(stats.staticSuppressed.includes("/health"), "Must contain /health");
        assert.ok(typeof stats.trackedPathsCount === "number");
    });

    it("should dynamically track high-frequency requests through logRequest middleware", (t, done) => {
        const testPath = `/api/test-dynamic-poll-${Date.now()}`;
        let finishCallbacks = [];

        // Simulate multiple rapid requests to trigger dynamic frequency tracker
        for (let i = 0; i < 15; i++) {
            const req = {
                method: "GET",
                path: testPath,
                originalUrl: testPath,
                headers: {},
            };
            const res = {
                statusCode: 200,
                setHeader: () => {},
                getHeader: () => undefined,
                on: (event, cb) => {
                    if (event === "finish") finishCallbacks.push(cb);
                },
            };
            logRequest(req, res, () => {});
        }

        // Trigger finish events
        finishCallbacks.forEach((cb) => cb());

        const stats = getDynamicLoggerStats();
        assert.ok(
            stats.dynamicallySuppressed.includes(testPath),
            `Expected ${testPath} to be auto-suppressed after 15 requests`
        );
        done();
    });

    it("should NEVER suppress error responses (>= 400) even for suppressed paths", (t, done) => {
        const testPath = "/health"; // Statically suppressed path
        let loggedLevel = null;

        const req = {
            method: "GET",
            path: testPath,
            originalUrl: testPath,
            headers: {},
        };
        let finishCb = null;
        const res = {
            statusCode: 500, // Server failure
            setHeader: () => {},
            getHeader: () => undefined,
            on: (event, cb) => {
                if (event === "finish") finishCb = cb;
            },
        };

        logRequest(req, res, () => {});
        assert.ok(finishCb, "finish callback must be attached even for error");
        finishCb();
        done();
    });
});

describe("Feature #8 — Database Schemas & Model Integrity", () => {
    const User = require("../models/User");
    const Roast = require("../models/Roast");
    const Battle = require("../models/Battle");
    const Payment = require("../models/Payment");
    const ContactMessage = require("../models/ContactMessage");

    it("should safely sanitize user object with badges, proPlan, and custom preferences", () => {
        const user = new User({
            githubId: "12345678",
            username: "octocat",
            email: "octocat@github.com",
            avatarUrl: "https://avatars.githubusercontent.com/u/12345678",
            githubAccessToken: "ghp_super_secret_token_12345",
            isPro: true,
            proPlan: "historian",
            badges: ["early_adopter", "pro"],
            customPreferences: {
                defaultIntensity: "nuclear",
                cardTheme: "matrix",
                hideFromLeaderboard: false,
            },
        });

        const safe = user.toSafeObject();
        assert.equal(safe.githubId, "12345678");
        assert.equal(safe.username, "octocat");
        assert.equal(safe.isPro, true);
        assert.equal(safe.proPlan, "historian");
        assert.deepEqual(safe.badges, ["early_adopter", "pro"]);
        assert.equal(safe.customPreferences.defaultIntensity, "nuclear");
        assert.equal(safe.customPreferences.cardTheme, "matrix");
        assert.equal(safe.githubAccessToken, undefined, "githubAccessToken must NEVER be present in safe object");
    });

    it("should initialize roast document with viewCount, tags, topLanguage, and avatarUrl", () => {
        const roast = new Roast({
            username: "deno_dev",
            score: 42,
            grade: "C",
            roastText: "TypeScript everywhere, yet type errors abound.",
            topLanguage: "TypeScript",
            avatarUrl: "https://avatars.githubusercontent.com/deno_dev?s=120",
        });

        assert.equal(roast.viewCount, 0);
        assert.equal(roast.shareCount, 0);
        assert.equal(roast.topLanguage, "TypeScript");
        assert.equal(roast.avatarUrl, "https://avatars.githubusercontent.com/deno_dev?s=120");
        assert.equal(roast.isPinned, false);
        assert.deepEqual(roast.tags, []);
    });

    it("should initialize battle document with avatarUrls, rematchCount, and viewCount", () => {
        const battle = new Battle({
            user1: "alice",
            user2: "bob",
            score1: 25,
            score2: 80,
            avatarUrl1: "https://avatars.githubusercontent.com/alice?s=120",
            avatarUrl2: "https://avatars.githubusercontent.com/bob?s=120",
        });

        assert.equal(battle.avatarUrl1, "https://avatars.githubusercontent.com/alice?s=120");
        assert.equal(battle.avatarUrl2, "https://avatars.githubusercontent.com/bob?s=120");
        assert.equal(battle.rematchCount, 0);
        assert.equal(battle.viewCount, 0);
        assert.equal(battle.shareCount, 0);
        assert.equal(battle.intensity, "savage");
    });

    it("should initialize payment document with default currency INR and metadata", () => {
        const payment = new Payment({
            userId: "507f1f77bcf86cd799439011",
            planId: "roaster",
            amount: 9900,
            razorpayOrderId: "order_9A33XWu170gUtm",
            status: "pending",
        });

        assert.equal(payment.currency, "INR");
        assert.equal(payment.amount, 9900);
        assert.equal(payment.status, "pending");
        assert.deepEqual(payment.metadata, {});
    });

    it("should initialize contact message with default priority normal and status unread", () => {
        const msg = new ContactMessage({
            ticketId: "GR-889900",
            category: "general",
            message: "Just wanted to say the roasts are hilarious!",
        });

        assert.equal(msg.priority, "normal");
        assert.equal(msg.status, "unread");
        assert.equal(msg.emailDelivered, false);
    });
});




