```js
import { createAWSAccountLookupTable } from "../components/accounts.js"

import { 
    applyDurationRangeToCommit, 
} from "../components/commits.js"

import { 
    sortByDateWithKey, 
    sortByTemporalWithKey 
} from "../components/dates.js"

import { 
    addAccountDetailsToDeployments, 
    flattenByCommitSha 
} from "../components/deployments.js";

import { filterByQuarterWithKey, commitsWithNonEmptyPods } from "../components/filters.js"

import { accountNameToService } from "../components/strings.js"
```

```js
const displayBoxChart = (data, facetKey, domain) => {
    const plotHeight = _.uniqBy(data, facetKey).length * 150

    return Plot.plot({
        color: {
            scheme: "accent",
            legend: true,
            domain: domain
        },
        facet: {
            data: data,
            y: (d) => d[facetKey],
        },
        padding: 0,
        marginLeft: 50,
        marginRight: 150,
        height: plotHeight,
        width: 420,
        y: {
            label: "Week No."
        },
        marks: [
            Plot.frame(),
            Plot.axisX({label:"error budget in minutes per month", labelArrow: "none", labelAnchor: "center", anchor: "bottom", ticks: [43, 220], tickFormat:((d) => d > 200 ? "99.5%" : "99.9%")}), // place fx axis opposite x
            Plot.axisX({anchor: "top",  labelAnchor: "left", ticks: [60, 120, 180, 240, 300], label: "minutes"}), 

            Plot.boxX(data, { x: "duration", y: (d) => d.startTimeData.week, fy:facetKey, fill: "pod" }),
            Plot.gridX({interval: 30, stroke: "silver", strokeOpacity: 0.5}),
            // Plot.ruleX([10], {stroke: "red"}),
            Plot.ruleX([43], {stroke: "red"}), // Sign In / Reuse / Account 99.9% availabiliy per month
            // Plot.ruleX([50], {stroke: "purple"}),
            Plot.ruleX([220], {stroke: "purple"}), // Identity Proving 99.5% availabiliy per month
        ]
    })
}
```

```js
const awsAccountMappings = FileAttachment("../data/config/aws-accountid-config.json").json()
```

```js
const allDeployments = FileAttachment("../data/config/deployments.csv").csv();
```

```js
const mappedDeployments = addAccountDetailsToDeployments(allDeployments, createAWSAccountLookupTable(awsAccountMappings))
const commitsWithDuration = flattenByCommitSha(mappedDeployments).map(applyDurationRangeToCommit).filter(commitsWithNonEmptyPods)
```

# Methodology

<div class="tip grid-rowspan-2">

- For every commit, calculate the total duration by using the earliest start time and the latest end time over all deployments

</div>

# Box Plot

<p></p>

## By Pod
<div>
${displayBoxChart(filteredApproachData, "pod")}
</div>


## By Team
<div>
${displayBoxChart(filteredApproachData, "team")}
</div>

## By Service

<div>
${displayBoxChart(filteredApproachData, "service")}
</div>

## By Repository

<div>
${displayBoxChart(filteredApproachData, "repository")}
</div>

## Explorer by Repository

```js
const fillType = view(Inputs.radio(["pod", "team", "account"], {label: "Color", value:"pod"}));
```

```js
const approachData = commitsWithDuration
    .map((c) => ({
        ...c,
            startTimeData: c.startTime,
            endTimeData: c.endTime
    }))
```

```js
display(approachData)
```

```js
const filteredApproachData = approachData.sort(sortByTemporalWithKey("startTime"))
```


```js
display(Plot.plot({
    marginLeft: 270,
    marginRight: 50,
    width: 1200,
    color: {
        scheme: "observable10",
        legend: true
    },
    marks: [
        Plot.boxX(commitsWithDuration.sort(sortByDateWithKey("startTime")), { x: "duration", y: "repository", fill: fillType })
    ]
}))
```

## Explorer by Service

```js
display(Plot.plot({
    marginLeft: 200,
    marginRight: 150,
    width: 600,
    color: {
        scheme: "observable10",
        legend: true
    },
    marks: [
        Plot.boxX(approachData.sort(sortByTemporalWithKey("startTime")), { x: "duration", y: "service", fill: fillType }),
        Plot.axisX({label:"error budget in minutes per month", labelArrow: "none", labelAnchor: "center", anchor: "bottom", ticks: [43, 220], tickFormat:((d) => d > 200 ? "99.5%" : "99.9%")}), // place fx axis opposite x
        Plot.axisX({anchor: "top",  labelAnchor: "left", ticks: [60, 120, 180, 240, 300], label: "minutes"}),

        Plot.gridX({interval: 30, stroke: "silver", strokeOpacity: 0.5}),
        // Plot.ruleX([10], {stroke: "red"}),
        Plot.ruleX([43], {stroke: "red"}), // Sign In / Reuse / Account 99.9% availabiliy per month
        // Plot.ruleX([50], {stroke: "purple"}),
        Plot.ruleX([220], {stroke: "purple"}), // Identity Proving 99.5% availabiliy per month
    ]
}))
```




