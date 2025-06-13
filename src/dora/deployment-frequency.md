```js
import { createAWSAccountLookupTable } from "../components/accounts.js"

import {
    addAccountDetailsToDeployments,
    flattenByCommitSha
} from "../components/deployments.js";

import { 
    applyDurationRangeToCommit, 
    applyDurationRangeToCommitWithSort 
} from "../components/commits.js"

import { expandDateProperties } from "../components/dates.js"

import { commitsWithSuccessfulProductionBuilds, commitsWithNonEmptyPods } from "../components/filters.js"
```

# Deployment Frequency

<div class="tip grid-rowspan-2" label="Methodology">

- For every commit that makes it to production, group by day of year, day of week, week of year, month

</div>

<div class="note">

In the Four Keys scripts, Deployment Frequency falls into the Daily bucket when the median number of days per week with at least one successful deployment is equal to or greater than three. To put it more simply, to qualify for “deploy daily,” you must deploy on most working days. Similarly, if you deploy most weeks, it will be weekly, and then monthly and so forth.

</div>

```js
const awsAccountMappings = FileAttachment("../data/config/aws-accountid-config.json").json()
```

```js
const allDeployments = FileAttachment("../data/config/deployments.csv").csv();
```

```js
const mappedDeployments = addAccountDetailsToDeployments(allDeployments, createAWSAccountLookupTable(awsAccountMappings))

const commitsWithDuration = flattenByCommitSha(mappedDeployments).filter(commitsWithSuccessfulProductionBuilds).map(applyDurationRangeToCommit).filter(commitsWithNonEmptyPods)
```

```js
display(Plot.plot({
    color: {
        scheme: "pubu",
        legend: "ramp",
        type: "threshold",
        width: 300,
        label: "Number of deployments to production",
        domain: d3.range(0, 30, 2)
    },
    facet: {
        data: commitsWithDuration,
        y: (d) => d["pod"],
    },
    padding: 0,
    marginLeft: 100,
    marginRight: 100,
    height: 900,
    width: 500,
    y: {
        label: "Week No."
    },
    x: {
        domain: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    },
    marks: [
        Plot.frame(),
        Plot.cell(commitsWithDuration, Plot.group({fill: "count"}, {
            x: (d) => d.startTime.day,
            y: (d) => d.startTime.week,

            fill: "build-success",
            inset: 0.5
        }))
    ]
}))
```

```js
const deploymentFrequencyAsGroupedCell = (data, facetKey) => {
    const plotHeight = _.uniqBy(data, facetKey).length * 150
    
    return Plot.plot({
        color: {
            scheme: "blues",
            legend: "ramp",
            type: "threshold",
            width: 300,
            label: `Number of deployments to production`,
            domain: d3.range(0, 30, 2)
        },
        facet: {
            data: data,
            y: (d) => d[facetKey],
        },
        padding: 0,
        marginLeft: 50,
        marginRight: 100,
        height: plotHeight,
        width: 350,
        y: {
            label: "Week No.",
            inset: 2,
        },
        x: {
            domain: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            tickFormat: (d) => d[0],
            inset: 2
        },
        marks: [
            Plot.frame(),
            Plot.cell(data, Plot.group({fill: "count"}, {
                x: (d) => d.startTime.day,
                y: (d) => d.startTime.week,
                fill: "build-success",
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


