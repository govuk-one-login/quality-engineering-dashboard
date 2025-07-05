# Bugs

```js
const allBugs = FileAttachment("../data/config/jira.csv").csv();
```

```js
const selectHighestEnvironment = (environmentsString) => {
  const environmentArray = String(environmentsString).toLowerCase().split(", ")
  if (environmentArray.includes("production")) {
    return "Production"
  } else if (environmentArray.includes("integration")) {
    return "Integration"
  } else if (environmentArray.includes("staging")) {
    return "Staging"
  } else if (environmentArray.includes("build")) {
    return "Build"
  } else if (environmentArray.includes("dev")) {
    return "Dev"
  } else {
    return "Not specified"
  }
}


const transformedBugs = allBugs.map((b) => {
    return {
        ...b,
      ["All Environments"]: b.Environment,
      Environment: selectHighestEnvironment(b.Environment),
    }
})
```

```js
// display(transformedBugs)
// display(transformedBugs[32])
// display(transformedBugs[32].Environment.split(","))
```

## By Priority

### Values
${Inputs.table(
  _.uniqBy(allBugs.map((b) => ({Priority: b.Priority})), "Priority"),
  {
    columns: ["Priority"]
  }
)}

### Heatmap

```js
display(
    Plot.plot({
      padding: 0,
      marginLeft: 150,
      grid: true,
      x: {axis: "top", label: "Priority", domain: ["Lowest","Low","Medium","High","Highest"]},
      y: {label: "Project"},
      color: {
        type: "linear",
        scheme: "YlGnBu",
        legend: true,
        // domain: d3.range(0, 50, 2),
      },
      marks: [
        Plot.cell(
            transformedBugs,
                Plot.group(
                    {fill: "count"},
                    {x: "Priority", y: "Project key",  inset: 0.5, fill: "count"}
                )
          ),
      ]
    })
)
```

## By Environment

### Values
${Inputs.table(
  _.uniqBy(allBugs.map((b) => ({Environment: b.Environment})), "Environment"),
  {
    columns: ["Environment"]
  }
)}

### Heatmap
```js
display(
    Plot.plot({
      padding: 0,
      marginLeft: 150,
      grid: true,
      x: {axis: "top", label: "Priority", domain: ["Not specified", "Dev","Build","Staging","Integration","Production"]},
      y: {label: "Project"},
      color: {
        type: "linear",
        scheme: "YlGnBu",
        legend: true,
        // domain: d3.range(0, 50, 2),
      },
      marks: [
        Plot.cell(
            transformedBugs,
                Plot.group(
                    {fill: "count"},
                    {x: "Environment", y: "Project key",  inset: 0.5, fill: "count"}
                )
          ),
      ]
    })
)
```
