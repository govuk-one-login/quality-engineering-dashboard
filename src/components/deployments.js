import _ from "lodash";
import {Temporal} from 'temporal-polyfill'

import {daysBetween, expandDateProperties} from "./dates.js";
import {accountNameToService, removeOrg, stackNameWithoutEnvironment} from "./strings.js";

import { createAWSAccountLookupTable } from "./accounts.js"

export function addAccountDetailsToDeployments (deployments, lookupTable) {
    return deployments.map((d) => {
        const mappedAccounts = _.mapKeys(lookupTable.find((account) => account["account_id"] === d["account-id"]), (v, k) => _.kebabCase(k))
        return {
            ...mappedAccounts,
            ...d,
            ["start-time"]: expandDateProperties(d["start-time-utc"]),
            ["end-time"]: expandDateProperties(d["end-time-utc"]),
            repository: removeOrg(d.repository),
            service: accountNameToService(mappedAccounts["account-name"])
        }
    })
}

export function flattenByCommitSha  (deployments) {
    return _.map(_.reduce(deployments, (acc, value, index) => {
        // const combinedKey = `${value["commit-sha"]}-${value["sam-stack-name"]}`;
        const combinedKey = `${value["commit-sha"]}`;
        acc[combinedKey] = {
            ...acc[combinedKey],
            ..._.pick(value, ["account-id", "account_name", "pod_name", "team_name", "commit-sha", "sam-stack-name"]),
            deployments: acc[combinedKey]?.deployments ? acc[combinedKey].deployments.concat(value) : [value],
            key: combinedKey,
        }

        return acc;
    }, {}), (item) => item)
}

export function groupByRepository(deployments) {
    return _.reduce(deployments, (acc, deployment) => {

        if (!acc[deployment["repository"]]) {
            acc[deployment["repository"]] = _.pick(deployment, ["account-id", "account-name", "pod-name", "team-name"])
            acc[deployment["repository"]]["deployments"] = [];
        }

        acc[deployment["repository"]]["deployments"].push(deployment);
        return acc
    }, {})
}

export function groupByRepositoryAndEnvironmentStage(deployments) {
    return _.reduce(deployments, (acc, deployment) => {

        const environmentStage = `${deployment["environment"]}${deployment["stage"] ? "-" + deployment["stage"] : ""}`;

        if (!acc[deployment["repository"]]) {
            acc[deployment["repository"]] = _.pick(deployment, ["pod-name", "team-name", "repository"])
            acc[deployment["repository"]]["deployments"] = [];
            acc[deployment["repository"]]["environmentStages"] = {};
        }

        acc[deployment["repository"]]["environmentStages"][environmentStage] = acc[deployment["repository"]]["environmentStages"][environmentStage] ? acc[deployment["repository"]]["environmentStages"][environmentStage] : [];

        acc[deployment["repository"]]["environmentStages"][environmentStage] = acc[deployment["repository"]]["environmentStages"][environmentStage].concat({environmentStage, ...deployment});

        return acc
    }, {})
}

export function processForDeploymentRecoveryDuration (deployments) {
    const commits =  flattenByCommitSha(deployments)

    const groupedByRepository = _.groupBy(commits, (commit) => commit["deployments"][0]["repository"])

    const groupedItems = _(groupedByRepository)
        .map(repository => ({
            commitCount: repository.length,
            commitsWithFailures: _.some(repository.deployments, {"build-success": "1"}),
            repo:repository
        }))
        .value()

    return groupedItems
}


export function calculateRestorationTime(deployments) {

    const grouped = groupByRepositoryAndEnvironmentStage(deployments);

    const restorations = _.map(grouped, (repository) => {

        return {
            ...repository,
            restorations: _.map(repository.environmentStages, (environmentStage) => {
                const stageDeployments = _.sortBy(environmentStage, (sd) => sd["end-time"].temporal.epochMilliseconds)

                let previousFailedDeployment = undefined;

                return _.reduce(stageDeployments, (acc, deployment) => {
                    if(deployment["build-success"] !== "1" && !previousFailedDeployment) {
                        previousFailedDeployment = deployment
                    }

                    if(deployment["build-success"] === "1" && previousFailedDeployment) {
                        acc.push({
                            ["failure-start-time"]: previousFailedDeployment["end-time"],
                            ["failure-end-time"]: deployment["end-time"],
                            duration: _.min([daysBetween(previousFailedDeployment["end-time"], deployment["end-time"]), 7]),
                            failedDeployment: previousFailedDeployment,
                            restoredDeployment: deployment,
                            ..._.pick(deployment, ["environmentStage", "environment", "stage", "pod-name", "team-name", "repository"])
                        })

                        previousFailedDeployment = undefined
                    }

                  return acc
                }, [])

            })
        }
    })
    return _.flattenDeep(_.map(restorations, restorations => restorations.restorations));
}


/// ----------

export function cleanDeploymentsData(deployments) {
    return deployments.map(({...d}) => {
        return {
            ...d,
            "repository": removeOrg(d.repository),
            "duration-minutes": Temporal.Instant.from(d["start-time-utc"]).until(Temporal.Instant.from(d["end-time-utc"])).round("minutes").total("minutes"),
            "duration": Temporal.Instant.from(d["start-time-utc"]).until(Temporal.Instant.from(d["end-time-utc"])),
            "build-success": d["build-success"] === "1",
            "start-time": Temporal.Instant.from(d["start-time-utc"]),
            "start-time-utc": d["start-time-utc"],
            "end-time": Temporal.Instant.from(d["end-time-utc"]),
            "end-time-utc": d["end-time-utc"],
            "stack": stackNameWithoutEnvironment(d["sam-stack-name"]),
            "devplatform.sam-pipelines.deployment": d["devplatform.sam-pipelines.deployment"] === "1"
        }
    })
}

export function annotateDeploymentsWithAccounts(deployments, awsAccountMappings) {
    const lookupTable = createAWSAccountLookupTable(awsAccountMappings)
    return deployments.map((d) => {
        const mappedAccounts = _.mapKeys(lookupTable.find((account) => account["account_id"] === d["account-id"]), (v, k) => _.kebabCase(k))
        return {
            ...mappedAccounts,
            service: accountNameToService(mappedAccounts["account-name"], d["repository"]),
            ...d
        }
    })
}

export function annotatedDeploymentsWithCompositeKey(deployments) {
    // return deployments[0]["sam-stack-name"]
    return deployments.map((d) => {
        return {
            "_key": `${d["service"]}__${stackNameWithoutEnvironment(d["sam-stack-name"])}__${d["commit-sha"]}`,
            "_service-stack": `${d["service"]}__${stackNameWithoutEnvironment(d["sam-stack-name"])}`,
            ...d,
        }
    })
}

export function minOfTemporals(d1, d2) {
    console.log(d1);
    console.log(d2);

    if(_.isNil(d1)) {
        return d2
    } else if(_.isNil(d2)) {
        return d1
    } else if (Temporal.Instant.compare(d1, d2)) {
        return d1
    } else {
        return d2
    }
}

export function maxOfTemporals(d1, d2) {
    console.log(d1);
    console.log(d2);

    if(_.isNil(d1)) {
        return d2
    } else if(_.isNil(d2)) {
        return d1
    } else if (Temporal.Instant.compare(d1, d2)) {
        return d2
    } else {
        return d1
    }
}

export function highest(previous, current) {

    // return current
    const levels = [
        "production-deploy",
        "production-fetch",
        "staging-promote",
        "staging-test",
        "staging-deploy",
        "staging-fetch",
        "build-promote",
        "build-parallel-test",
        "build-test",
        "build-deploy",
        "build-fetch",
        "not found"
    ]

    const prevIndex = levels.indexOf(previous)
    const currentIndex = levels.indexOf(current)

    // return current

    if (prevIndex === -1) {
        return previous
    } else if (currentIndex === -1) {
        return current
    } else if (currentIndex <= prevIndex) {
        return current
    } else if (prevIndex <= currentIndex) {
        return previous
    } else {
        return "not found"
    }
}

export function deploymentsAsServiceStackCommits(deployments) {
    const keyed = _.reduce(deployments, (acc, {
        // "account-id": accountId,
        // "account-name": accountName,
        // "build-success": buildSuccess,
        // "devplatform.sam-pipelines.deployment": samDeployment,
        // "sam-stack-name": samStackName,
        ...deployment}) => {

        acc[deployment._key] = acc[deployment._key] ?? {};
        acc[deployment._key].deployments = acc[deployment._key].deployments ?? [];
        let highestEnvironment = acc[deployment._key]["highest-environment"] ?? "not found";

        let startTime = deployment["start-time"];

        if (acc[deployment._key]["start-time"]) {
            startTime = _.minBy([
                acc[deployment._key]["start-time"],
                deployment["start-time"]
            ], (t) => t ? t.epochMilliseconds: 0);
        }

        let endTime = deployment["end-time"];

        if (acc[deployment._key]["end-time"]) {
            endTime = _.maxBy([
                acc[deployment._key]["end-time"],
                deployment["end-time"]
            ], (t) => t ? t.epochMilliseconds: 0);
        }

        const duration = startTime.until(endTime);
        const durationMinutes = duration.round("minutes").total("minutes")



        acc[deployment._key] = {
            ...acc[deployment._key],
            ..._.omit(deployment, ["build-success","environment","stage"]),
            "highest-environment": highest(highestEnvironment, `${deployment["environment"]}-${deployment["stage"]}`),
            "start-time": startTime,
            "start-time-utc": startTime.toString(),
            "end-time": endTime,
            "end-time-utc": endTime.toString(),
            duration,
            "duration-minutes": durationMinutes,
            "duration-minutes-clipped": _.min([8 * 60 * 0.5, durationMinutes]),
            deployments: acc[deployment._key].deployments.concat({...deployment}).sort((a, b) => Temporal.Instant.compare(a["start-time"], b["start-time"]))
        }

        return acc
    }, {})

    return _.values(keyed)
}

/*

cleanDeploymentsData()
    end-time + end-time-utc -> end-time (temporal)
    duration => duration (temporal)
    build-success => build-success (boolean)
    devplatform.sam-pipelines-deployment => devplatform.sam-pipelines-deployment (boolean)


addAccountsMetadata
    account-name
    team
    pod
    service


groupByCommit()

groupByCommitAndService()

filterByErroneousCommitMessages()

 */
