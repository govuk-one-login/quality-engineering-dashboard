import {expandDateProperties} from "./dates.js";
import {Temporal} from "temporal-polyfill";
import {applyDurationRangeToCommit} from "./commits.js";

describe("commits", () => {
    describe("#applyDurationRangeToCommit", () => {
        let commit;
        beforeEach(() => {
            const sourceCommit = {
                "commit-sha": "ABCDEFGHIJKLMNOP",
                "deployments": [
                    {
                        "commit-sha": "ABCDEF",
                        "repository": "test-repo",
                        "team-name": "test-team",
                        "pod-name": "test-pod-name",
                        "start-time": expandDateProperties("2025-01-01T12:00:00Z"),
                        "end-time": expandDateProperties("2025-01-01T12:10:00Z"),

                    },
                    {
                        "commit-sha": "GHIJHK",
                        "repository": "test-repo",
                        "team-name": "test-team",
                        "pod-name": "test-pod-name",
                        "start-time": expandDateProperties("2025-01-01T12:30:00Z"),
                        "end-time": expandDateProperties("2025-01-01T12:40:00Z"),
                    },
                    {
                        "commit-sha": "LMNOPQ",
                        "repository": "test-repo",
                        "team-name": "test-team",
                        "pod-name": "test-pod-name",
                        "start-time": expandDateProperties("2025-01-01T14:00:00Z"),
                        "end-time": expandDateProperties("2025-01-01T14:10:00Z"),

                    }
                ]
            }

            commit = applyDurationRangeToCommit(sourceCommit);
        })
        test.skip("should add minimum startTime to commit", () => {

            expect(Temporal.Instant.compare(
                commit.startTime.temporal,
                Temporal.Instant.from("2025-01-01T12:00:00Z"))
            ).toEqual(0)
        })

        test("should add maximum endTime to commit", () => {
            expect(Temporal.Instant.compare(
                commit.endTime.temporal,
                Temporal.Instant.from("2025-01-01T14:10:00Z"))
            ).toEqual(0)
        })

        describe("with duration under 60 minutes", () => {
            test.skip("should add duration as duration in minutes", () => {
                // remove last commit which takes total duration over 60 minutes
                commit.deployments.pop();

                expect(commit.duration).toEqual(60);

            })
        })
        describe("with duration over 60 minutes", () => {
            test.skip("should add duration as a ceiling capped 60 minutes", () => {
                expect(commit.duration).toEqual(60);
            })
        })
    })
})