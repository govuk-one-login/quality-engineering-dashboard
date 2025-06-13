import {shortSha} from "./strings.js";

export const defaultTableOptions = {
    columns: [
        "pod_name",
        "team_name",
        "account_name",
        "sam-stack-name",
        "commit-sha",
        "environment",
        "stage",
        "start-time-utc",
        "build-success"
    ],
    header: {
        "build-success": "success?"
    },
    format: {
        "commit-sha": (x) => shortSha(x)
    },
    width: {
        "pod_name": 80,
        "team_name": 90,
        "commit-sha": 80,
        "environment": 80,
        "stage": 80,
        "build-success": 60
    }
}
