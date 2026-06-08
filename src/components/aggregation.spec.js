import {calculateAggregationMetrics, calculateStatisticsPerCommit, createOrderedCommitLookup} from "./aggregation.js";

describe.only("aggregation", () => {
    describe("#createOrderedCommitLookup", () => {
        let deployments;

        beforeEach(() => {
            deployments = [
                {
                    "build-success": "1",
                    "commit-sha": "daeaf3ef1a6",
                    "end-time": "2025-09-02-12:15:00(BST)",
                    "end-time-utc": "2025-09-02T11:15:00Z",
                    "environment": "production",
                    "stage": "deploy",
                    "start-time": "2025-09-02-12:00:00(BST)",
                    "start-time-utc": "2025-09-02T11:00:00Z",
                },
                {
                    "build-success": "1",
                    "commit-sha": "daeaf3ef1a6",
                    "end-time": "2025-09-02-10:15:00(BST)",
                    "end-time-utc": "2025-09-02T09:15:00Z",
                    "environment": "build",
                    "stage": "deploy",
                    "start-time": "2025-09-02-10:00:00(BST)",
                    "start-time-utc": "2025-09-02T09:00:00Z",
                },
                {
                    "build-success": "1",
                    "commit-sha": "daeaf3ef1a6",
                    "end-time": "2025-09-02-11:15:00(BST)",
                    "end-time-utc": "2025-09-02T10:15:00Z",
                    "environment": "staging",
                    "stage": "deploy",
                    "start-time": "2025-09-02-11:00:00(BST)",
                    "start-time-utc": "2025-09-02T10:00:00Z",
                },
                {
                    "build-success": "1",
                    "commit-sha": "8d9f19600f3",
                    "end-time": "2025-08-02-11:45:00(BST)",
                    "end-time-utc": "2025-08-02T10:45:00Z",
                    "environment": "staging",
                    "stage": "deploy",
                    "start-time": "2025-08-02-11:30:00(BST)",
                    "start-time-utc": "2025-08-02T10:00:00Z",

                }
            ];
        })

        it("should create lookups", () => {
            const lookups = createOrderedCommitLookup(deployments);


            expect(lookups).toMatchObject({
                commits: {
                    'daeaf3ef1a6': [
                        {
                            "build-success": "1",
                            "commit-sha": "daeaf3ef1a6",
                            "end-time": "2025-09-02-12:15:00(BST)",
                            "end-time-utc": "2025-09-02T11:15:00Z",
                            "environment": "production",
                            "stage": "deploy",
                            "start-time": "2025-09-02-12:00:00(BST)",
                            "start-time-utc": "2025-09-02T11:00:00Z",
                        },
                        {
                            "build-success": "1",
                            "commit-sha": "daeaf3ef1a6",
                            "end-time": "2025-09-02-10:15:00(BST)",
                            "end-time-utc": "2025-09-02T09:15:00Z",
                            "environment": "build",
                            "stage": "deploy",
                            "start-time": "2025-09-02-10:00:00(BST)",
                            "start-time-utc": "2025-09-02T09:00:00Z",
                        },
                        {
                            "build-success": "1",
                            "commit-sha": "daeaf3ef1a6",
                            "end-time": "2025-09-02-11:15:00(BST)",
                            "end-time-utc": "2025-09-02T10:15:00Z",
                            "environment": "staging",
                            "stage": "deploy",
                            "start-time": "2025-09-02-11:00:00(BST)",
                            "start-time-utc": "2025-09-02T10:00:00Z",
                        }
                    ],
                    '8d9f19600f3': [
                        {
                            "build-success": "1",
                            "commit-sha": "8d9f19600f3",
                            "end-time": "2025-08-02-11:45:00(BST)",
                            "end-time-utc": "2025-08-02T10:45:00Z",
                            "environment": "staging",
                            "stage": "deploy",
                            "start-time": "2025-08-02-11:30:00(BST)",
                            "start-time-utc": "2025-08-02T10:00:00Z",

                        }
                    ]
                },
                lookup: [
                    {
                        "build-success": "1",
                        "commit-sha": "8d9f19600f3",
                        "end-time": "2025-08-02-11:45:00(BST)",
                        "end-time-utc": "2025-08-02T10:45:00Z",
                        "environment": "staging",
                        "stage": "deploy",
                        "start-time": "2025-08-02-11:30:00(BST)",
                        "start-time-utc": "2025-08-02T10:00:00Z",
                    },
                    {
                        "build-success": "1",
                        "commit-sha": "daeaf3ef1a6",
                        "end-time": "2025-09-02-10:15:00(BST)",
                        "end-time-utc": "2025-09-02T09:15:00Z",
                        "environment": "build",
                        "stage": "deploy",
                        "start-time": "2025-09-02-10:00:00(BST)",
                        "start-time-utc": "2025-09-02T09:00:00Z",
                    }
                ]
            });
        });

        it("should sort lookup", () => {
            const lookups = createOrderedCommitLookup(deployments);

            expect(new Date(lookups.lookup[0]["start-time-utc"]).getTime()).toBeLessThan(new Date(lookups.lookup[1]["start-time-utc"]).getTime());
        });
    })

    describe.only("#calculateStatisticsPerCommit", () => {
        let deployments;

        describe('with single commit', () => {
            beforeEach(() => {
                deployments = deployments = [
                    {
                        "build-success": "1",
                        "commit-sha": "daeaf3ef1a6",
                        "end-time": "2025-09-02-12:15:00(BST)",
                        "end-time-utc": "2025-09-02T11:15:00Z",
                        "environment": "production",
                        "stage": "deploy",
                        "start-time": "2025-09-02-12:00:00(BST)",
                        "start-time-utc": "2025-09-02T11:00:00Z",
                    },
                    {
                        "build-success": "1",
                        "commit-sha": "daeaf3ef1a6",
                        "end-time": "2025-09-02-10:15:00(BST)",
                        "end-time-utc": "2025-09-02T09:15:00Z",
                        "environment": "build",
                        "stage": "deploy",
                        "start-time": "2025-09-02-10:00:00(BST)",
                        "start-time-utc": "2025-09-02T09:00:00Z",
                    },
                    {
                        "build-success": "1",
                        "commit-sha": "daeaf3ef1a6",
                        "end-time": "2025-09-02-11:15:00(BST)",
                        "end-time-utc": "2025-09-02T10:15:00Z",
                        "environment": "staging",
                        "stage": "deploy",
                        "start-time": "2025-09-02-11:00:00(BST)",
                        "start-time-utc": "2025-09-02T10:00:00Z",
                    }
                ];
            });

            it("should create keyed structure", () => {
                const statistics = calculateStatisticsPerCommit(deployments);

                expect(statistics).toEqual([
                    {
                        "commits": ["daeaf3ef1a6"],
                        "deployments": [
                            {
                                "build-success": "1",
                                "commit-sha": "daeaf3ef1a6",
                                "end-time": "2025-09-02-12:15:00(BST)",
                                "end-time-utc": "2025-09-02T11:15:00Z",
                                "environment": "production",
                                "stage": "deploy",
                                "start-time": "2025-09-02-12:00:00(BST)",
                                "start-time-utc": "2025-09-02T11:00:00Z",
                            },
                            {
                                "build-success": "1",
                                "commit-sha": "daeaf3ef1a6",
                                "end-time": "2025-09-02-10:15:00(BST)",
                                "end-time-utc": "2025-09-02T09:15:00Z",
                                "environment": "build",
                                "stage": "deploy",
                                "start-time": "2025-09-02-10:00:00(BST)",
                                "start-time-utc": "2025-09-02T09:00:00Z",
                            },
                            {
                                "build-success": "1",
                                "commit-sha": "daeaf3ef1a6",
                                "end-time": "2025-09-02-11:15:00(BST)",
                                "end-time-utc": "2025-09-02T10:15:00Z",
                                "environment": "staging",
                                "stage": "deploy",
                                "start-time": "2025-09-02-11:00:00(BST)",
                                "start-time-utc": "2025-09-02T10:00:00Z",
                            }
                        ],
                        "start-time-utc": "2025-09-02T09:00:00Z",
                        "end-time-utc": "2025-09-02T11:00:00Z"
                    }
                ]);
            })
        })

        it('should pick earliest start time', () => {
        })
        it('should pick latest end time', () => {
        })
    })

    describe('with multiple commits', () => {
    })


// describe.skip("#calculateAggregationMetrics", () => {
//     let deployments;
//
//     describe("with single deployment in one environment", () => {
//         beforeEach(() => {
//             deployments = [
//                 {
//                     "account-id": "325730373996",
//                     "build-success": "1",
//                     "commit-sha": "daeaf3ef1a6",
//                     "duration": "00:04:15",
//                     "end-time": "2025-09-02-11:15:00(BST)",
//                     "end-time-utc": "2025-09-02T10:15:00Z",
//                     "environment": "production",
//                     "pipeline-version": "v2.62.0",
//                     "repository": "govuk-one-login/onboarding-self-service-experience",
//                     "sam-stack-name": "self-service-cognito",
//                     "stage": "deploy",
//                     "start-time": "2025-09-02-11:00:00(BST)",
//                     "start-time-utc": "2025-09-02T10:00:00Z",
//                     "devplatform.sam-pipelines.deployment": "1"
//                 }
//             ];
//         })
//
//         it("should extract commits", () => {
//             const metrics = calculateAggregationMetrics(deployments);
//
//             console.log(metrics);
//
//             expect(metrics).toMatchObject({
//                 commits: ["daeaf3ef1a6"]
//             });
//         });
//
//         it("should use start-time-utc and end-time-utc", () => {
//             const metrics = calculateAggregationMetrics(deployments);
//
//             console.log(metrics);
//
//             expect(metrics).toMatchObject({
//                 "start-time-utc": "2025-09-02T10:00:00Z",
//                 "end-time-utc": "2025-09-02T10:15:00Z",
//             });
//         });
//
//         it("should calculate duration", () => {
//             const metrics = calculateAggregationMetrics(deployments);
//
//             console.log(metrics);
//
//             expect(metrics).toMatchObject({
//                 "time-to-production": "PT15M",
//             });
//         });
//     })
//
//     // this can't work if we're only counting from the last production deploy!
//     describe.skip("with single deployment in multiple environments", () => {
//         beforeEach(() => {
//             deployments = [
//                 {
//                     "account-id": "00001",
//                     "build-success": "1",
//                     "commit-sha": "daeaf3ef1a6",
//                     "duration": "00:04:15",
//                     "end-time": "2025-09-02-11:15:00(BST)",
//                     "end-time-utc": "2025-09-02T10:15:00Z",
//                     "environment": "staging",
//                     "pipeline-version": "v2.62.0",
//                     "repository": "govuk-one-login/onboarding-self-service-experience",
//                     "sam-stack-name": "self-service-cognito",
//                     "stage": "deploy",
//                     "start-time": "2025-09-02-11:00:00(BST)",
//                     "start-time-utc": "2025-09-02T10:00:00Z",
//                     "devplatform.sam-pipelines.deployment": "1"
//                 },
//                 {
//                     "account-id": "00020",
//                     "build-success": "1",
//                     "commit-sha": "daeaf3ef1a6",
//                     "duration": "00:04:15",
//                     "end-time": "2025-09-02-11:45:00(BST)",
//                     "end-time-utc": "2025-09-02T10:45:00Z",
//                     "environment": "production",
//                     "pipeline-version": "v2.62.0",
//                     "repository": "govuk-one-login/onboarding-self-service-experience",
//                     "sam-stack-name": "self-service-cognito",
//                     "stage": "deploy",
//                     "start-time": "2025-09-02-11:30:00(BST)",
//                     "start-time-utc": "2025-09-02T10:30:00Z",
//                     "devplatform.sam-pipelines.deployment": "1"
//                 }
//             ];
//         })
//
//         it("should extract commits", () => {
//             const metrics = calculateAggregationMetrics(deployments);
//
//             console.log(metrics);
//
//             expect(metrics).toMatchObject({
//                 commits: ["daeaf3ef1a6"]
//             });
//         });
//
//         it("should use start-time-utc and end-time-utc", () => {
//             const metrics = calculateAggregationMetrics(deployments);
//
//             console.log(metrics);
//
//             expect(metrics).toMatchObject({
//                 "start-time-utc": "2025-09-02T10:00:00Z",
//                 "end-time-utc": "2025-09-02T10:45:00Z",
//             });
//         });
//
//         it("should calculate duration", () => {
//             const metrics = calculateAggregationMetrics(deployments);
//
//             console.log(metrics);
//
//             expect(metrics).toMatchObject({
//                 "time-to-production": "PT45M",
//             });
//
//         });
//     })
//
//     describe("with multiple deployments in one environment", () => {
//         beforeEach(() => {
//             deployments = [
//                 {
//                     "build-success": "1",
//                     "commit-sha": "daeaf3ef1a6",
//                     "end-time-utc": "2025-09-02T10:15:00Z",
//                     "environment": "production",
//                     "stage": "deploy",
//                     "start-time-utc": "2025-09-02T10:00:00Z"
//                 },
//                 {
//                     "build-success": "1",
//                     "commit-sha": "9a1809ae1f",
//                     "end-time-utc": "2025-09-03T10:45:00Z",
//                     "environment": "production",
//                     "stage": "deploy",
//                     "start-time-utc": "2025-09-03T10:30:00Z"
//                 }
//             ];
//         })
//
//         it("should return an object shaped", () => {
//             const metrics = calculateAggregationMetrics(deployments);
//
//             expect(metrics).toMatchObject([
//                 {
//                     commits: [],
//                     "start-time-utc": "2100-12-31T23:59:59Z",
//                     "end-time-utc": "1900-01-01T00:00:00Z",
//                     "time-to-production": "P1M"
//                 },
//                 {
//                     commits: [],
//                     "start-time-utc": "2100-12-31T23:59:59Z",
//                     "end-time-utc": "1900-01-01T00:00:00Z",
//                     "time-to-production": "P1M"
//                 }
//             ])
//         });
//
//         it("should extract commits", () => {
//             const metrics = calculateAggregationMetrics(deployments);
//
//             console.log(metrics);
//
//             expect(metrics).toMatchObject({
//                 commits: ["daeaf3ef1a6"]
//             });
//         });
//
//         it("should use start-time-utc and end-time-utc", () => {
//             const metrics = calculateAggregationMetrics(deployments);
//
//             console.log(metrics);
//
//             expect(metrics).toMatchObject({
//                 "start-time-utc": "2025-09-02T10:00:00Z",
//                 "end-time-utc": "2025-09-02T10:45:00Z",
//             });
//         });
//
//         it("should calculate duration", () => {
//             const metrics = calculateAggregationMetrics(deployments);
//
//             console.log(metrics);
//
//             expect(metrics).toMatchObject({
//                 "time-to-production": "PT45M",
//             });
//
//         });
//     })
// });
});
