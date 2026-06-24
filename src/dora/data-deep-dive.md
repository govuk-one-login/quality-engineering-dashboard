# Data Deep Dive

```js
import { createAWSAccountLookupTable } from "../components/accounts.js"

import {
cleanDeploymentsData,
annotateDeploymentsWithAccounts,
annotatedDeploymentsWithCompositeKey,
deploymentsAsServiceStackCommits
} from "../components/deployments.js";

import { filterByQuarterWithKey, commitsWithNonEmptyPods } from "../components/filters.js"

import { accountNameToService } from "../components/strings.js"

import {Temporal} from 'temporal-polyfill'

```

<p></p>

```js
const awsAccountMappings = FileAttachment("../data/config/aws-accountid-config.json").json()
```

```js
const allDeployments = FileAttachment("../data/config/deployments.csv").csv();
```

```js
const productionPathDeployments = allDeployments.filter((d) => !["integration"].includes(d["environment"]))
```

```js
const clean = cleanDeploymentsData(productionPathDeployments)
// display(allDeployments)
// display(clean)
```

```js
const annotatedDeployments = annotateDeploymentsWithAccounts(clean, awsAccountMappings)
// display(awsAccountMappings)
// display(annotatedDeployments)
```

```js
const groupedBySha = Object.entries(
    Object.groupBy(annotatedDeployments, d=> d["commit-sha"]))
        .map(d=> ({"commit-sha": d[0], deployments: d[1] }))

const uniqueCommitShas = Object.keys(groupedBySha).length

// display(groupedBySha)
```

```js
const multipleTeamsPerSha = groupedBySha.map(s => ({
    "commit-sha": s["commit-sha"],
    teams: [... new Set(s.deployments.map(d => d["team-name"]))]
})).filter(d => d.teams.length>1)
// display(multipleTeamsPerSha)
```

```js
const multipleServicesPerSha = groupedBySha.map(s => ({
    "commit-sha": s["commit-sha"],
    services: [... new Set(s.deployments.map(d => d["service"]))]
})).filter(d => d.services.length>1)
// display(multipleServicesPerSha)
```

```js
const singleTeamServiceDeployments = groupedBySha.map(s => ({
    "commit-sha": s["commit-sha"],
    deployments: s["deployments"],
    teams: [... new Set(s.deployments.map(d => d["team-name"]))],
    services: [... new Set(s.deployments.map(d => d["service"]))]
})).filter(d => d.teams.length==1).filter(d => d.services.length == 1)
// display("singleTeamServiceDeployments")
// display(singleTeamServiceDeployments)
```

```js
const multipleStacksPerSingleServices = singleTeamServiceDeployments.map(s => ({
    "commit-sha": s["commit-sha"],
    "sam-stack-name": [... new Set(s.deployments.map(d => d["sam-stack-name"]))]
})).filter(d => d["sam-stack-name"].length>1)
// display(multipleStacksPerSingleServices)
```

```js
const stacksWithEnvironment = groupedBySha.map(s => ({
    "commit-sha": s["commit-sha"],
    "sam-stack-name": [...new Set(s.deployments.map(d => d["sam-stack-name"]))]
        .filter(
            d => (
                ["build", "stag", "prod", "int"].some(env => d.includes(env))
            )
        )
})).filter(d => d["sam-stack-name"].length>0)
// display(stacksWithEnvironment)
```


```js
const stackNameWithoutEnvironment = (stackName) => {
    return String(stackName)
        .replace(/^di-/i, '')
        .replace(/-(dev|build|staging|stage|integration|int|production|prod|non-prod)$/i, '')
        .replace(/^(dev|build|staging|stage|integration|int|production|prod|non-prod)-/i, '')
        .replace(/-(deploy|promo-deploy|promodeploy|main)$/i, '')
}
```

```js

const compositeKeyDeployments = annotatedDeployments.map((d) => {
    return {
    "_key": `${d["service"]}__${stackNameWithoutEnvironment(d["sam-stack-name"])}__${d["commit-sha"]}`,
    "_service-stack": `${d["service"]}__${stackNameWithoutEnvironment(d["sam-stack-name"])}`,
    ...d,
    }
})
// display(compositeKeyDeployments)
```

```js

const duration =
    Temporal.Instant.from(
        _.maxBy(annotatedDeployments, "end-time-utc")["end-time-utc"]
    ).since(
        Temporal.Instant.from(_.minBy(annotatedDeployments, "start-time-utc")["start-time-utc"])
    )
const durationDays = duration.round({smallestUnit: "days"}).days
const durationWeeks = duration.round({smallestUnit: "weeks", relativeTo:Temporal.PlainDateTime.from("1900-01-01")}).weeks
```

## Comparison for uniqueness

- ${annotatedDeployments.length} individual deployments over ${durationDays} days / ${durationWeeks} weeks
- ${Object.keys(groupedBySha).length} unique `commit-sha`s
- ${multipleTeamsPerSha.length} `commit-sha`s with more than 1 team per `commit-sha`
- ${multipleServicesPerSha.length} `commit-sha`s with more than 1 service per `commit-sha`
- ${singleTeamServiceDeployments.length} `commit-sha`s with only 1 team and 1 service
- ${multipleStacksPerSingleServices.length} single-team and single-service `commit-sha`s with more than 1 stack
- ${stacksWithEnvironment.length} `commit-sha`s with stacks referencing environment names

```js
const commitPlotData = [
    {
        group: "Total commits",
        type: "yes",
        value: uniqueCommitShas
    },
    {
        group: "More than 1 team",
        type: "yes",
        value: multipleTeamsPerSha.length
    },
    {
        group: "More than 1 team",
        type: "no",
        value: Object.keys(groupedBySha).length - multipleTeamsPerSha.length
    },
    {
        group: "More than 1 service",
        type: "yes",
        value: multipleServicesPerSha.length
    },
    {
        group: "More than 1 service",
        type: "no",
        value: Object.keys(groupedBySha).length - multipleServicesPerSha.length
    },
    {
        group: "Only 1 team and 1 service",
        type: "yes",
        value: singleTeamServiceDeployments.length
    },
    {
        group: "Only 1 team and 1 service",
        type: "no",
        value: Object.keys(groupedBySha).length - singleTeamServiceDeployments.length
    },
    {
        group: "More than 1 stack",
        type: "yes",
        value: multipleStacksPerSingleServices.length
    },
    {
        group: "More than 1 stack",
        type: "no",
        value: Object.keys(groupedBySha).length - multipleStacksPerSingleServices.length
    },
    {
        group: "Stacks referencing environments",
        type: "yes",
        value: stacksWithEnvironment.length
    },
    {
        group: "Stacks referencing environments",
        type: "no",
        value: Object.keys(groupedBySha).length - stacksWithEnvironment.length
    },

]

// display(commitPlotData)
```
```js
display(Plot.plot({
    marginLeft: 200,
    color: {
        legend: true,
        scheme: "observable10"
    },
    fy: {
        domain: [
            "Total commits",
            "More than 1 team",
            "More than 1 service",
            "Only 1 team and 1 service",
            "More than 1 stack",
            "Stacks referencing environments"
        ]
    },
    y: {
        label: "Grouping"
    },
    x: {
        percent: false,
        label: "# of commits"
    },
    marks: [
        Plot.barX(commitPlotData, Plot.stackX(
            {x: "value", fy: "group",fillOpacity: 0.3, inset: 0.5, fill: "type"}
        )),
        Plot.textX(commitPlotData, Plot.stackX({x: "value", fy: "group", text: d => `${d3.format(".0%")(d.value/uniqueCommitShas)}`  , inset: 0.5})),
        Plot.ruleX([0, 0], {strokeOpacity: 0.3}),
        Plot.ruleX([uniqueCommitShas, uniqueCommitShas], {strokeOpacity: 0.3})


    ]
}))
```

---

## Comparison by Volumes

```js
const deploymentsGroupedByPod = annotatedDeployments.reduce((acc, value) => {
    acc[value["pod-name"]] ??= [];
    acc[value["pod-name"]].push(value)
    return acc
}, {})

const deploymentsGroupedByTeam = annotatedDeployments.reduce((acc, value) => {
    acc[value["team-name"]] ??= [];
    acc[value["team-name"]].push(value)
    return acc
}, {})
```

```js
// display(deploymentsGroupedByPod)
```

```js
const maxDeploymentsPerPod = _.max(_.map(deploymentsGroupedByPod, (d) =>d.length))
// display(maxDeploymentsPerPod)
```

```js
display(Plot.plot({
    title: "Deployments per Pod",
    marginLeft: 200,
    color: {
        legend: true,
        scheme: "observable10"
    },
    x: {
        percent: false,
        label: "# of deployments"
    },
    marks: [
        Plot.barX(annotatedDeployments, Plot.groupY({x: "count"},
            {y: "pod-name", fillOpacity: 0.3, inset: 0.5,  fill: "pod-name"}
        )),
    ]
}))
```

```js
display(Plot.plot({
    title: "Deployments per Team",
    marginLeft: 200,
    color: {
        legend: true,
        scheme: "observable10"
    },
    x: {
        percent: false,
        label: "# of deployments"
    },
    marks: [
        Plot.barX(annotatedDeployments, Plot.groupY({x: "count"},
            {y: "team-name", fillOpacity: 0.3, inset: 0.5, fill: "pod-name"}
        )),
    ]
}))
```

```js
display(Plot.plot({
    title: "Deployments per Team (service)",
    marginLeft: 200,
    color: {
        legend: false,
        scheme: "turbo"
    },
    x: {
        percent: false,
        label: "# of deployments"
    },
    marks: [
        Plot.barX(annotatedDeployments, Plot.groupY({x: "count"},
            {y: "team-name", fillOpacity: 0.3, inset: 0.5, fill: "service", tip: true}
        )),
    ]
}))
```

```js
display(Plot.plot({
    title: "Deployments per Service",
    marginLeft: 200,
    color: {
        legend: true,
        scheme: "observable10"
    },
    x: {
        percent: false,
        label: "# of deployments"
    },
    marks: [
        Plot.barX(annotatedDeployments, Plot.groupY({x: "count"},
            {y: "service", fillOpacity: 0.3, inset: 0.5, fill: "pod-name"}
        )),
    ]
}))
```

```js
display(Plot.plot({
    title: "Deployments per Service (composite key)",
    marginLeft: 200,
    color: {
        legend: false,
        scheme: "dark2"
    },
    x: {
        percent: false,
        label: "# of deployments"
    },
    marks: [
        Plot.barX(compositeKeyDeployments, Plot.groupY({x: "count"},
            {y: "service", fillOpacity: 0.3, inset: 0.5, fill: "_service-stack", tip: true}
        )),
    ]
}))
```

```js
display(Plot.plot({
    title: "Deployments per Team (composite key)",
    marginLeft: 200,
    color: {
        legend: false,
        scheme: "turbo"
    },
    x: {
        percent: false,
        label: "# of deployments"
    },
    marks: [
        Plot.barX(compositeKeyDeployments, Plot.groupY({x: "count"},
            {y: "team-name", fillOpacity: 0.3, inset: 0.5, fill: "_service-stack", tip: true}
        )),
    ]
}))
```
