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
        assert.ok(/node_modules|npm|javascript/i.test(jsLine), `Expected JS tropes, got: ${jsLine}`);
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
});
