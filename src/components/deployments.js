import _ from "npm:lodash";

export function sortDeploymentsByDate (a, b) {
    return Date.parse(a["start-time-utc"]) - Date.parse(b["start-time-utc"])
}

export function filterByQuarter(quarter) {

    return function (deployment) {
        const deploymentMonth = new Date(deployment["start-time-utc"]).getMonth()
        if (quarter === "Q4" && _.inRange(deploymentMonth, 9, 12)) {
            return true
        } else if (quarter === "Q3" && _.inRange(deploymentMonth, 6, 9)) {
            return true
        } else {
            return false
        }
    }
}
export function shortSha(sha) {
    return _.truncate(sha, {length: 10, omission:''})
}

export function createAWSAccountLookupTable (awsAccountMappings) {
    return _.reduce(awsAccountMappings, (acc1, pod) => {
        return [...acc1, ..._.reduce(pod.teams, (acc2, team) => {
            return [ ...acc2, ..._.reduce(team.accounts, (acc3, account) => {
                return [...acc3, {pod_name: pod.pod_name, team_name: team.team_name, account_id: account.account_id, account_name: account.account_name}]
            }, [])]
        }, []) ]
    }, [])
}

export function addAccountDetailsToDeployments (deployments, lookupTable) {
    return deployments.map((d) => {
        return {
            ..._.mapKeys(lookupTable.find((account) => account["account_id"] === d["account-id"]), (v, k) => _.kebabCase(k)),
            ...d
        }
    })
}

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

export function applyDurationRangeToCommit (c, maxDuration) {
    const startTimeUTC =  _.pick(
        _.minBy(
            c.deployments, (d) => Date.parse(d["start-time-utc"])), ["start-time-utc"]
    )["start-time-utc"]

    const endTimeUTC = _.pick(
        _.maxBy(
            c.deployments, (d) => Date.parse(d["end-time-utc"])), ["end-time-utc"]
    )["end-time-utc"]

    return {
        ...c,
        repository: c.deployments[0].repository,
        team: c.deployments[0]["team-name"],
        pod: c.deployments[0]["pod-name"],
        duration: _.min([(Date.parse(endTimeUTC) - Date.parse(startTimeUTC))/1000/60, 60]),
        // duration: _.min([(Date.parse(endTimeUTC) - Date.parse(startTimeUTC))/1000/60/60, 24]),
        startTime: startTimeUTC,
        // startMinutes: new Date(Date.parse(startTimeUTC)).getUTCMinutes(),
        endTime: endTimeUTC,
        // endMinutes: new Date(Date.parse(endTimeUTC)).getUTCMinutes(),
    }
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
            // [`${value["environment"]}-${value.stage}-build-success`]: value["build-success"],
        }

        return acc;
    }, {}), (item) => item)
}

export function flattenByEnvironmentStage  (deployments) {

    // {
    // pod-name:
    // team-name:
    // repository:
    // }
    //
        return _.reduce(deployments, (acc1, pod) => {

            // return [...acc1, ..._.reduce(pod.teams, (acc2, team) => {
            //     return [ ...acc2, ..._.reduce(team.accounts, (acc3, account) => {
            //         return [...acc3, {pod_name: pod.pod_name, team_name: team.team_name, account_id: account.account_id, account_name: account.account_name}]
            //     }, [])]
            // }, []) ]
        }, {})

    // return _.map(_.reduce(deployments, (acc, value, index) => {
    //     // const combinedKey = `${value["commit-sha"]}-${value["sam-stack-name"]}`;
    //     const combinedKey = `${value["environment"]}${value["stage"] ? value["stage"] : ""}`;
    //     acc[combinedKey] = {
    //         ...acc[combinedKey],
    //         ..._.pick(value, ["account-id", "account_name", "pod_name", "team_name", "commit-sha", "sam-stack-name"]),
    //         deployments: acc[combinedKey]?.deployments ? acc[combinedKey].deployments.concat(value) : [value],
    //         key: combinedKey,
    //         // [`${value["environment"]}-${value.stage}-build-success`]: value["build-success"],
    //     }
    //
    //     return acc;
    // }, {}), (item) => item)
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
    /*

    account-id: "101836073728"
    account-name: "di-ipv-spot-prod"
    pod-name: "Identity"
    team-name: "SPOT"
    deployments:
    environmentStages: {
    build-fetch:
    build-deploy
    build-test
    staging-deploy:
    }

    =>

    enviromentStages[
        {environmentStage: "build-fetch" rank: 1}
     */
    return _.reduce(deployments, (acc, deployment) => {

        const environmentStage = `${deployment["environment"]}${deployment["stage"] ? "-" + deployment["stage"] : ""}`;

        if (!acc[deployment["repository"]]) {
            acc[deployment["repository"]] = _.pick(deployment, ["pod-name", "team-name", "repository"])
            acc[deployment["repository"]]["deployments"] = [];
            acc[deployment["repository"]]["environmentStages"] = {};
        }

        acc[deployment["repository"]]["environmentStages"][environmentStage] = acc[deployment["repository"]]["environmentStages"][environmentStage] ? acc[deployment["repository"]]["environmentStages"][environmentStage] : [];
        // _.defaults(acc[deployment["repository"]]["environmentStages"][environmentStage], [])
        //
        // acc[deployment["repository"]]["deployments"].push(deployment);


        acc[deployment["repository"]]["environmentStages"][environmentStage] = acc[deployment["repository"]]["environmentStages"][environmentStage].concat({environmentStage, ...deployment});

        return acc
    }, {})
}

export function processForDeploymentRecoveryDuration (deployments) {
    const commits =  flattenByCommitSha(deployments)

    const groupedByRepository = _.groupBy(commits, (commit) => commit["deployments"][0]["repository"])

    // return groupedByRepository
    // const sortedWithRepository = _.map(groupedByRepository, (sortDeploymentsByDate)

    // const groupedItems = _(deployments)
    //     .groupBy(deployment => deployment["commit-sha"])
    //     .groupBy(commit => commit[0]["repository"])
    //     .map(commitArray => ({commits: commitArray}))
    //     // .map((repository) => repository)
    //     // .sortBy(group => mappedDeployments.indexOf(group[0]))
    //     .value()


    const groupedItems = _(groupedByRepository)
        .map(repository => ({
            commitCount: repository.length,
            commitsWithFailures: _.some(repository.deployments, {"build-success": "1"}),
            repo:repository
        }))
        // .map((repository) => repository)
        // .sortBy(group => mappedDeployments.indexOf(group[0]))
        .value()


    return groupedItems
}
/*
- group deployments by commit-sha
 - group commits by repository
 - sort repo commits by start-time-utc
 = loop through all commits,
    - if all stages of a commit have succeeded, discard
    - or if any stage in a deployment of a commit has failed, record end-time-utc as failed-deployment-start
        - then if any stages of a following commit have failed, discard
        - if all stages of a following commit have succeeded, record end-time-utc as failed-deployment-end
        - repeat until successful commit found
        - store failed deployment data including duration
    - repeat until all commits
 */


/*
simpler grouping in nested arrays
const groupedItems = _(mappedDeployments)
    .groupBy(deployment => deployment["commit-sha"])
    .groupBy(commit => commit[0]["repository"])
    // .map((repository) => repository)
  // .sortBy(group => mappedDeployments.indexOf(group[0]))
  .value()
```

 */

export function applyDurationRangeToCommitWithSort (c, maxDuration) {
    const startTimeUTC =  _.pick(
        _.minBy(
            c.deployments, (d) => Date.parse(d["start-time-utc"])), ["start-time-utc"]
    )["start-time-utc"]

    const endTimeUTC = _.pick(
        _.maxBy(
            c.deployments, (d) => Date.parse(d["end-time-utc"])), ["end-time-utc"]
    )["end-time-utc"]

    return {
        ...c,
        deployments: _.sortBy(c.deployments, "start-time-utc"),
        commits: _.groupBy(c.deployments, "commit-sha"),
        repository: c.deployments[0].repository,
        team: c.deployments[0]["team-name"],
        pod: c.deployments[0]["pod-name"],
        duration: _.min([(Date.parse(endTimeUTC) - Date.parse(startTimeUTC))/1000/60, 60]),
        // duration: _.min([(Date.parse(endTimeUTC) - Date.parse(startTimeUTC))/1000/60/60, 24]),
        startTime: startTimeUTC,
        // startMinutes: new Date(Date.parse(startTimeUTC)).getUTCMinutes(),
        endTime: endTimeUTC,
        // endMinutes: new Date(Date.parse(endTimeUTC)).getUTCMinutes(),
    }
}

export function reduceByPipelineRestoration(repositories) {
    // return _.groupBy(repositories, "repository")

    return _.reduce(_.groupBy(repositories, "repository"), (acc, repository, repositoryName) => {

        if(!acc[repositoryName]) {
            acc[repository["repositoryName"]] = { restorations: [], ...repository}
        }



        return acc
    }, {})
}

// groupAndOrderCommits()
// group by repository - that's what we report on
// group by commit - that's the atomic change
// sort commits.deployments by time (proxy for account ordering)


// loop through commits.deployments, find first failure
    // record failure end-time-utc
    // continue until next success found in commit, or subsequent commits
    // record success end-time-utc
    // store times and duration as a restoration
    // continue until no more commits



export function calculateRestorationTime(deployments) {
// group deployments by repository - that's what we report on
// group deployments by environment-stage

    const grouped = groupByRepositoryAndEnvironmentStage(deployments);

// sort environment-stage by end-time-utc

    const sortedEnvironmentStage =  _.map(grouped, (repository) => {
        return {
            ...repository,
            environmentStages:_.map(repository.environmentStages, (environmentStage) => _.sortBy(environmentStage, ["end-time-utc"]))
            // environmentStages2: _(repository.environmentStages).map((environmentStage) => _.sortBy(environmentStage, ["end-time-utc"])).groupBy("environmentStage").value()
        }
    });
// for each environment-stage, determine if this is a restoration

    const restorations = _.map(grouped, (repository) => {


        return {
            ...repository,
            restorations: _.map(repository.environmentStages, (environmentStage) => {
                const stageDeployments = _.sortBy(environmentStage, ["end-time-utc"])

                let previousFailedDeployment = undefined;

                return _.reduce(stageDeployments, (acc, deployment) => {
                    if(deployment["build-success"] !== "1" && !previousFailedDeployment) {
                        previousFailedDeployment = deployment
                    }

                    if(deployment["build-success"] === "1" && previousFailedDeployment) {
                        acc.push({
                            ["failure-start-time-utc"]: previousFailedDeployment["end-time-utc"],
                            ["failure-end-time-utc"]: deployment["end-time-utc"],
                            duration: _.min([(Date.parse(deployment["end-time-utc"]) - Date.parse(previousFailedDeployment["end-time-utc"]))/1000/60/60/24, 7]),
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
// add stats to data

    return sortedEnvironmentStage;

//    return _.deployments
}
