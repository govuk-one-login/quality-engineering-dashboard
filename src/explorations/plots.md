# Deployment Frequency

<div class="note grid-rowspan-2" label="Note">

- Exploration of various data visualisations using deployment frequency data

</div>

```js
import {
    addAccountDetailsToDeployments,
    sortFailedDeploymentsByDate,
    flattenByCommitSha,
    filterByQuarter,
    groupByRepository,
    processForDeploymentRecoveryDuration,
    calculateRestorationTime
} from "../components/deployments.js";

import { createAWSAccountLookupTable } from "../components/accounts.js"

import { applyDurationRangeToCommit } from "../components/commits.js"

```
```js
import { expandDateProperties, daysBetween, sortByDateWithKey } from "../components/dates.js"
```

```js
const awsAccountMappings = FileAttachment("../data/config/aws-accountid-config.json").json()
```

```js
const allDeployments = FileAttachment("../data/config/deployments.csv").csv();
```

```js
const mappedDeployments = addAccountDetailsToDeployments(allDeployments, createAWSAccountLookupTable(awsAccountMappings))

const commitsWithDuration = flattenByCommitSha(mappedDeployments).filter((c)=>{
    return _.some(c.deployments, {"environment": "production", "build-success": "1" })
}).map(applyDurationRangeToCommit).map((c) => {
    return {
        ...c
//        recoveryDuration: daysBetween(c.startTime, c.endTime)
    }
    
}).filter((c) => !["performance-testing"].includes(c.repository))
```

```js
display(commitsForReduction)
```

```js
const flattenedCommits = commitsWithDuration.map(applyDurationRangeToCommit)
const commitsForReduction = calculateRestorationTime(mappedDeployments).map((c) => {
    return {
        ...c,
        ["failure-start-time"]: c["failure-start-time"].temporal.epochMilliseconds,
        ["failure-end-time"]: c["failure-end-time"].temporal.epochMilliseconds
    }
}).sort(sortFailedDeploymentsByDate)
```

# Box Plot

> The box mark summarizes one-dimensional distributions as boxplots. It is a composite mark consisting of a rule to represent the extreme values (not including outliers), a bar to represent the interquartile range (trimmed to the data), a tick to represent the median value, and a dot to represent any outliers. The group transform is used to group and aggregate data.
>
> https://observablehq.com/plot/marks/box

# Box Plot - Repository

```js
const fillType = view(Inputs.radio(["pod-name", "team-name"], {label: "Color", value:"pod-name"}));
```

```js
display(Plot.plot({
    marginLeft: 270,
    marginRight: 50,
    width: 1200,
    marks: [Plot.boxX(commitsForReduction, { x: "duration", y: "repository", fill: fillType })]
}))

```

# Bollinger

> The bollinger mark is a composite mark consisting of a line representing a moving average and an area representing volatility as a band; the band thickness is proportional to the deviation of nearby values.
> 
> https://observablehq.com/plot/marks/bollinger


```js
const n = 10
const k = 2
```

## Bollinger - Pod 

```js
display(Plot.plot({
    x: {domain: [new Date(2024, 9, 1), new Date(2025, 0, 7)]},
    y: {grid: true},
    facet: {
        data: commitsForReduction,
        y: (d) => d["pod-name"],
    },
    marks: [
        Plot.bollingerY(commitsForReduction, {n, k, x: "failure-end-time", y: "duration", stroke: "none"}),
        Plot.lineY(commitsForReduction, {x: "failure-end-time", y: "duration", strokeWidth: 1})
    ]
}))
```

## Bollinger - Team

```js
display(Plot.plot({
    x: {domain: [new Date(2024, 9, 1), new Date(2025, 0, 7)]},
    y: {grid: true},
    facet: {
        data: commitsForReduction,
        y: (d) => d["team-name"],
    },
    marks: [
        Plot.bollingerY(commitsForReduction, {n, k, x: "failure-end-time", y: "duration", stroke: "none"}),
        Plot.lineY(commitsForReduction, {x: "failure-end-time", y: "duration", strokeWidth: 1})
    ]
}))
```

# Dot Plot w/ Linear Regression Mark

> The dot mark draws circles or other symbols positioned in x and y as in a scatterplot.
> 
> https://observablehq.com/plot/marks/dot

> The linear regression mark draws linear regression lines with confidence bands, representing the estimated linear relation of a dependent variable (typically y) on an independent variable (typically x).
>
> https://observablehq.com/plot/marks/linear-regression

## Dot Plot - All

```js
display(Plot.plot({
    color: {legend: true},
    x: {domain: [new Date(2024, 9, 1), new Date(2025, 0, 7)]},
    y: {grid: true, domain: [0, 8]},
    marks: [
        Plot.dot(commitsForReduction, {x: "failure-end-time", y: "duration", fill: "team-name", strokeWidth: 1}),
        Plot.linearRegressionY(commitsForReduction, {x: "failure-end-time", y: "duration", stroke: "team-name"})
    ]
}))
```

## Dot Plot - Pod

```js
display(Plot.plot({
    color: {legend: true, scheme: "accent"},
    x: {domain: [new Date(2024, 9, 1), new Date(2025, 0, 7)]},
    facet: {
        data: commitsForReduction,
        y: (d) => d["pod-name"],
    },
    y: {grid: true, domain: [0, 8]},
    marks: [
        Plot.dot(commitsForReduction, {x: "failure-end-time", y: "duration", fill: "team-name", strokeWidth: 1}),
        Plot.linearRegressionY(commitsForReduction, {x: "failure-end-time", y: "duration", stroke: "team-name"})
    ]
}))
```

# Dot Plot - Team 

```js
display(Plot.plot({
    x: {domain: [new Date(2024, 9, 1), new Date(2025, 0, 7)]},
    y: {grid: true, domain: [0, 8]},
    color: {legend: true},

    marks: [
        Plot.dot(commitsForReduction, {x: "failure-end-time", y: "duration", fy:"team-name", stroke: "repository", strokeWidth: 1}),
        Plot.linearRegressionY(commitsForReduction, {x: "failure-end-time", y: "duration", fy:"team-name", stroke: "repository"}),
        Plot.linearRegressionY(commitsForReduction, {x: "failure-end-time", y: "duration", fy:"team-name", }),
        Plot.frame()
    ]
}))
```

# Horizon Chart

> By layering colored bands, the horizon chart makes the most of a limited vertical space.

> https://observablehq.com/@observablehq/plot-unemployment-horizon-chart

## Horizon Chart - Pod

```js
display(commitsForReduction)
```


```js
const bands = 7
const step = +(d3.max(commitsForDayWeek, (d) => d.duration) / bands).toPrecision(2)

const chart = Plot.plot({
  height: 100 * 10,
  width: 928,
  x: {axis: "top"},
  y: {domain: [0, step], axis: null},
  fy: {axis: null, domain: commitsForDayWeek.map((d) => d["pod-name"]).sort(), padding: 0.05},
  color: {
    type: "ordinal",
    scheme: "Greens",
    label: "Vehicles per hour",
    tickFormat: (i) => ((i + 1) * step).toLocaleString("en"),
    legend: true
  },
  marks: [
    d3.range(bands).map((band) => Plot.areaY(commitsForDayWeek.sort(sortByDateWithKey("failure-end-time")), {x: (d) => new Date(d["failure-end-time-utc"]), y: (d) => d.duration - band * step, fy: "pod-name", fill: band, sort: "date", clip: true})),
    Plot.axisFy({frameAnchor: "left", dx: -28, fill: "currentColor", textStroke: "white", label: null})
  ]
})

display(chart)
```

```js

// const commitsForDayWeek = commitsForReduction.map((c) => {
const commitsForDayWeek = calculateRestorationTime(mappedDeployments)

//    .filter((c) => !["performance-testing"].includes(c.repository))
```


# Cell Plot

> The cell mark draws rectangles positioned in two ordinal dimensions. Hence, the plot’s x and y scales are band scales. Cells typically also have a fill color encoding.
> https://observablehq.com/plot/marks/cell

## Cell Plot - Pod by weeks

```js
display(Plot.plot({
    color: {
        scheme: "blues",
        // legend: true
        legend: "ramp",
        type: "threshold",
        // type: "categorical",
        width: 400,
        label: `Number of days until next successful deployment`,
        domain: d3.range(1, 7, 1)
    },
    facet: {
        data: commitsForDayWeek,
        y: (d) => d["pod-name"],
    },
    padding: 0,
    marginLeft: 100,
    marginRight: 100,
    height: 800,
    y: {
        label: "Week No."
    },
    x: {
        domain: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    },
    z: {
        domain: [0, 50]
    },
    // y: {tickFormat: Plot.formatMonth("en", "short")},
    marks: [
        Plot.frame(),
        Plot.cell(commitsForDayWeek, Plot.group({fill: "max"}, {
            // x: (d) => d.startTime.dayOfMonth,
            // y: (d) => new Date(d.startTime.value).getUTCMonth(),
            x: (d) => d.startTime.day,
            y: (d) => d.startTime.week,

            fill: "duration",
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
            scheme: "warm",
            // legend: true
            legend: "ramp",
            // type: "linear",
            type: "categorical",
            width: 350,
            label: 'Number of days since last successful deployment in environment/stage',
            domain: d3.range(0, 8, 1)
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
        // height: 2800,
        // width: 400,
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
            Plot.cell(data, Plot.group({fill: "max"}, {
                x: (d) => d.endTime.day,
                y: (d) => d.endTime.week,
                fill: "recoveryDuration",
                inset: 0.5
            })),
        ]
    })
}

const chunks = (a, size) =>
    Array.from(
        new Array(Math.ceil(a.length / size)),
        (_, i) => a.slice(i * size, i * size + size)
    );

const chartThing = deploymentFrequencyAsGroupedCell(commitsWithDuration, "team")

```
## Cell Plot - Team (by weeks)

```js
display(chartThing)
```