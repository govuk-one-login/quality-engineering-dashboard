import _ from "lodash";

import { daysBetween } from "../components/dates.js"

export function applyDurationRangeToCommit(c, maxDuration = 60) {

    const startTimeObj = _.minBy(
        c.deployments, (d) => d["start-time"]["temporal"]["epochMilliseconds"])["start-time"]

    const endTimeObj = _.maxBy(
        c.deployments, (d) => d["end-time"]["temporal"]["epochMilliseconds"])["end-time"]

    const commitDuration = startTimeObj.temporal.until(endTimeObj.temporal, {
        largestUnit: "minute",
        smallestUnit: "minute",
        roundingMode: "ceil"
    }).minutes

    return {
        ...c,
        deployments: _.sortBy(c.deployments, (d) => d["start-time"]["temporal"]["epochMilliseconds"]),
        commits: _.groupBy(c.deployments, "commit-sha"),
        repository: c.deployments[0].repository,
        service: c.deployments[0].service,
        team: c.deployments[0]["team-name"],
        pod: c.deployments[0]["pod-name"],
        duration: _.min([300, commitDuration]),
        startTime: startTimeObj,
        endTime: endTimeObj,
    }
}

export function applyRecoveryDurationToCommit (c)  {
    return {
        ...c,
        rDuration: c.startTime.temporal.until(c.endTime.temporal, {
            largestUnit: "days",
            smallestUnit: "days",
            roundingMode: "floor"
        }).minutes,
        recoveryDuration: daysBetween(c.startTime, c.endTime)
    }
}