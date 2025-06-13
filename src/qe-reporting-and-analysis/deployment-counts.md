# ~~Change~~ Deployment Failure Rate

```js
import {
    addAccountDetailsToDeployments
} from "../components/deployments.js";

import { createAWSAccountLookupTable } from "../components/accounts.js"
```


```js
const awsAccountMappings = FileAttachment("../data/config/aws-accountid-config.json").json()
```

```js
const allDeployments = FileAttachment("../data/config/deployments.csv").csv();
```

<p></p>

## Background

<div class="caution" label="General cautions">

- Until incidents are combined with this data, it is only a measure of deployment failure rate
- The existence of paused pipelines, canary deployments, canary rollbacks and superseded deployments are not recorded in the data so the effect is unable to be separated from test failures
- Not all services have testing phases in environments, not all services deploy to production
    - These gaps affect the ability to provide useful metrics in aggregate

</div>


<div class="grid grid-cols-2"  style="grid-auto-rows: auto;">
<div class="tip grid-rowspan-2" label="Rules">

- data is recorded as many deployments in many environments, but the change is originally sourced from a single atomic commit (`commit-sha`)

- if a commit has `build-success` always equalling 1, then it is a successful deployment
- if a commit does not have a production environment value, then either a pipeline was paused, or the deployment is not intended for production
- if a commit does not have a integration environment value, then either a pipeline was paused, or the deployment is not intended for integration
- if a commit does not have a staging environment value, then either a pipeline was paused, or the deployment is not intended for staging
- if a commit has any `build-success` equalling 0, and a production `build-success` equalling 1, then it is a retried deployment
- if a sha contains a `stage` with `test` then a post-deployment test was applied as part of the secure pipelines in this `environment`

</div>

<div class="caution" label="Incorrect assumptions">

- a SHA represents a single unique deployment to production
- a SHA will only appear once per stage/environment/build-success combination
- a SHA will only be associated with one stack name used for one purpose

</div>

<div class="note" label="Questions">

Does the data show anything to indicate:
- a canary deployment
- an automatic rollback
- a superseded deployment
- a paused/resumed pipeline

</div>
</div>

```js
const mappedDeployments = addAccountDetailsToDeployments(allDeployments, createAWSAccountLookupTable(awsAccountMappings))
```

```js
const minDate = _.minBy(mappedDeployments, (d) => d["start-time-utc"])["start-time-utc"]
const maxDate = _.maxBy(mappedDeployments, (d) => d["start-time-utc"])["start-time-utc"]
```

```js

const start = view(Inputs.date({label: "Start", value: minDate, min: minDate, max: maxDate}));
const startDate = Generators.input(start)
```
```js
const end = view(Inputs.date({label: "End", value: maxDate, min: minDate, max: maxDate}));
const endDate = Generators.input(end)
```

# Total deployed commits - ${mappedDeployments.filter(filterShasByDateRange).length}

<p>
</p>

# Metrics By Pod

<p></p>

## Percentage of successful deployments per environment

```js
const filterShasByDateRange = function (d) {
    return d["environment"] === "build" && d["stage"] === "deploy" &&
    Date.parse(d["start-time-utc"]) >= new Date(start).setUTCHours(0,0,0,0) &&
        Date.parse(d["start-time-utc"]) <= new Date(end).setUTCHours(23,59,59,999)
}

const filteredShas = mappedDeployments.filter(filterShasByDateRange).map((d) => d["commit-sha"])
const rangedDeployments = mappedDeployments.filter((d) => (d["pod-name"] !== "PSRE") && (d["pod-name"] !== "undefined") && (!d["repository"].includes("stub")) && (!d["repository"].includes("performance-testing"))).filter((d) => !d["repository"].includes("stub")).filter((d) => filteredShas.includes(d["commit-sha"]))
// const rangedDeployments = mappedDeployments.filter((d) => Date.parse(d["start-time-utc"]) >= start && Date.parse(d["start-time-utc"]) <= end)
```

```js
// display(filteredShas)
// display(rangedDeploymentsBySha)
// display(mappedDeployments)
// display(rangedDeployments)
```
```js
const spotDeployments = mappedDeployments.filter((d) => d["team-name"] === "SPOT")
// display(spotDeployments.sort(sortDeploymentsByDate).reverse())
```

```js
const flattenByCommitSha = function (deployments) {
    return _.map(_.reduce(deployments, (acc, value, index) => {
        // const combinedKey = `${value["commit-sha"]}-${value["sam-stack-name"]}`;
        const combinedKey = `$value["commit-sha"]}`;
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
```

```js
const failuresInProd = flattenByCommitSha(spotDeployments).filter((c) => c.deployments.some((d) => d["environment"] === "production" && d["build-success"] === "0"))
const failuresAnywhere = flattenByCommitSha(spotDeployments).filter((c) => c.deployments.some((d) => d["build-success"] === "0"))
```

```js
const deploymentsByRepo = _.groupBy(spotDeployments, "repository")
```

```js
const oldCommitsByPodTeamRepo = function (deployments) {
    const commits = {}
    const repositories = _.groupBy(deployments, "repository")

    _.reduce(repositories, (acc, value, index) => {
        // Pod
        _.defaults(commits, {[value[0]["pod-name"]]: {}})
        // Team
        _.defaults(commits[value[0]["pod-name"]], {[value[0]["team-name"]]: {}})

        // Repo
        _.defaults(commits[value[0]["pod-name"]][value[0]["team-name"]], {[value[0]["repository"]]: _.groupBy(value, "commit-sha")})

    }, commits)

    return commits
}

const commitsByPodTeamRepo = function (deployments) {
    const commits = {}
    const repositories = _.groupBy(deployments, "repository")

    _.reduce(repositories, (acc, value, index) => {
        // Pod
        _.defaults(commits, {[value[0]["pod-name"]]: {}})
        // Team
        _.defaults(commits[value[0]["pod-name"]], {[value[0]["team-name"]]: {}})

        // Repo
        _.defaults(commits[value[0]["pod-name"]][value[0]["team-name"]], {[value[0]["repository"]]: _.groupBy(value, "commit-sha")})

    }, commits)

    return commits
}
```

```js
const calculateStatsForCommitDeployments = function (commit) {
    const base = {
        "pod-name": commit[0]["pod-name"],
        "team-name": commit[0]["team-name"],
        "repository": commit[0]["repository"],
        "commit-sha": commit[0]["commit-sha"]

    }
    return _.reduce(commit, (acc, value) => {
        const envStage = `${value.environment}-${value.stage}`
        _.defaults(acc, {[envStage]: []})

        acc[envStage].push({[value["start-time-utc"]]: value["build-success"]})
        return acc
    }, base)
}
```



```js
const calculateStatsForHierarchyCommits = function (hierarchy) {
    return _.map(hierarchy, (pod) => {
        return _.map(pod, (team) => {
            return _.map(team, (repository) => {
                return _.map(repository, (commit) => {
                    return calculateStatsForCommitDeployments(commit)
                })
            })
        })
    })
}

```
```js
const prepareDeploymentValues = function (stats, deployment) {
    const key = `${deployment["environment"]}-${deployment["stage"]}`;

    if(!stats[key]) {
        stats[key] = {"success":[],"failure":[]}
    }

    if(key === "build-deploy") {
        stats["commits"]["success"].push(deployment["commit-sha"])
    }

    let buildSuccessResultKey = "failure"
    if(deployment["build-success"] === "1") {
        buildSuccessResultKey = "success"
    }

    stats[key][buildSuccessResultKey].push(deployment["commit-sha"])
    return stats
}

const applyDeploymentValues = function (stats, deployment) {
    const key = `${deployment["environment"]}-${deployment["stage"]}`;

    if(key === "build-deploy") {
        stats["build-fetch"] = stats["build-fetch"] ? stats["build-fetch"] + 1 : 1
    }

    if(deployment["build-success"] === "1") {
        stats[key] = stats[key] ? stats[key] + 1 : 1
    }
    return stats
}
```

```js
const doStuff = function (deployments) {
    const stats = {};

    _.reduce(deployments, (acc, value) => {

        const repoCompositeKey = `${value["pod-name"]}-${value["team-name"]}-${value["repository"]}`

        if(!Object.hasOwn(acc, repoCompositeKey)) {
            acc[repoCompositeKey] = {
                ["build-fetch"]: undefined,
                ["build-deploy"]: undefined,
                ["build-test"]: undefined,
                ["build-promote"]: undefined,
                ["staging-deploy"]: undefined,
                ["staging-test"]: undefined,
                ["staging-promote"]: undefined,
                ["integration-deploy"]: undefined,
                ["integration-test"]: undefined,
                ["production-deploy"]: undefined,
                ["production-test"]: undefined,
            }
        }

        applyDeploymentValues(acc[repoCompositeKey], value)

        return acc;
    }, stats)

    return stats
}

const createDefaultData = () => {
    return {
        ["commits"]: {success: [], failure:[], retries: []},
        ["build-deploy"]: {success: [], failure:[], retries: []},
        ["build-test"]: {success: [], failure:[], retries: []},
        ["build-promote"]: {success: [], failure:[], retries: []},
        ["staging-deploy"]: {success: [], failure:[], retries: []},
        ["staging-test"]: {success: [], failure:[], retries: []},
        ["staging-promote"]: {success: [], failure:[], retries: []},
        ["integration-deploy"]: {success: [], failure:[], retries: []},
        ["integration-test"]: {success: [], failure:[], retries: []},
        ["production-deploy"]: {success: [], failure:[], retries: []},
        ["production-test"]: {success: [], failure:[], retries: []},
    }
}

const calculateDeploymentCounts = function (deployments) {
    const commitStats = _.reduce(deployments, (acc, value) => {

        const repoCompositeKey = `${value["pod-name"]}_${value["team-name"]}_${value["repository"]}`

        if(!Object.hasOwn(acc, repoCompositeKey)) {
            acc[repoCompositeKey] = createDefaultData()
        }

        prepareDeploymentValues(acc[repoCompositeKey], value)

        return acc;
    }, {})

    // return commitStats
    return _.map(commitStats, (repoStat, repoKey) => {

        const parts = repoKey.split("_")
        return {
            pod: parts[0],
            team: parts[1],
            repository: parts[2],
            ..._.reduce(repoStat, (acc, value, key) => {
                const success = value["success"] ? _.uniq(value["success"]).length : 0
                const failure = value["failure"] ? _.uniq(value["failure"]).length : 0
                const executions = value["success"].length + value["failure"].length;

                const deployment_failure_percentage = (executions > 0) ? 1- ((success - failure ) / _.uniq(repoStat["commits"]["success"]).length) : 0
                acc[key] = {
                    success,
                    failure,
                    executions,
                    deployment_failure_percentage
                    // success: value["success"] ? _.uniq(value["success"]).length : 0,
                    // failure: value["failure"] ? _.uniq(value["failure"]).length: 0,
                    // retries: value["success"].length - _.uniq(value["success"]).length + _.uniq(value["failed"]).length
                }

                return acc;
            }, {})
        }


    }, commitStats)
    return commitStats
}

```

```js
const calculateDeploymentCountsForTeam = function (deploymentCounts) {
    return _.reduce(deploymentCounts, (acc, value) => {

    }, [])
}
```


```js
const deploymentFailureRateByTeam = function deploymentFailureRateByTeam (deployments) {

    const commits = flattenByCommitSha(spotDeployments);

    return html`
    <div><ul>${_.map(commits, (value, key) => {
        return html`<li>${JSON.stringify(value["pod-name"])}</li>`
    })}</ul></div>`;
}
```

```js
const countTableOptions = {
    format: {
        "commits": (v) => `success: ${v.success}\nfailure: ${v.failure}`,
        "production-deploy": (v) => `success: ${v.success}\nfailure: ${v.failure}`
    },
    width: {
        "pod": 80,
        "team": 90,
    }
}
```

```js
const generateCountsForGraphingByPod = function (deployments) {
    const commitStats = _.reduce(deployments, (acc, value) => {

        const repoCompositeKey = `${value["pod-name"]}`

        if (!Object.hasOwn(acc, repoCompositeKey)) {
            acc[repoCompositeKey] = createDefaultData()
        }

        prepareDeploymentValues(acc[repoCompositeKey], value)

        return acc;
    }, {})


    // return commitStats
    return _.map(commitStats, (repoStat, repoKey) => {

        const parts = repoKey.split("_")
        return {
            pod: repoKey,
            values: _.reduce(repoStat, (acc, value, key) => {

                const success = value["success"] ? _.uniq(value["success"]).length : 0
                const failure = value["failure"] ? _.uniq(value["failure"]).length : 0
                const failure_retry_success = _.intersection(_.uniq(value["failure"]),_.uniq(value["success"])).length
                const executions = value["success"].length + value["failure"].length;
                const environmentStage = key

                return acc.concat(

                    {pod: repoKey,"environment-stage": environmentStage, type: "success", value: success},
                    {pod: repoKey,"environment-stage": environmentStage, type: "failure", value: failure},
                    {pod: repoKey,"environment-stage": environmentStage, type: "failure-retry-success", value: failure_retry_success},
                    {pod: repoKey,"environment-stage": environmentStage, type: "executions", value: executions},
                )
                return acc;
            }, [])
        }
    }, commitStats)
    return commitStats
}
```


```js
const generateCountsForGraphing = function (deployments) {
    const commitStats = _.reduce(deployments, (acc, value) => {

        const repoCompositeKey = `${value["pod-name"]}_${value["team-name"]}_${value["repository"]}`

        if(!Object.hasOwn(acc, repoCompositeKey)) {
            acc[repoCompositeKey] = createDefaultData()
        }

        prepareDeploymentValues(acc[repoCompositeKey], value)

        return acc;
    }, {})


    // return commitStats
    return _.map(commitStats, (repoStat, repoKey) => {

        const parts = repoKey.split("_")
        return {
            pod: parts[0],
            team: parts[1],
            repository: parts[2],
            values: _.reduce(repoStat, (acc, value, key) => {

              const success = value["success"] ? _.uniq(value["success"]).length : 0
              const failure = value["failure"] ? _.uniq(value["failure"]).length : 0
              const failure_retry_success = _.intersection(_.uniq(value["failure"]),_.uniq(value["success"])).length
              const executions = value["success"].length + value["failure"].length;
              const environmentStage= key

              return acc.concat(
                  {"environment-stage": environmentStage, type: "success", value: success},
                  {"environment-stage": environmentStage, type: "failure", value: failure},
                  {"environment-stage": environmentStage, type: "failure-retry-success", value: failure_retry_success},
                  {"environment-stage": environmentStage, type: "executions", value: executions},
              )
                return acc;
            }, [])
        }

    }, commitStats)
    return commitStats
}


const displayCountsPercentages = function (counts) {
    return html`
    ${_.map(_.sortBy(counts, ["pod"]), (value, key) => {
       const totalCommits = value.values.find((v) => v["environment-stage"] === "commits" && v["type"] === "success")
       return html`
       <h2>${value.pod}</h2>
       <ul>
         <li>build: ${((value.values.find((v) => v["environment-stage"] === "build-deploy" && v["type"] === "success").value)/totalCommits.value).toLocaleString(undefined, {style: "percent"})}</li>
         <li>staging: ${((value.values.find((v) => v["environment-stage"] === "staging-deploy" && v["type"] === "success").value)/totalCommits.value).toLocaleString(undefined, {style: "percent"})}</li>
         <li>integration: ${((value.values.find((v) => v["environment-stage"] === "integration-deploy" && v["type"] === "success").value)/totalCommits.value).toLocaleString(undefined, {style: "percent"})}</li>
         <li>production: ${((value.values.find((v) => v["environment-stage"] === "production-deploy" && v["type"] === "success").value)/totalCommits.value).toLocaleString(undefined, {style: "percent"})}</li>
       </ul>

       `
    })}

    `
}

const graphCountsPercentage = function (counts) {

    // return counts;
    const percentageNested = counts.filter((c) => (c["pod"] !== "undefined")).map((pod) => {
        const totalCommits = pod.values.find((v) => v["environment-stage"] === "commits" && v["type"] === "success")

        return _.reduce(pod.values, (acc, v, k) => {
            if (!v["environment-stage"].includes("deploy") || v["type"] !== "success") {
                return acc
            }

            return acc.concat({
                ...v,
                // percentage: Intl.NumberFormat("gb", {style: "percent"}).format(v.value/totalCommits.value)
                percentage: v.value/totalCommits.value
            });


        },[])
    });

    // return percentageNested

    // const totalCommits = counts.values.find((v) => v["environment-stage"] === "commits" && v["type"] === "success")
    //
    const percentages = _.sortBy(_.reduce(percentageNested, (acc, value) => {
        return acc.concat(value)

    },[]), ["pod"])

     // return percentages;

    return html`
        ${
            Plot.plot({
                x: {axis: null, },
                y: {tickFormat: "s", grid: true, percent: true, labelAnchor: "bottom", dy: -20 },
                width: 1200,
                height: 300,
                color: {
                    scheme: "prgn",
                    legend: true,
                    // domain: ["build-deploy","staging-deploy","integration-deploy","production-deploy"]
                },
                marks: [
                    Plot.barY(percentages, {
                        x: "environment-stage",
                        y: "percentage",
                        fill: "environment-stage",
                        fx: "pod",
                        sort: {x: null, color: null, fx: null}
                    }),
                    Plot.text(percentages, {
                        text: d => Intl.NumberFormat("gb", {style: "percent"}).format(d.percentage),
                        x: "environment-stage",
                        y: "percentage",
                        fx: "pod",
                        dy: -7
                    }),
                    Plot.ruleY([0]),
                ]
            })}`
}

```

```js
const graphData = generateCountsForGraphing(rangedDeployments)
```

```js
const graphDataByPod = generateCountsForGraphingByPod(rangedDeployments)
// display(JSON.stringify(graphDataByPod))

```


```js
display(graphCountsPercentage(graphDataByPod))
```


<hr>

## Count of deployments per environment & stage
```js
display(displayCountsCharts(graphDataByPod))
```


```js
const displayCountsCharts = function displayCountsCharts (chartData) {
    return html`
    ${_.map(_.sortBy(chartData, ["pod", "team", "repository"]), (value, key) => {
        return html`
        <h2>${value["pod"]} - ${value["team"]}</h2><h3>${value["repository"]} (${(value.values.filter((v) => v["environment-stage"] === "commits" && v["type"] === "success")[0].value)} commits)</h3>
        ${
      Plot.plot({
        x: {axis: null},
        y: {tickFormat: "s", grid: true},
        width: 1200,
        height: 300,
        color: {scheme: "set1", legend: true, domain: ["failure", "executions", "success", "failure-retry-success",]},
        marks: [
          Plot.barY(value.values, {
            x: "type",
            y: "value",
            fill: "type",
            fx: "environment-stage",
            sort: {x: null, color: null, fx: null}
          }),
          Plot.text(value.values, {
            text: d => d.value,
            x: "type",
            y: "value",
            fx: "environment-stage",
            dy: -7
          }),
          Plot.ruleY([0]),
        ]
      })
      }
       `
    })}</div>`;
}
```

# Metrics by repository

<p></p>

## Count of deployments per environment & stage

<p></p>

```js
display(displayCountsCharts(graphData))
```
