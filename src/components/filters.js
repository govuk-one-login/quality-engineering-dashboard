import _ from "lodash";

export function commitsWithSuccessfulProductionBuilds (c) {
    return _.some(c.deployments, {"environment": "production", "build-success": "1" })
}

export function commitsWithNonEmptyPods (c) {
    return !_.isUndefined(c.pod)
}

export function filterByQuarterWithKey(key) {
    return (quarter) => {

        return function (deployment) {
            if (quarter === _.get(deployment, key).quarter) {
                return true
            } else {
                return false
            }
        }
    }
}
