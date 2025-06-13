# Deployment Frequency

<div class="tip grid-rowspan-2" label="Methodology">

- For every commit that fails an execution in an environment+stage, what is the duration until the next successful execution in that environment+stage

</div>

```js
import { createAWSAccountLookupTable } from "../components/accounts.js"

import {
    applyDurationRangeToCommit,
    applyRecoveryDurationToCommit
} from "../components/commits.js"

import { weekdays } from "../components/dates.js"

import {
    addAccountDetailsToDeployments,
    flattenByCommitSha,
    calculateRestorationTime
} from "../components/deployments.js";

import { commitsWithSuccessfulProductionBuilds, commitsWithNonEmptyPods} from "../components/filters.js"
```


```js
const awsAccountMappings = FileAttachment("../data/config/aws-accountid-config.json").json()
```

```js
const allDeployments = FileAttachment("../data/config/deployments.csv").csv();
```

```js
const mappedDeployments = addAccountDetailsToDeployments(allDeployments, createAWSAccountLookupTable(awsAccountMappings))
```

```js
const commitsWithDuration = flattenByCommitSha(mappedDeployments)
    .filter(commitsWithSuccessfulProductionBuilds)
    .map(applyDurationRangeToCommit)
    .map(applyRecoveryDurationToCommit)
    .filter(commitsWithNonEmptyPods)
```

```js
display(commitsWithDuration)
display(commitsWithDuration.filter((c) => !["Accounts", "Identity", "Data","Mobile", "PSRE","Fraud"].includes(c.pod)))
display(commitsWithDuration.filter((c) => !_.isUndefined(c.pod)))
```

# Box Plot by repository

```js
const restorations = calculateRestorationTime(mappedDeployments)
```



```js
const fillType = view(Inputs.radio(["pod-name", "team-name"], {label: "Color", value:"pod-name"}));
```

```js
display(Plot.plot({
    marginLeft: 270,
    marginRight: 50,
    color: {
        scheme: "observable10",
        legend: true
    },
    width: 1200,
    marks: [Plot.boxX(restorations, { x: "duration", y: "repository", fill: fillType })]
}))

display(Plot.plot({
    marginLeft: 270,
    marginRight: 50,
    color: {
        scheme: "observable10",
        legend: true
    },
    width: 1200,
    marks: [Plot.boxX(restorationsForDayWeek, { x: "duration", y: "repository", fill: "pod" })]
}))

```

```js
const restorationsForDayWeek = restorations.map((c) => {
    return {
        ...c,
        startTime: c["failure-start-time"],
        endTime: c["failure-end-time"],
    }
})
```


```js
const deploymentFrequencyAsGroupedCell = (data, facetKey) => {
    const plotHeight = _.uniqBy(data, facetKey).length * 150

    return Plot.plot({
        color: {
            scheme: "reds",
            // legend: true
            legend: "ramp",
            // type: "linear",
            type: "categorical",
            width: 350,
            label: 'Number of days since last successful deployment in environment/stage',
            domain: d3.range(0, 9, 1),
            tickFormat: (d) => d >7 ? "8+" : d
        },
        facet: {
            data: data,
            y: (d) => d[facetKey],
        },
        padding: 0,
        marginLeft: 50,
        marginRight: 300,
        height: plotHeight,
        width: 600,
        y: {
            label: "Week No.",
            inset: 2,
        },
        x: {
            domain: weekdays,
            tickFormat: (d) => d[0],
            inset: 2
        },
        marks: [
            Plot.frame(),
            Plot.cell(data, Plot.group({fill: "max"}, {
                x: (d) => d.endTime.day,
                y: (d) => d.endTime.week,
                fill: "recoveryDuration",
                inset: 0.5
            })),
        ]
    })
}
```

# Pod

${deploymentFrequencyAsGroupedCell(commitsWithDuration, "pod")}

# Team

${deploymentFrequencyAsGroupedCell(commitsWithDuration, "team")}

# Service

${deploymentFrequencyAsGroupedCell(commitsWithDuration, "service")}

# Repository

${deploymentFrequencyAsGroupedCell(commitsWithDuration, "repository")}
