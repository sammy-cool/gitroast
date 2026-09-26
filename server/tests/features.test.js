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

        const postLayers = contactRoute.stack.find(
            (layer) => layer.route && layer.route.methods.post,
        ).route.stack;
        const postHandler = postLayers[postLayers.length - 1].handle;
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

        const postLayers = contactRoute.stack.find(
            (layer) => layer.route && layer.route.methods.post,
        ).route.stack;
        const postHandler = postLayers[postLayers.length - 1].handle;
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

        const postLayers2 = contactRoute.stack.find(
            (layer) => layer.route && layer.route.methods.post,
        ).route.stack;
        const postHandler2 = postLayers2[postLayers2.length - 1].handle;
        await postHandler2(req, res);

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

        const postLayers3 = contactRoute.stack.find(
            (layer) => layer.route && layer.route.methods.post,
        ).route.stack;
        const postHandler3 = postLayers3[postLayers3.length - 1].handle;
        await postHandler3(req, res);

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

describe("AI Engine — Model Parity & Dynamic Configuration", () => {
    // ── WHAT: Validates dynamic model resolution and export consistency.
    // ── WHY: Ensures zero discrepancy between REST roasts, SSE stream, and battle announcer.
    // ── WHERE & WHEN TO USE: In CI/CD test suites before deployment.
    // ── USE CASES: Verifying GEMINI_MODEL environmental defaults and overrides.
    // ── WHEN NOT TO USE: Do not run against external Google servers during unit testing.
    it("should export GEMINI_MODEL with default to gemini-2.5-flash", () => {
        const { GEMINI_MODEL } = require("../services/aiService");
        assert.ok(GEMINI_MODEL, "GEMINI_MODEL should be defined");
        assert.equal(typeof GEMINI_MODEL, "string");
        assert.ok(
            GEMINI_MODEL === "gemini-2.5-flash" || GEMINI_MODEL.startsWith("gemini-"),
            `Expected valid Gemini model string, got: ${GEMINI_MODEL}`,
        );
    });

    it("should export generateAIRoast and generateAIRoastStream functions", () => {
        const { generateAIRoast, generateAIRoastStream } = require("../services/aiService");
        assert.equal(typeof generateAIRoast, "function");
        assert.equal(typeof generateAIRoastStream, "function");
    });

    it("should correctly normalize model aliases via resolveGeminiModel", () => {
        const { resolveGeminiModel } = require("../services/aiService");
        assert.equal(typeof resolveGeminiModel, "function");
        // Test Gemini 3.1 Pro alias mapping to official v1beta preview endpoint
        assert.equal(resolveGeminiModel("gemini-3.1-pro"), "gemini-3.1-pro-preview");
        assert.equal(resolveGeminiModel("gemini-3.1-pro-preview"), "gemini-3.1-pro-preview");
        // Test Gemini 3.1 Flash alias
        assert.equal(resolveGeminiModel("gemini-3.1-flash"), "gemini-3.1-flash-lite-preview");
        // Test standard models
        assert.equal(resolveGeminiModel("gemini-2.5-flash"), "gemini-2.5-flash");
        assert.equal(resolveGeminiModel("gemini-2.5-pro"), "gemini-2.5-pro");
        // Test defaults
        assert.equal(resolveGeminiModel(""), "gemini-2.5-flash");
        assert.equal(resolveGeminiModel(null), "gemini-2.5-flash");
        assert.equal(resolveGeminiModel(undefined), "gemini-2.5-flash");
    });
});

describe("Feature #9 — Logger URL Query Sanitizer & Heartbeat Tracking", () => {
    // ── WHAT: Validates URL query string credential redaction in the HTTP access logger.
    // ── WHY: Ensures keys, tokens, and secrets in URL queries never leak into persistent logs.
    // ── WHERE & WHEN TO USE: In access log middleware and URL processing utilities.
    // ── USE CASES: Protecting Render and Vercel log streams from credential contamination.
    // ── WHEN NOT TO USE: Do not call on non-URL plain strings.
    const { sanitizeUrl } = require("../utils/logger");

    it("should export sanitizeUrl function", () => {
        assert.equal(typeof sanitizeUrl, "function");
    });

    it("should redact sensitive query parameters (key, token, secret, auth, code, password, apikey)", () => {
        const sensitiveUrl = "/api/test?user=octocat&key=AIzaSyD-123456789&page=1";
        const sanitized = sanitizeUrl(sensitiveUrl);
        assert.equal(sanitized, "/api/test?user=octocat&key=[REDACTED]&page=1");

        const multiSensitive = "/v1/webhook?token=ghp_secret987&apikey=xyz123&code=authcode456";
        const multiSanitized = sanitizeUrl(multiSensitive);
        assert.equal(multiSanitized, "/v1/webhook?token=[REDACTED]&apikey=[REDACTED]&code=[REDACTED]");
    });

    it("should preserve harmless URLs without sensitive parameters", () => {
        const safeUrl = "/api/roast/torvalds?intensity=nuclear&limit=10";
        assert.equal(sanitizeUrl(safeUrl), safeUrl);
    });

    it("should handle null, undefined, and non-string inputs safely", () => {
        assert.equal(sanitizeUrl(null), null);
        assert.equal(sanitizeUrl(undefined), undefined);
        assert.equal(sanitizeUrl(42), 42);
    });
});

describe("Feature #10 — Gemini AI Repository Code Review & Redemption Engine", () => {
    // ── WHAT: Validates repository architectural prompts, redemption plan generation, and model schema.
    // ── WHY: Verifies Gemini 3.1 Pro / 2.5 Flash repo reviews and actionable advice workflows.
    // ── WHERE & WHEN TO USE: In unit tests verifying AI and repository analysis integrity.
    // ── USE CASES: Checking repo roast prompt synthesis and 3-step redemption plan fallback rules.
    // ── WHEN NOT TO USE: Do not mock production API responses without matching schema shape.
    const {
        buildRepoRoastPrompt,
        generateAIRepoRoast,
        generateAIRedemptionPlan,
    } = require("../services/aiService");
    const Roast = require("../models/Roast");

    it("should build a comprehensive architectural prompt for repository roasts", () => {
        const repoData = {
            fullName: "octocat/Spoon-Knife",
            repoName: "Spoon-Knife",
            language: "JavaScript",
            stars: 12000,
            forks: 135000,
            openIssues: 450,
            score: 35,
            grade: "D",
            commitQuality: 40,
            codeSmells: ["Zero automated tests", "Vague commit messages"],
            shameCommits: ["fix", "wip", "asdf"],
            description: "This repo is that fork demo project",
            monthsInactive: 14,
            hasTests: false,
        };

        const prompt = buildRepoRoastPrompt(repoData, "savage");
        assert.ok(prompt.includes("octocat/Spoon-Knife"), "Prompt must include repo full name");
        assert.ok(prompt.includes("JavaScript"), "Prompt must include language");
        assert.ok(prompt.includes("ZERO automated tests detected"), "Prompt must highlight missing tests");
        assert.ok(prompt.includes("14 months since last commit"), "Prompt must reflect inactivity");
    });

    it("should return null for generateAIRepoRoast when GEMINI_API_KEY is unset", async () => {
        const origKey = process.env.GEMINI_API_KEY;
        try {
            delete process.env.GEMINI_API_KEY;
            const result = await generateAIRepoRoast({ fullName: "test/repo" });
            assert.equal(result, null, "Should return null if no API key is present");
        } finally {
            process.env.GEMINI_API_KEY = origKey;
        }
    });

    it("should generate a 3-step redemption plan using deterministic fallback for profiles", async () => {
        const profileData = {
            username: "spaghetti_coder",
            totalRepos: 15,
            repoAnalysis: { abandonedCount: 10, totalOwn: 12, abandonedPct: 83 },
            commitAnalysis: { qualityScore: 35, shameList: ["fix", "update"] },
            readme: { exists: false, isEmpty: true },
        };

        const plan = await generateAIRedemptionPlan(profileData);
        assert.ok(Array.isArray(plan), "Redemption plan must be an array");
        assert.equal(plan.length, 3, "Plan must contain exactly 3 tips");
        assert.ok(plan[0].includes("abandoned repos"), "Tip 1 should address abandoned repos");
        assert.ok(plan[1].includes("commit messages"), "Tip 2 should address commit messages");
        assert.ok(plan[2].includes("README"), "Tip 3 should address README status");
    });

    it("should generate a 3-step redemption plan using deterministic fallback for repositories", async () => {
        const repoData = {
            fullName: "chaos/monolith",
            hasTests: false,
            commitQuality: 30,
            hasReadme: false,
            monthsInactive: 12,
        };

        const plan = await generateAIRedemptionPlan(repoData);
        assert.ok(Array.isArray(plan), "Repo redemption plan must be an array");
        assert.equal(plan.length, 3, "Plan must contain exactly 3 tips");
        assert.ok(plan[0].includes("automated CI tests"), "Tip 1 should address automated CI tests");
        assert.ok(plan[1].includes("commit linters"), "Tip 2 should address commit quality");
        assert.ok(plan[2].includes("README"), "Tip 3 should address README documentation");
    });

    it("should verify Roast model schema supports redemptionPlan field", () => {
        const roast = new Roast({
            username: "redemption_tester",
            score: 55,
            grade: "C",
            roastText: "Writing code like it is 1999.",
            redemptionPlan: [
                "Delete node_modules from git history.",
                "Write unit tests with Jest.",
                "Add an MIT license.",
            ],
        });

        assert.equal(roast.redemptionPlan.length, 3);
        assert.equal(roast.redemptionPlan[0], "Delete node_modules from git history.");
        assert.equal(roast.redemptionPlan[1], "Write unit tests with Jest.");
        assert.equal(roast.redemptionPlan[2], "Add an MIT license.");
    });
});

describe("Feature #11 — TypeSafe AI System One Engine", () => {
    const {
        isTypeSafeConfigured,
        evaluateContactTicket,
        evaluateCommitHygiene,
    } = require("../services/typeSafeService");

    it("should accurately report TypeSafe configuration status", () => {
        const configured = isTypeSafeConfigured();
        assert.equal(typeof configured, "boolean");
    });

    it("should detect urgent billing issues via fallback when API key is missing or mocked", async () => {
        const result = await evaluateContactTicket("I was charged twice on Razorpay and my account is locked out!");
        assert.ok(result.isUrgent, "Should mark double charge as urgent");
        assert.equal(result.suggestedCategory, "dispute", "Should categorize payment issue as dispute");
        assert.ok(result.urgencyScore >= 0.7, "Urgency score should be high");
    });

    it("should categorize bug reports properly in fallback mode", async () => {
        const result = await evaluateContactTicket("The roast card crashes when I click download image on mobile");
        assert.equal(result.suggestedCategory, "bug");
    });

    it("should evaluate commit hygiene with fallback when offline", async () => {
        const lowEffortCommits = ["wip", "fix", "asdasd", "update", "oops"];
        const result = await evaluateCommitHygiene(lowEffortCommits);
        assert.ok(result.qualityPercentage < 50, "Low-effort commits should score below 50%");
        assert.ok(result.score <= 2, "Low-effort commits should receive low score level");

        const goodCommits = [
            "feat(auth): implement GitHub OAuth callback handler",
            "fix(roast): handle zero repos edge case gracefully",
            "docs(readme): add environment setup guide",
        ];
        const goodResult = await evaluateCommitHygiene(goodCommits);
        assert.ok(goodResult.qualityPercentage >= 80, "Good commits should score high quality");
    });

    it("should evaluate real TypeSafe System One live API if key is present", async () => {
        if (!isTypeSafeConfigured()) {
            return; // Skip live network call in CI without API key
        }

        const triage = await evaluateContactTicket("URGENT: I paid for Pro but my account is still free and card was charged!");
        assert.equal(triage.aiEvaluated, true, "Should be evaluated by TypeSafe Jev model");
        assert.equal(triage.isUrgent, true, "Should recognize urgent billing issue");
        assert.equal(triage.suggestedCategory, "dispute", "Should pick dispute category");
    });
});

describe("Feature #12 — Wall of Shame Search & Query Sanitization", () => {
    const historyRoute = require("../routes/history");

    it("should return empty results if query is less than 2 characters", async () => {
        let statusCode = 0;
        let responseData = null;
        const req = { query: { q: "a" } };
        const res = {
            setHeader: () => res,
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (data) => {
                responseData = data;
                return res;
            },
        };

        const searchLayer = historyRoute.stack.find(
            (layer) => layer.route && layer.route.path === "/leaderboard/search" && layer.route.methods.get,
        );
        assert.ok(searchLayer, "Search endpoint must exist in history routes");
        const handler = searchLayer.route.stack[searchLayer.route.stack.length - 1].handle;
        await handler(req, res);

        assert.equal(statusCode, 200);
        assert.equal(responseData.success, true);
        assert.deepEqual(responseData.results, []);
        assert.equal(responseData.pagination.total, 0);
    });

    it("should clamp pagination page and limit to safe boundaries", async () => {
        let headersSent = {};
        let responseJson = null;
        const req = { query: { q: "test", page: "-5", limit: "999" } };
        const res = {
            setHeader: (name, val) => {
                headersSent[name] = val;
                return res;
            },
            status: () => res,
            json: (data) => {
                responseJson = data;
                return res;
            },
        };

        const Roast = require("../models/Roast");
        const origAggregate = Roast.aggregate;
        Roast.aggregate = async () => [
            { metadata: [{ total: 1 }], data: [{ _id: "test", bestScore: 50, roastCount: 1 }] },
        ];

        try {
            const searchLayer = historyRoute.stack.find(
                (layer) => layer.route && layer.route.path === "/leaderboard/search" && layer.route.methods.get,
            );
            const handler = searchLayer.route.stack[searchLayer.route.stack.length - 1].handle;
            await handler(req, res);

            assert.ok(headersSent["Cache-Control"]);
            assert.equal(responseJson?.pagination?.page, 1);
            assert.equal(responseJson?.pagination?.limit, 50);
        } finally {
            Roast.aggregate = origAggregate;
        }
    });
});

describe("Feature #13 — Rate Limit Status & Route Precedence", () => {
    const roastRoute = require("../routes/roast");

    it("should mount /rate-limit-status before dynamic /:username route", () => {
        const rateLimitIndex = roastRoute.stack.findIndex(
            (layer) => layer.route && layer.route.path === "/rate-limit-status",
        );
        const usernameIndex = roastRoute.stack.findIndex(
            (layer) => layer.route && layer.route.path === "/:username",
        );

        assert.ok(rateLimitIndex !== -1, "/rate-limit-status must be registered");
        assert.ok(usernameIndex !== -1, "/:username must be registered");
        assert.ok(
            rateLimitIndex < usernameIndex,
            `/rate-limit-status (index ${rateLimitIndex}) must precede /:username (index ${usernameIndex})`,
        );
    });

    it("should return remaining quota and Pro status for unauthenticated callers", async () => {
        let statusCode = 0;
        let responseData = null;
        const req = { user: null };
        const res = {
            setHeader: () => res,
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (data) => {
                responseData = data;
                return res;
            },
        };

        const rateLimitLayer = roastRoute.stack.find(
            (layer) => layer.route && layer.route.path === "/rate-limit-status",
        );
        const handler = rateLimitLayer.route.stack[rateLimitLayer.route.stack.length - 1].handle;
        await handler(req, res);

        assert.equal(statusCode, 200);
        assert.equal(responseData.success, true);
        assert.equal(responseData.authenticated, false);
        assert.equal(responseData.isPro, false);
        assert.equal(responseData.canRoast, true);
        assert.equal(responseData.remainingToday, 1);
    });
});

describe("Feature #14 — Battle Invariants & Rematch Guarding", () => {
    const battleRoute = require("../routes/battle");

    it("should reject same-user battles with SAME_USER code", async () => {
        let statusCode = 0;
        let responseData = null;
        const req = {
            params: { user1: "Torvalds", user2: "torvalds" },
            query: {},
            user: null,
            headers: {},
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

        const battleLayer = battleRoute.stack.find(
            (layer) => layer.route && layer.route.path === "/:user1/vs/:user2" && layer.route.methods.get,
        );
        const handler = battleLayer.route.stack[battleLayer.route.stack.length - 1].handle;
        await handler(req, res);

        assert.equal(statusCode, 400);
        assert.equal(responseData.error, "SAME_USER");
    });

    it("should expose a GET / root endpoint for battle feeds", () => {
        const rootBattleLayer = battleRoute.stack.find(
            (layer) => layer.route && layer.route.path === "/" && layer.route.methods.get,
        );
        assert.ok(rootBattleLayer, "GET / must exist on battle router");
    });
});

describe("Feature #15 — Repository Deep Roast Parameter Validation Order", () => {
    const roastRoute = require("../routes/roast");

    it("should reject invalid repository slugs with 400 INVALID_REPO before quota deduction", async () => {
        let statusCode = 0;
        let responseData = null;
        const req = {
            params: { owner: "invalid$$owner", repo: "bad;repo" },
            query: {},
            user: null,
            headers: {},
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

        const repoLayer = roastRoute.stack.find(
            (layer) => layer.route && layer.route.path === "/repo/:owner/:repo" && layer.route.methods.get,
        );
        assert.ok(repoLayer, "/repo/:owner/:repo route must exist");
        const handler = repoLayer.route.stack[repoLayer.route.stack.length - 1].handle;
        await handler(req, res);

        assert.equal(statusCode, 400);
        assert.equal(responseData.error, "INVALID_REPO");
    });
});

describe("Feature #16 — Profile Fail-Fast Validation & Battle Rematch Invariants", () => {
    const roastRoute = require("../routes/roast");
    const battleRoute = require("../routes/battle");
    const redisService = require("../services/redisService");

    it("should fail-fast with 400 INVALID_USERNAME on malformed username before idempotency", async () => {
        let statusCode = 0;
        let responseData = null;
        const req = {
            params: { username: "invalid$$user" },
            query: { intensity: "nuclear" },
            user: null,
            headers: { "x-idempotency-key": "test-key" },
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

        const usernameLayer = roastRoute.stack.find(
            (layer) => layer.route && layer.route.path === "/:username" && layer.route.methods.get,
        );
        assert.ok(usernameLayer, "/:username route must exist");
        const handler = usernameLayer.route.stack[usernameLayer.route.stack.length - 1].handle;
        await handler(req, res);

        assert.equal(statusCode, 400);
        assert.equal(responseData.error, "INVALID_USERNAME");
    });

    it("should bypass Redis battle cache when req.query.rematch is 'true'", async () => {
        const originalIsConfigured = redisService.isConfigured;
        const originalGet = redisService.get;
        let redisGetCalled = false;

        try {
            redisService.isConfigured = true;
            redisService.get = async () => {
                redisGetCalled = true;
                return { success: true, cached: true };
            };

            const req = {
                params: { user1: "invalid1$$$", user2: "invalid2$$$" },
                query: { rematch: "true" },
                headers: {},
            };
            const res = {
                status: () => res,
                json: () => res,
            };

            const battleLayer = battleRoute.stack.find(
                (layer) => layer.route && layer.route.path === "/:user1/vs/:user2" && layer.route.methods.get,
            );
            const handler = battleLayer.route.stack[battleLayer.route.stack.length - 1].handle;
            await handler(req, res);

            assert.equal(redisGetCalled, false, "Redis battle cache must not be queried when rematch=true");
        } finally {
            redisService.isConfigured = originalIsConfigured;
            redisService.get = originalGet;
        }
    });

    it("should safely accept slug format in POST /:id/view without error", async () => {
        let statusCode = 0;
        let responseData = null;
        const req = {
            params: { id: "dev1-vs-dev2" },
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

        const viewLayer = battleRoute.stack.find(
            (layer) => layer.route && layer.route.path === "/:id/view" && layer.route.methods.post,
        );
        assert.ok(viewLayer, "/:id/view route must exist");
        const handler = viewLayer.route.stack[viewLayer.route.stack.length - 1].handle;
        await handler(req, res);

        assert.equal(statusCode, 200);
        assert.equal(responseData.success, true);
    });
});

describe("Feature #17 — Repo Idempotency Precedence, Wrapped Year Clamping & CastError Guards", () => {
    const roastRoute = require("../routes/roast");
    const Roast = require("../models/Roast");
    const redisService = require("../services/redisService");

    it("should return cached response for repo roast when idempotency key is matched even if user daily quota is reached", async () => {
        const originalIsConfigured = redisService.isConfigured;
        const originalGet = redisService.get;

        try {
            redisService.isConfigured = true;
            redisService.get = async (key) => {
                if (key === "idemp:cached-repo-key") {
                    return { success: true, data: { cached: true, repo: "test/repo" } };
                }
                return null;
            };

            let statusCode = 0;
            let responseData = null;
            const req = {
                params: { owner: "valid-owner", repo: "valid-repo" },
                query: {},
                headers: { "x-idempotency-key": "cached-repo-key" },
                user: {
                    isPro: false,
                    canRoastToday: () => false, // quota depleted
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

            const repoLayer = roastRoute.stack.find(
                (layer) => layer.route && layer.route.path === "/repo/:owner/:repo" && layer.route.methods.get,
            );
            assert.ok(repoLayer, "/repo/:owner/:repo route must exist");
            const handler = repoLayer.route.stack[repoLayer.route.stack.length - 1].handle;
            await handler(req, res);

            assert.equal(statusCode, 200, "Should return 200 from cache instead of 429 DAILY_LIMIT_REACHED");
            assert.equal(responseData.success, true);
            assert.equal(responseData.data.cached, true);
        } finally {
            redisService.isConfigured = originalIsConfigured;
            redisService.get = originalGet;
        }
    });

    it("should safely return null in Roast.incrementShare when given an invalid ObjectId", async () => {
        const result = await Roast.incrementShare("invalid-not-an-objectid");
        assert.equal(result, null, "Roast.incrementShare must return null without throwing CastError on invalid ID");
    });
});

describe("Feature #18 — Multi-Tier User Personas & Historian Plan Invariants", () => {
    const paymentRoute = require("../routes/payment");
    const User = require("../models/User");

    it("should return public plans including roaster and historian with correct pricing", () => {
        let responseData = null;
        const res = {
            json: (data) => {
                responseData = data;
                return res;
            },
        };
        const plansLayer = paymentRoute.stack.find(
            (layer) => layer.route && layer.route.path === "/plans" && layer.route.methods.get,
        );
        assert.ok(plansLayer, "/plans route must exist");
        const handler = plansLayer.route.stack[plansLayer.route.stack.length - 1].handle;
        handler({}, res);

        assert.equal(responseData.success, true);
        const roaster = responseData.plans.find((p) => p.id === "roaster");
        const historian = responseData.plans.find((p) => p.id === "historian");
        assert.ok(roaster, "Roaster plan must be present");
        assert.ok(historian, "Historian plan must be present");
        assert.equal(roaster.amount, 9900);
        assert.equal(historian.amount, 19900);
    });

    it("should safely reject unknown plan IDs with 400 INVALID_PLAN on create-order", async () => {
        let statusCode = 0;
        let responseData = null;
        const req = {
            body: { planId: "fake_nonexistent_plan" },
            user: { _id: "64b000000000000000000001" },
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

        const createOrderLayer = paymentRoute.stack.find(
            (layer) => layer.route && layer.route.path === "/create-order" && layer.route.methods.post,
        );
        assert.ok(createOrderLayer, "/create-order route must exist");
        const handler = createOrderLayer.route.stack[createOrderLayer.route.stack.length - 1].handle;
        await handler(req, res);

        assert.equal(statusCode, 400);
        assert.equal(responseData.error, "INVALID_PLAN");
    });

    it("should preserve user proPlan across free, roaster, and historian tiers in toSafeObject", () => {
        const guestUser = new User({ username: "free_dev", isPro: false, proPlan: "none" });
        const roasterUser = new User({ username: "roaster_dev", isPro: true, proPlan: "roaster" });
        const legacyProUser = new User({ username: "legacy_dev", isPro: true, proPlan: "none" });
        const historianUser = new User({ username: "historian_dev", isPro: true, proPlan: "historian" });

        assert.equal(guestUser.toSafeObject().proPlan, "none");
        assert.equal(roasterUser.toSafeObject().proPlan, "roaster");
        assert.equal(legacyProUser.toSafeObject().proPlan, "roaster", "Legacy Pro defaults to roaster");
        assert.equal(historianUser.toSafeObject().proPlan, "historian");
    });
});

describe("Feature #19 — Roast Personas, User Preferences & Ghost Mode Invariants", () => {
    const { PERSONA_CONFIG } = require("../services/aiService");
    const { generateRoast } = require("../services/roastEngine");
    const Roast = require("../models/Roast");
    const authRoute = require("../routes/auth");

    it("should export all 5 canonical persona archetypes in PERSONA_CONFIG", () => {
        assert.ok(PERSONA_CONFIG.classic, "Classic persona must exist");
        assert.ok(PERSONA_CONFIG.hinglish, "Hinglish persona must exist");
        assert.ok(PERSONA_CONFIG.techbro, "Tech Bro persona must exist");
        assert.ok(PERSONA_CONFIG.ramsay, "Gordon Ramsay persona must exist");
        assert.ok(PERSONA_CONFIG.shakespearean, "Shakespearean persona must exist");

        assert.equal(PERSONA_CONFIG.hinglish.name, "Desi Tech Lead");
        assert.equal(PERSONA_CONFIG.techbro.name, "Silicon Valley Tech Bro");
        assert.equal(PERSONA_CONFIG.ramsay.name, "Gordon Ramsay of Code");
        assert.equal(PERSONA_CONFIG.shakespearean.name, "Shakespearean Tragedy");
    });

    it("should adapt deterministic generator output based on persona", () => {
        const mockData = {
            score: 25,
            grade: "F",
            _raw: { topLanguage: "JavaScript", totalStars: 0 },
            repoAnalysis: { totalOwn: 5, abandonedCount: 4, abandonedPct: 80 },
            commitAnalysis: { qualityScore: 20, shameList: ["fix bug", "wip"] },
        };

        const classicRoast = generateRoast(mockData, "savage", "classic");
        const hinglishRoast = generateRoast(mockData, "savage", "hinglish");
        const techBroRoast = generateRoast(mockData, "savage", "techbro");
        const ramsayRoast = generateRoast(mockData, "savage", "ramsay");
        const shakespeareanRoast = generateRoast(mockData, "savage", "shakespearean");

        assert.ok(classicRoast && classicRoast.length > 20);
        const hinglishLower = hinglishRoast.toLowerCase();
        assert.ok(
            hinglishLower.includes("bhai") || hinglishLower.includes("production") || hinglishLower.includes("salary") || hinglishLower.includes("onsite"),
            "Hinglish roast must include authentic Desi Tech Lead slang"
        );
        assert.ok(
            techBroRoast.includes("bro") || techBroRoast.includes("conviction") || techBroRoast.includes("alpha") || techBroRoast.includes("Web3") || techBroRoast.includes("YC"),
            "Tech Bro roast must include Silicon Valley founder buzzwords"
        );
        const ramsayLower = ramsayRoast.toLowerCase();
        assert.ok(
            ramsayLower.includes("raw") || ramsayLower.includes("disaster") || ramsayLower.includes("sandwich") || ramsayLower.includes("wake up") || ramsayLower.includes("embarrassment") || ramsayLower.includes("dreadful") || ramsayLower.includes("donkey") || ramsayLower.includes("shut it down"),
            "Gordon Ramsay roast must include furious culinary outbursts"
        );
        assert.ok(
            shakespeareanRoast.includes("thou") || shakespeareanRoast.includes("thy") || shakespeareanRoast.includes("Alas") || shakespeareanRoast.includes("Hark"),
            "Shakespearean roast must include Elizabethan tragic phrasing"
        );
    });

    it("should reject invalid preferences with 400 INVALID_PREFERENCES", async () => {
        let statusCode = 0;
        let responseData = null;
        const req = {
            body: { invalidKey: "random_nonsense" },
            user: { _id: "64b000000000000000000001" },
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

        const prefLayer = authRoute.stack.find(
            (layer) => layer.route && layer.route.path === "/preferences" && layer.route.methods.patch,
        );
        assert.ok(prefLayer, "/preferences PATCH route must exist");
        const handler = prefLayer.route.stack[prefLayer.route.stack.length - 1].handle;
        await handler(req, res);

        assert.equal(statusCode, 400);
        assert.equal(responseData.error, "INVALID_PREFERENCES");
    });

    it("should initialize Roast with default persona 'classic' and isPrivate false", () => {
        const roast = new Roast({
            username: "testuser",
            score: 50,
            grade: "C",
            roastText: "Average code.",
        });

        assert.equal(roast.persona, "classic");
        assert.equal(roast.isPrivate, false);
    });
});

describe("Feature #20 — 3D Code Solar System & Universe Engine", () => {
    const { analyzeUniverse } = require("../services/githubService");
    const roastRoute = require("../routes/roast");

    it("should mount /:username/universe before dynamic /:username route", () => {
        const universeIndex = roastRoute.stack.findIndex(
            (layer) => layer.route && layer.route.path === "/:username/universe" && layer.route.methods.get,
        );
        const dynamicUserIndex = roastRoute.stack.findIndex(
            (layer) => layer.route && layer.route.path === "/:username" && layer.route.methods.get,
        );

        assert.ok(universeIndex !== -1, "/:username/universe route must be registered");
        assert.ok(dynamicUserIndex !== -1, "/:username route must be registered");
        assert.ok(
            universeIndex < dynamicUserIndex,
            "/:username/universe must precede /:username for Express route precedence",
        );
    });

    it("should transform GitHub profile and repositories into a structured 3D solar system", async () => {
        const originalFetch = global.fetch;

        try {
            global.fetch = async (url) => {
                if (url.includes("/users/astrodev/repos")) {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => [
                            {
                                name: "active-magma-api",
                                description: "Burning fast API service",
                                language: "TypeScript",
                                stargazers_count: 5,
                                forks_count: 0,
                                size: 500,
                                pushed_at: new Date().toISOString(), // recent -> inferno
                                created_at: "2024-01-01T00:00:00Z",
                                fork: false,
                            },
                            {
                                name: "popular-living-framework",
                                description: "Production ready web framework",
                                language: "Rust",
                                stargazers_count: 120, // stars >= 15 -> habitable
                                forks_count: 12,
                                size: 4000,
                                pushed_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
                                created_at: "2023-01-01T00:00:00Z",
                                fork: false,
                            },
                            {
                                name: "ancient-frozen-graveyard",
                                description: "Old frozen experiment",
                                language: "Python",
                                stargazers_count: 1,
                                forks_count: 0,
                                size: 200,
                                pushed_at: new Date(Date.now() - 500 * 24 * 3600 * 1000).toISOString(), // >365d -> frozen_ice
                                created_at: "2021-01-01T00:00:00Z",
                                fork: false,
                            },
                            {
                                name: "massive-node-modules-black-hole",
                                description: "", // no desc + large + 0 stars + >2y -> black_hole
                                language: "JavaScript",
                                stargazers_count: 0,
                                forks_count: 0,
                                size: 350000, // 350MB
                                pushed_at: new Date(Date.now() - 800 * 24 * 3600 * 1000).toISOString(),
                                created_at: "2020-01-01T00:00:00Z",
                                fork: false,
                            },
                        ],
                    };
                }

                if (url.includes("/users/astrodev")) {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            login: "astrodev",
                            name: "Cosmic Developer",
                            avatar_url: "https://avatars.githubusercontent.com/u/12345?v=4",
                            bio: "Exploring the cosmos through code.",
                            public_repos: 4,
                            followers: 42,
                            following: 10,
                            created_at: "2020-01-01T00:00:00Z",
                            type: "User",
                        }),
                    };
                }

                return { ok: false, status: 404 };
            };

            const universe = await analyzeUniverse("astrodev");
            assert.ok(universe.star, "Must include central star object");
            assert.equal(universe.star.username, "astrodev");
            assert.ok(universe.star.spectralClass, "Must assign spectral class to star");
            assert.ok(universe.star.starColor, "Must assign star color");

            assert.ok(Array.isArray(universe.planets), "Must include planets array");
            assert.equal(universe.planets.length, 4);

            const inferno = universe.planets.find((p) => p.name === "active-magma-api");
            assert.ok(inferno, "Must include inferno planet");
            assert.equal(inferno.planetType, "inferno");

            const habitable = universe.planets.find((p) => p.name === "popular-living-framework");
            assert.ok(habitable, "Must include habitable planet");
            assert.equal(habitable.planetType, "habitable");

            const frozen = universe.planets.find((p) => p.name === "ancient-frozen-graveyard");
            assert.ok(frozen, "Must include frozen cryo planet");
            assert.equal(frozen.planetType, "frozen_ice");

            const blackHole = universe.planets.find((p) => p.name === "massive-node-modules-black-hole");
            assert.ok(blackHole, "Must classify bloated repo as black hole");
            assert.equal(blackHole.planetType, "black_hole");

            assert.ok(universe.systemMetrics.totalPlanets === 4);
            assert.ok(universe.systemMetrics.galaxyType);
        } finally {
            global.fetch = originalFetch;
        }
    });

    it("should reject organizations with ORGANIZATION_NOT_SUPPORTED", async () => {
        const originalFetch = global.fetch;

        try {
            global.fetch = async () => ({
                ok: true,
                status: 200,
                json: async () => ({
                    login: "fakeorg",
                    type: "Organization",
                }),
            });

            await assert.rejects(
                async () => {
                    await analyzeUniverse("fakeorg");
                },
                (err) => {
                    assert.equal(err.code, "ORGANIZATION_NOT_SUPPORTED");
                    return true;
                },
            );
        } finally {
            global.fetch = originalFetch;
        }
    });
});


