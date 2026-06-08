---
theme: [light, alt]
toc: false
---

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

# Dashboard

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
const compositeKeyDeployments = annotatedDeploymentsWithCompositeKey(annotatedDeployments)
// display(compositeKeyDeployments)
// display(Object.groupBy(compositeKeyDeployments, (d) => d._key))
```

```js
const serviceCommits = deploymentsAsServiceStackCommits(compositeKeyDeployments)
// display(serviceCommits)
```

```js
const allPodsAndTeamNames = _.chain(serviceCommits).uniqBy("team-name").map((d) => ({
    "team-name": d["team-name"],
    "pod-name": d["pod-name"]
})).value()
```

```js
const filteredServiceCommits = _.chain(serviceCommits)
    .filter((o) => selectedPods.includes(o["pod-name"]))
    .filter((o) => selectedTeams.includes(o["team-name"]))
    .sortBy("start-time-utc")
    .value()
```


```js
// display(filteredServiceCommits)
```

```js
const grouped = _.chain(filteredServiceCommits)
    .flatMap((v) => v.deployments)
    .groupBy((v) => `${v["service"]}-${v["stack"]}-${v["environment"]}-${v["stage"]}`)
    .value()
```

```js
// display(grouped)
```

```js
// display(_.filter(grouped, (v) => v.some((d) => !d["build-success"])))
```

```js
const calced = _.reduce(grouped, (acc, value) => {
    const workingValues = _.sortBy(value, "start-time-utc")
    const deploymentProperties = _.pick(workingValues[0], ["pod-name", "team-name", "_service-stack", "service", "environment", "stage"])

    let previousFailedBuild = false;
    let previousFailedStartTime;

    const restorationTimes = _.reduce(value, (acc2, value2) => {

        if(previousFailedBuild) {
            if(value2["build-success"]) {

                const restorationTime = Temporal.Instant
                    .from(previousFailedStartTime)
                    .until(Temporal.Instant.from(value2["end-time-utc"]))
                    .round({smallestUnit: "days", roundingMode: "ceil"})
                    .total("days");

                const payload = {
                    ...deploymentProperties,
                    "start-time-utc": previousFailedStartTime,
                    ..._.pick(value2, ["end-time-utc"]),
                    "restoration-time": restorationTime
                }
                previousFailedBuild = false;
                previousFailedStartTime = undefined;

                return acc2.concat(payload)
            }
        } else {

            if(value2["build-success"]) {
                return acc2.concat({
                    ...deploymentProperties,
                    ..._.pick(value2, ["start-time-utc", "end-time-utc"]),
                    "restoration-time": 0
                })
            }

            previousFailedBuild = true;
            previousFailedStartTime = value2["start-time-utc"]

        }



        return acc2
    }, [])

        // return acc.concat(deploymentProperties)
        return acc.concat(restorationTimes);
}, [])
```

```js
// display(calced)
```

```js
const maxCalced = _.map(calced, (d) => {
    return {
        ...d,
        "date": Date.parse(d["end-time-utc"]),
        "restoration-time-ceiling": _.min([d["restoration-time"], 7])
    }
})
// display(maxCalced)
```

```js
const maxCalcedWithFailures = _.filter(maxCalced, (v) => v["restoration-time"] > 0)
```

[//]: # (### Max Restoration Time - > 0, 3, 7 days)
```js
// display(_.filter(maxCalced, (v) => v["restoration-time"] > 0))
// display(_.filter(maxCalced, (v) => v["restoration-time"] > 3))
// display(_.filter(maxCalced, (v) => v["restoration-time"] > 7))
```


----

```js
const selectedPods = view(Inputs.checkbox(_.chain(allPodsAndTeamNames).uniqBy("pod-name").map("pod-name").value().sort(), {label: "Pod"}));
```

```js
// display(selectedPods)
```

```js
const selectedTeams = view(Inputs.checkbox(_.chain(allPodsAndTeamNames).uniqBy("team-name").filter((o) => selectedPods.includes(o["pod-name"])).map("team-name").value().sort(), {label: "Team"}));
```

```js
// display(selectedTeams)
```

```js
// display(filteredServiceCommits)
```

```js
const serviceCommitNames = _.chain(filteredServiceCommits).uniqBy("_service-stack").map("_service-stack").sort().value()
```

```js
// display(serviceCommitNames)
```

<div>
<h2>${selectedPods.join(" & ")} - ${selectedTeams.join(" & ")}</h2>
<h4>${serviceCommitNames.length} service+stacks</h4>

<div class="grid grid-cols-3">
  <div class="card">
    <h2>Deployment Frequency</h2>
        <div>
        ${Plot.plot({
          marginTop: 30,
          marginLeft: -10,
          marginRight: 250,
          height: 900,
          color: {
              columns: 2,
              legend: true,
              domain: [
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
            ],
            range: ["Gold", "Khaki", "MediumOrchid", "Plum", "Thistle", "Lavender",  "RoyalBlue", "DodgerBlue", "SkyBlue", "LightSkyBlue", "PowderBlue", "Crimson"]
          },
          grid: false,
          x: {
            interval: "day",
            ticks: "1 day",
            axis: "top"
          },
          y: {
            axis: false
          },
          fy: {
            domain: serviceCommitNames
          },
          facet: {
            facetAnchor: "left",
            data: filteredServiceCommits,
            y: (d) => d["_service-stack"]
          },
          facetAnchor: "left",
            marks: [
              Plot.gridX({ticks: "days", stroke: "grey", strokeOpacity: 0.2, insetBottom: -0.5}),
            Plot.gridX({ticks: "saturday", stroke: "grey", strokeOpacity: 0.6, insetBottom: -0.5}),
            Plot.gridX({ticks: "sunday", stroke: "grey", strokeOpacity: 0.6, insetBottom: -0.5}),
              Plot.barY(
                filteredServiceCommits,
                Plot.groupX(
                  {y: "count"},
                  {x: (d) => Date.parse(d["start-time-utc"]), fill: "highest-environment"}
                )
              )
            ]
          })}
        </div>
  </div>

  <div class="card">
    <h2>Change Lead Time</h2>

```js
const prodServiceCommits = _.filter(serviceCommits, (sc) => _.some(sc.deployments, (sc, ["environment","production"])))
```

```js
// 40 minutes
const step = 40
// 6 groups of 40 minutes
const bands = 6
```

${Plot.plot({
  height: 950,
  marginTop: 85,
  marginLeft: -10,
  marginRight: 250,
  grid: true,
  x: {
    axis: "top",
    interval: "day",
    ticks: "1 day",
  },
  y: {
    domain: [0, step],
    axis: null
  },
  fy: {
    axis: "right",
    domain: serviceCommitNames,
    padding: 0.15,
    label: null,
  },
  color: {
    type: "ordinal",
    columns: 2,
    scheme: "reds",
    label: "Deployment duration",
    tickFormat: (i) => ((i + 1) * step).toLocaleString("en"),
    legend: true
  },
  marks: [
    Plot.gridX({ticks: "days", stroke: "grey", strokeOpacity: 0.2, insetBottom: -0.5}),
    Plot.gridX({ticks: "saturday", stroke: "grey", strokeOpacity: 0.6, insetBottom: -0.5}),
    Plot.gridX({ticks: "sunday", stroke: "grey", strokeOpacity: 0.6, insetBottom: -0.5}),
    d3.range(bands).map((band) => Plot.barY(prodServiceCommits, {dx: 0, x: (d) => Date.parse(d["start-time-utc"]), y: (d) => d["duration-minutes-clipped"] - band * step, fy: "_service-stack", fill: band, sort: "date", clip: true}))
  ]
})}
<div>



</div>



  </div>
<!--
  <div class="card">
    <h2>Change Failure Rate</h2>
  </div>
-->
<div class="card">
    <h2>Failed Deployment Recovery</h2>
        <div>
        ${Plot.plot({
            marginRight: 200,
            height: 960,
            marginTop: 75,
            grid: false,
        x: {
          interval: "day",
          ticks: "1 day",
          axis: "top"
        },
        y: {
            axis: false,
        },
        fy: {
            domain: serviceCommitNames,
            axis: "right"
          },
        facet: {
            data: maxCalced,
            y: (d) => d["_service-stack"],
        },
        color: {
            scheme: "blues",
            columns: 2,
            legend: true,
            type: "ordinal",
            domain: d3.range(0, 8)
        },
        marks: [
            Plot.gridX({ticks: "days", stroke: "grey", strokeOpacity: 0.2, insetBottom: -0.5}),
            Plot.gridX({ticks: "saturday", stroke: "grey", strokeOpacity: 0.6, insetBottom: -0.5}),
            Plot.gridX({ticks: "sunday", stroke: "grey", strokeOpacity: 0.6, insetBottom: -0.5}),
            Plot.barY(maxCalced,
            {
              x: "date",
              y: "restoration-time-ceiling",
              fill: "restoration-time-ceiling"
            })
        ]
      })}
    </div>

  </div>
</div>
</div>
