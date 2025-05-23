// import {expect, jest, test} from '@jest/globals';


import {
    addAccountDetailsToDeployments,
    groupByRepository,
    flattenByCommitSha,
    calculateRestorationTime,
    groupByRepositoryAndEnvironmentStage,
    processForDeploymentRecoveryDuration
} from "./deployments"
import {expandDateProperties} from "./dates.js";

import {Temporal} from "temporal-polyfill";
import {createAWSAccountLookupTable} from "./accounts.js";
import {applyDurationRangeToCommit} from "./commits.js";

describe("deployments", () => {

    const awsAccountMappings = [
        {
            "pod_name": "Services",
            "teams": [
                {
                    "accounts": [
                        {
                            "account_id": "01",
                            "account_name": "web-dev"
                        },
                        {
                            "account_id": "02",
                            "account_name": "web-build"
                        },
                        {
                            "account_id": "03",
                            "account_name": "web-staging"
                        },
                        {
                            "account_id": "04",
                            "account_name": "web-integration"
                        },
                        {
                            "account_id": "05",
                            "account_name": "web-production"
                        }
                    ],
                    "contacts": [
                        "Veronica Mars",
                        "Nancy Drew"
                    ],
                    "slack_channel_id": "CS1Y50U3Y1A",
                    "slack_channel_name": "#ask-web-team",
                    "team_name": "Web Team"
                }
            ]
        }]


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
        test("should add minimum startTime to commit", () => {
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

    describe("#addAccountDetailsToDeployments", () => {
        let deployments;
        let lookupTable;

        beforeEach(() => {
            deployments = [
                {
                    "commit-sha": "ABCDEF",
                    "repository": "govuk-one-login/frontend",
                    "team-name": "Red Team",
                    "pod-name": "Colours",
                    "start-time-utc": "2025-01-01T12:00:00Z",
                    "end-time-utc": "2025-01-01T12:10:00Z",
                },
                {
                    "commit-sha": "GHIJHK",
                    "repository": "govuk-one-login/backend",
                    "team-name": "Blue Team",
                    "pod-name": "Colours",
                    "start-time-utc": "2025-01-01T12:30:00Z",
                    "end-time-utc": "2025-01-01T12:40:00Z",
                },
                {
                    "commit-sha": "LMNOPQ",
                    "repository": "govuk-one-login/monitoring",
                    "team-name": "Lion Team",
                    "pod-name": "Animals",
                    "start-time-utc": "2025-01-01T14:00:00Z",
                    "end-time-utc": "2025-01-01T14:10:00Z",
                }
            ]

            const lookupTable = [
                {}
            ]
        })

        test("should do something", () => {
            addAccountDetailsToDeployments
        })
    })

    describe("#groupByRepository", () => {
        test("should", () => {
            const deployments = [
                {
                    "commit-sha": "ABCDEF",
                    "repository": "test-repo",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "start-time-utc": "2025-01-01T12:00:00Z",
                    "end-time-utc": "2025-01-01T12:10:00Z",
                },
                {
                    "commit-sha": "GHIJHK",
                    "repository": "test-repo",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "start-time-utc": "2025-01-01T12:30:00Z",
                    "end-time-utc": "2025-01-01T12:40:00Z",
                },
                {
                    "commit-sha": "LMNOPQ",
                    "repository": "test-repo-archived",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "start-time-utc": "2025-01-01T14:00:00Z",
                    "end-time-utc": "2025-01-01T14:10:00Z",
                }
            ]

            const grouped = groupByRepository(deployments);

            expect(grouped).toEqual({
                "test-repo": {
                    "deployments": [
                        {
                            "commit-sha": "ABCDEF",
                            "end-time-utc": "2025-01-01T12:10:00Z",
                            "pod-name": "test-pod-name",
                            "repository": "test-repo",
                            "start-time-utc": "2025-01-01T12:00:00Z",
                            "team-name": "test-team"
                        },
                        {
                            "commit-sha": "GHIJHK",
                            "end-time-utc": "2025-01-01T12:40:00Z",
                            "pod-name": "test-pod-name",
                            "repository": "test-repo",
                            "start-time-utc": "2025-01-01T12:30:00Z",
                            "team-name": "test-team"
                        }
                    ],
                    "pod-name": "test-pod-name",
                    "team-name": "test-team"
                },
                "test-repo-archived": {
                    "deployments": [
                        {
                            "commit-sha": "LMNOPQ",
                            "end-time-utc": "2025-01-01T14:10:00Z",
                            "pod-name": "test-pod-name",
                            "repository": "test-repo-archived",
                            "start-time-utc": "2025-01-01T14:00:00Z",
                            "team-name": "test-team"
                        }
                    ],
                    "pod-name": "test-pod-name",
                    "team-name": "test-team"
                }
            })
        })
    })

    describe("#flattenByCommitSha", () => {
        test("should do", () => {
            const deployments = [
                {
                    "commit-sha": "ABCDEF",
                    "repository": "test-repo",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "start-time-utc": "2025-01-01T12:00:00Z",
                    "end-time-utc": "2025-01-01T12:10:00Z",
                },
                {
                    "commit-sha": "GHIJHK",
                    "repository": "test-repo",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "start-time-utc": "2025-01-01T12:30:00Z",
                    "end-time-utc": "2025-01-01T12:40:00Z",
                },
                {
                    "commit-sha": "LMNOPQ",
                    "repository": "test-repo-archived",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "start-time-utc": "2025-01-01T14:00:00Z",
                    "end-time-utc": "2025-01-01T14:10:00Z",
                }
            ]

            const flattened = flattenByCommitSha(deployments);

            expect(flattened).toEqual([
                {
                    "commit-sha": "ABCDEF",
                    "deployments": [
                        {
                            "commit-sha": "ABCDEF",
                            "end-time-utc": "2025-01-01T12:10:00Z",
                            "pod-name": "test-pod-name",
                            "repository": "test-repo",
                            "start-time-utc": "2025-01-01T12:00:00Z",
                            "team-name": "test-team"
                        }
                    ],
                    "key": "ABCDEF"
                },
                {
                    "commit-sha": "GHIJHK",
                    "deployments": [
                        {
                            "commit-sha": "GHIJHK",
                            "end-time-utc": "2025-01-01T12:40:00Z",
                            "pod-name": "test-pod-name",
                            "repository": "test-repo",
                            "start-time-utc": "2025-01-01T12:30:00Z",
                            "team-name": "test-team"
                        }
                    ],
                    "key": "GHIJHK"
                },
                {
                    "commit-sha": "LMNOPQ",
                    "deployments": [
                        {
                            "commit-sha": "LMNOPQ",
                            "end-time-utc": "2025-01-01T14:10:00Z",
                            "pod-name": "test-pod-name",
                            "repository": "test-repo-archived",
                            "start-time-utc": "2025-01-01T14:00:00Z",
                            "team-name": "test-team"
                        }
                    ],
                    "key": "LMNOPQ"
                }
            ])
        })
    })

    describe.skip("#groupByRepositoryAndEnvironmentStage", () => {
        test("should do", () => {
            const deployments = [
                {
                    "commit-sha": "ABCDEF",
                    "repository": "test-repo",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "environment": "dev",
                    "stage": "deploy",
                    "start-time-utc": "2025-01-01T12:00:00Z",
                    "end-time-utc": "2025-01-01T12:10:00Z",
                },
                {
                    "commit-sha": "GHIJHK",
                    "repository": "test-repo",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "environment": "dev",
                    "stage": "deploy",
                    "start-time-utc": "2025-01-01T12:30:00Z",
                    "end-time-utc": "2025-01-01T12:40:00Z",
                },
                {
                    "commit-sha": "LMNOPQ",
                    "repository": "test-repo-archived",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "environment": "dev",
                    "stage": "deploy",
                    "start-time-utc": "2025-01-01T14:00:00Z",
                    "end-time-utc": "2025-01-01T14:10:00Z",
                }
            ]

            const flattened = groupByRepositoryAndEnvironmentStage(deployments);

            expect(flattened).toEqual([
                {
                    "commit-sha": "ABCDEF",
                    "deployments": [
                        {
                            "commit-sha": "ABCDEF",
                            "end-time-utc": "2025-01-01T12:10:00Z",
                            "pod-name": "test-pod-name",
                            "repository": "test-repo",
                            "start-time-utc": "2025-01-01T12:00:00Z",
                            "team-name": "test-team"
                        }
                    ],
                    "key": "ABCDEF"
                },
                {
                    "commit-sha": "GHIJHK",
                    "deployments": [
                        {
                            "commit-sha": "GHIJHK",
                            "end-time-utc": "2025-01-01T12:40:00Z",
                            "pod-name": "test-pod-name",
                            "repository": "test-repo",
                            "start-time-utc": "2025-01-01T12:30:00Z",
                            "team-name": "test-team"
                        }
                    ],
                    "key": "GHIJHK"
                },
                {
                    "commit-sha": "LMNOPQ",
                    "deployments": [
                        {
                            "commit-sha": "LMNOPQ",
                            "end-time-utc": "2025-01-01T14:10:00Z",
                            "pod-name": "test-pod-name",
                            "repository": "test-repo-archived",
                            "start-time-utc": "2025-01-01T14:00:00Z",
                            "team-name": "test-team"
                        }
                    ],
                    "key": "LMNOPQ"
                }
            ])
        })
    })

    describe("#processForDeploymentRecoveryDuration", () => {
        test("should do", () => {
            const deployments = [
                {
                    "commit-sha": "ABCDEF",
                    "repository": "test-repo",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "start-time-utc": "2025-01-01T12:00:00Z",
                    "end-time-utc": "2025-01-01T12:10:00Z",
                },
                {
                    "commit-sha": "GHIJHK",
                    "repository": "test-repo",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "start-time-utc": "2025-01-01T12:30:00Z",
                    "end-time-utc": "2025-01-01T12:40:00Z",
                },
                {
                    "commit-sha": "LMNOPQ",
                    "repository": "test-repo-archived",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "start-time-utc": "2025-01-01T14:00:00Z",
                    "end-time-utc": "2025-01-01T14:10:00Z",
                }
            ]

            const flattened = processForDeploymentRecoveryDuration(deployments);

            expect(flattened).toEqual([
                {
                    "commitCount": 2,
                    "commitsWithFailures": false,
                    "repo": [
                        {
                            "commit-sha": "ABCDEF",
                            "deployments": [
                                {
                                    "commit-sha": "ABCDEF",
                                    "end-time-utc": "2025-01-01T12:10:00Z",
                                    "pod-name": "test-pod-name",
                                    "repository": "test-repo",
                                    "start-time-utc": "2025-01-01T12:00:00Z",
                                    "team-name": "test-team"
                                }
                            ],
                            "key": "ABCDEF"
                        },
                        {
                            "commit-sha": "GHIJHK",
                            "deployments": [
                                {
                                    "commit-sha": "GHIJHK",
                                    "end-time-utc": "2025-01-01T12:40:00Z",
                                    "pod-name": "test-pod-name",
                                    "repository": "test-repo",
                                    "start-time-utc": "2025-01-01T12:30:00Z",
                                    "team-name": "test-team"
                                }
                            ],
                            "key": "GHIJHK"
                        }
                    ]
                },
                {
                    "commitCount": 1,
                    "commitsWithFailures": false,
                    "repo": [
                        {
                            "commit-sha": "LMNOPQ",
                            "deployments": [
                                {
                                    "commit-sha": "LMNOPQ",
                                    "end-time-utc": "2025-01-01T14:10:00Z",
                                    "pod-name": "test-pod-name",
                                    "repository": "test-repo-archived",
                                    "start-time-utc": "2025-01-01T14:00:00Z",
                                    "team-name": "test-team"
                                }
                            ],
                            "key": "LMNOPQ"
                        }
                    ]
                }
            ])
        })
    })

    describe("#calculateRestorationTime", () => {
        test.skip("should do", () => {
            const deployments = [
                {
                    "commit-sha": "ABCDEF",
                    "repository": "test-repo",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "environment": "dev",
                    "stage": "deploy",
                    "build-success": "0",
                    "start-time": expandDateProperties("2025-01-01T12:00:00Z"),
                    "end-time": expandDateProperties("2025-01-01T12:10:00Z")
                },
                {
                    "commit-sha": "GHIJHK",
                    "repository": "test-repo",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "environment": "dev",
                    "stage": "deploy",
                    "build-success": "1",
                    "start-time": expandDateProperties("2025-01-01T12:30:00Z"),
                    "end-time": expandDateProperties("2025-01-01T12:40:00Z"),
                },
                {
                    "commit-sha": "LMNOPQ",
                    "repository": "test-repo-archived",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "environment": "dev",
                    "stage": "deploy",
                    "build-success": "1",
                    "start-time": expandDateProperties("2025-01-01T14:00:00Z"),
                    "end-time": expandDateProperties("2025-01-01T14:10:00Z"),
                }
            ]

            const flattened = calculateRestorationTime(deployments);

            expect(flattened).toEqual([
                {
                    "duration": 0,
                    "environment": "dev",
                    "environmentStage": "dev-deploy",
                    "failedDeployment": {
                        "build-success": "0",
                        "commit-sha": "ABCDEF",
                        "end-time": {
                            "date": "2025-01-01T12:10:00.000Z",
                            "day": "Wednesday",
                            "dayOfMonth": 1,
                            "dayOfYear": 1,
                            "hour": 12,
                            "month": "January",
                            "quarter": "Q1",
                            "quarterString": "Q1: Jan - Mar",
                            "temporal": Temporal.Instant.from("2025-01-01T12:10:00Z").toZonedDateTimeISO(
                                "Europe/London"),
                            "value": "2025-01-01T12:10:00Z",
                            "week": 1,
                            "weekOfYear": 1,
                            "weekend": "Weekday",
                            "year": 2025,
                            "yearWeek": "2025 01",
                        },
                        "environment": "dev",
                        "environmentStage": "dev-deploy",
                        "pod-name": "test-pod-name",
                        "repository": "test-repo",
                        "stage": "deploy",
                        "start-time": {
                            "date": "2025-01-01T12:00:00.000Z",
                            "day": "Wednesday",
                            "dayOfMonth": 1,
                            "dayOfYear": 1,
                            "hour": 12,
                            "month": "January",
                            "quarter": "Q1",
                            "quarterString": "Q1: Jan - Mar",
                            "temporal": Temporal.Instant.from("2025-01-01T12:00:00Z").toZonedDateTimeISO(
                                "Europe/London"),
                            "value": "2025-01-01T12:00:00Z",
                            "week": 1,
                            "weekOfYear": 1,
                            "weekend": "Weekday",
                            "year": 2025,
                            "yearWeek": "2025 01",
                        },
                        "team-name": "test-team"
                    },
                    "failure-end-time-utc": "2025-01-01T12:40:00Z",
                    "failure-start-time-utc": "2025-01-01T12:10:00Z",
                    "pod-name": "test-pod-name",
                    "repository": "test-repo",
                    "restoredDeployment": {
                        "build-success": "1",
                        "commit-sha": "GHIJHK",
                        "end-time": "2025-01-01T12:40:00Z",
                        "environment": "dev",
                        "environmentStage": "dev-deploy",
                        "pod-name": "test-pod-name",
                        "repository": "test-repo",
                        "stage": "deploy",
                        "start-time": "2025-01-01T12:30:00Z",
                        "team-name": "test-team"
                    },
                    "stage": "deploy",
                    "team-name": "test-team"
                }
            ])
        })
    })


    describe("#addAccountDetailsToDeployments", () => {
        test("something", () => {
            const lookupTable = createAWSAccountLookupTable(awsAccountMappings)

            const deployments = [
                {
                    "commit-sha": "ABCDEF",
                    "repository": "govuk-one-login/test-repo",
                    "account-id": "01",
                    "start-time-utc": "2025-01-01T12:00:00Z",
                    "end-time-utc": "2025-01-01T12:10:00Z",
                },
                {
                    "commit-sha": "GHIJHK",
                    "repository": "govuk-one-login/test-repo",
                    "account-id": "01",
                    "start-time-utc": "2025-01-01T12:30:00Z",
                    "end-time-utc": "2025-01-01T12:40:00Z",
                },
                {
                    "commit-sha": "LMNOPQ",
                    "repository": "govuk-one-login/test-repo-archived",
                    "account-id": "01",
                    "start-time-utc": "2025-01-01T14:00:00Z",
                    "end-time-utc": "2025-01-01T14:10:00Z",
                }
            ]

            const deploymentsWithAccountDetails = addAccountDetailsToDeployments(deployments, lookupTable)

            expect(deploymentsWithAccountDetails).toEqual([
                {
                    "account-id": "01",
                    "account-name": "web-dev",
                    "commit-sha": "ABCDEF",
                    "end-time": {
                        "date": new Date("2025-01-01T12:10:00Z"),
                        "day": "Wednesday",
                        "dayOfMonth": 1,
                        "dayOfYear": 1,
                        "hour": 12,
                        "month": "January",
                        "quarter": "Q1",
                        "quarterString": "Q1: Jan - Mar",
                        "temporal": Temporal.Instant.from("2025-01-01T12:10:00Z").toZonedDateTimeISO(
                            "Europe/London"),
                        "value": "2025-01-01T12:10:00Z",
                        "week": 1,
                        "weekOfYear": 1,
                        "year": 2025,
                        "yearWeek": "2025 01",
                        "weekend": "Weekday"
                    },
                    "end-time-utc": "2025-01-01T12:10:00Z",
                    "pod-name": "Services",
                    "repository": "test-repo",
                    "service": "web",
                    "start-time": {
                        "date": new Date("2025-01-01T12:00:00.000Z"),
                        "day": "Wednesday",
                        "dayOfMonth": 1,
                        "dayOfYear": 1,
                        "hour": 12,
                        "month": "January",
                        "quarter": "Q1",
                        "quarterString": "Q1: Jan - Mar",
                        "temporal": Temporal.Instant.from("2025-01-01T12:00:00Z").toZonedDateTimeISO("Europe/London"),
                        "value": "2025-01-01T12:00:00Z",
                        "week": 1,
                        "weekOfYear": 1,
                        "year": 2025,
                        "yearWeek": "2025 01",
                        "weekend": "Weekday"
                    },
                    "start-time-utc": "2025-01-01T12:00:00Z",
                    "team-name": "Web Team"
                },
                {
                    "account-id": "01",
                    "account-name": "web-dev",
                    "commit-sha": "GHIJHK",
                    "end-time": {
                        "date": new Date("2025-01-01T12:40:00.000Z"),
                        "day": "Wednesday",
                        "dayOfMonth": 1,
                        "dayOfYear": 1,
                        "hour": 12,
                        "month": "January",
                        "quarter": "Q1",
                        "quarterString": "Q1: Jan - Mar",
                        "temporal": Temporal.Instant.from("2025-01-01T12:40:00+00:00").toZonedDateTimeISO("Europe/London"),
                        "value": "2025-01-01T12:40:00Z",
                        "week": 1,
                        "weekOfYear": 1,
                        "year": 2025,
                        "yearWeek": "2025 01",
                        "weekend": "Weekday"
                    },
                    "end-time-utc": "2025-01-01T12:40:00Z",
                    "pod-name": "Services",
                    "repository": "test-repo",
                    "service": "web",
                    "start-time": {
                        "date": new Date("2025-01-01T12:30:00.000Z"),
                        "day": "Wednesday",
                        "dayOfMonth": 1,
                        "dayOfYear": 1,
                        "hour": 12,
                        "month": "January",
                        "quarter": "Q1",
                        "quarterString": "Q1: Jan - Mar",
                        "temporal": Temporal.Instant.from("2025-01-01T12:30:00+00:00").toZonedDateTimeISO("Europe/London"),
                        "value": "2025-01-01T12:30:00Z",
                        "week": 1,
                        "weekOfYear": 1,
                        "year": 2025,
                        "yearWeek": "2025 01",
                        "weekend": "Weekday"
                    },
                    "start-time-utc": "2025-01-01T12:30:00Z",
                    "team-name": "Web Team"
                },
                {
                    "account-id": "01",
                    "account-name": "web-dev",
                    "commit-sha": "LMNOPQ",
                    "end-time": {
                        "date": new Date("2025-01-01T14:10:00.000Z"),
                        "day": "Wednesday",
                        "dayOfMonth": 1,
                        "dayOfYear": 1,
                        "hour": 14,
                        "month": "January",
                        "quarter": "Q1",
                        "quarterString": "Q1: Jan - Mar",
                        "temporal": Temporal.Instant.from("2025-01-01T14:10:00+00:00").toZonedDateTimeISO("Europe/London"),
                        "value": "2025-01-01T14:10:00Z",
                        "week": 1,
                        "weekOfYear": 1,
                        "year": 2025,
                        "yearWeek": "2025 01",
                        "weekend": "Weekday"
                    },
                    "end-time-utc": "2025-01-01T14:10:00Z",
                    "pod-name": "Services",
                    "repository": "test-repo-archived",
                    "service": "web",
                    "start-time": {
                        "date": new Date("2025-01-01T14:00:00.000Z"),
                        "day": "Wednesday",
                        "dayOfMonth": 1,
                        "dayOfYear": 1,
                        "hour": 14,
                        "month": "January",
                        "quarter": "Q1",
                        "quarterString": "Q1: Jan - Mar",
                        "temporal": Temporal.Instant.from("2025-01-01T14:00:00+00:00").toZonedDateTimeISO("Europe/London"),
                        "value": "2025-01-01T14:00:00Z",
                        "week": 1,
                        "weekOfYear": 1,
                        "year": 2025,
                        "yearWeek": "2025 01",
                        "weekend": "Weekday"
                    },
                    "start-time-utc": "2025-01-01T14:00:00Z",
                    "team-name": "Web Team"
                }
            ])
        })
    })

    describe("#groupByRepositoryAndEnvironmentStage", () => {
        let grouped;
        beforeEach(() => {
            const deployments = [
                {
                    "commit-sha": "ABCDEF",
                    "repository": "test-repo",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "environment": "dev",
                    "stage": "deploy",
                    "start-time-utc": "2025-01-01T12:00:00Z",
                    "end-time-utc": "2025-01-01T12:10:00Z",
                },
                {
                    "commit-sha": "GHIJHK",
                    "repository": "test-repo",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "environment": "dev",
                    "stage": "deploy",
                    "start-time-utc": "2025-01-01T12:30:00Z",
                    "end-time-utc": "2025-01-01T12:40:00Z",
                },
                {
                    "commit-sha": "LMNOPQ",
                    "repository": "test-repo-archived",
                    "team-name": "test-team",
                    "pod-name": "test-pod-name",
                    "environment": "dev",
                    "stage": "deploy",
                    "start-time-utc": "2025-01-01T14:00:00Z",
                    "end-time-utc": "2025-01-01T14:10:00Z",
                }
            ];

            grouped = groupByRepositoryAndEnvironmentStage(deployments);
        })

        test("should group by environment stage", () => {
            expect(grouped).toEqual({
                "test-repo": {
                    "deployments": [],
                    "environmentStages": {
                        "dev-deploy": [
                            {
                                "commit-sha": "ABCDEF",
                                "end-time-utc": "2025-01-01T12:10:00Z",
                                "environment": "dev",
                                "environmentStage": "dev-deploy",
                                "pod-name": "test-pod-name",
                                "repository": "test-repo",
                                "stage": "deploy",
                                "start-time-utc": "2025-01-01T12:00:00Z",
                                "team-name": "test-team",
                            },
                            {
                                "commit-sha": "GHIJHK",
                                "end-time-utc": "2025-01-01T12:40:00Z",
                                "environment": "dev",
                                "environmentStage": "dev-deploy",
                                "pod-name": "test-pod-name",
                                "repository": "test-repo",
                                "stage": "deploy",
                                "start-time-utc": "2025-01-01T12:30:00Z",
                                "team-name": "test-team",
                            },
                        ],
                    },
                    "pod-name": "test-pod-name",
                    "repository": "test-repo",
                    "team-name": "test-team",
                },
                "test-repo-archived": {
                    "deployments": [],
                    "environmentStages": {
                        "dev-deploy": [
                            {
                                "commit-sha": "LMNOPQ",
                                "end-time-utc": "2025-01-01T14:10:00Z",
                                "environment": "dev",
                                "environmentStage": "dev-deploy",
                                "pod-name": "test-pod-name",
                                "repository": "test-repo-archived",
                                "stage": "deploy",
                                "start-time-utc": "2025-01-01T14:00:00Z",
                                "team-name": "test-team",
                            },
                        ],
                    },
                    "pod-name": "test-pod-name",
                    "repository": "test-repo-archived",
                    "team-name": "test-team",
                },
            })
        });


    });

});
