import _ from "lodash";
import {daysBetween, expandDateProperties} from "./dates.js";
import {accountNameToService, removeOrg} from "./strings.js";

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
