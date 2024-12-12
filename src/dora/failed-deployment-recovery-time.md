# Deployment Frequency

<div class="tip grid-rowspan-2" label="Methodology">

- For every commit that fails an execution in an environment+stage, what is the duration until the next successful execution in that environment+stage

</div>

```js
import {
    createAWSAccountLookupTable,
    addAccountDetailsToDeployments,
    defaultTableOptions,
    shortSha,
    sortDeploymentsByDate,
    applyDurationRangeToCommit,
    applyDurationRangeToCommitWithSort,
    flattenByCommitSha,
    flattenByEnvironmentStage,
    filterByQuarter,
    groupByRepository,
    groupByRepositoryAndEnvironmentStage,
    processForDeploymentRecoveryDuration,
    reduceByPipelineRestoration,
    calculateRestorationTime
} from "../components/deployments.js";
```

```js
const awsAccountMappings = FileAttachment("../data/config/aws-accountid-config.json").json()
```

```js
const allDeployments = FileAttachment("../data/config/deployments.csv").csv();
```

```js
const mappedDeployments = addAccountDetailsToDeployments(allDeployments.filter(filterByQuarter(dateRange)), createAWSAccountLookupTable(awsAccountMappings))
const byCommitSha = flattenByCommitSha(mappedDeployments)
const commitsWithDuration = byCommitSha.map(applyDurationRangeToCommit)
```

# Box Plot by days

```js
const flattenedCommits = flattenByCommitSha(mappedDeployments).map(applyDurationRangeToCommitWithSort)
```

```js
const commitsForReduction = calculateRestorationTime(mappedDeployments)
```


```js
const dateRange = view(Inputs.radio(["Q3", "Q4"], {label: "Quarter", value:"Q4"}));
```

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
