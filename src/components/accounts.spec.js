import {createAWSAccountLookupTable} from "./accounts.js";

describe("accounts", () => {
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

    describe("#createAWSAccountLookupTable", () => {
        test("creates flattened lookup table", () => {


            const lookup = createAWSAccountLookupTable(awsAccountMappings)

            expect(lookup).toEqual([
                {
                    "account_id": "01",
                    "account_name": "web-dev",
                    "pod_name": "Services",
                    "team_name": "Web Team"
                },
                {
                    "account_id": "02",
                    "account_name": "web-build",
                    "pod_name": "Services",
                    "team_name": "Web Team"
                },
                {
                    "account_id": "03",
                    "account_name": "web-staging",
                    "pod_name": "Services",
                    "team_name": "Web Team"
                },
                {
                    "account_id": "04",
                    "account_name": "web-integration",
                    "pod_name": "Services",
                    "team_name": "Web Team"
                },
                {
                    "account_id": "05",
                    "account_name": "web-production",
                    "pod_name": "Services",
                    "team_name": "Web Team"
                }
            ])
        })

    })

})
