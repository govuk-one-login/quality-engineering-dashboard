```js
import {
    createAWSAccountLookupTable,
    addAccountDetailsToDeployments,
    defaultTableOptions,
    shortSha,
    sortDeploymentsByDate,
    filterByQuarter,
    applyDurationRangeToCommit,
    flattenByCommitSha
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
const commitsWithDuration = flattenByCommitSha(mappedDeployments).map(applyDurationRangeToCommit)
```

<div class="tip grid-rowspan-2" label="Methodology">

- For every commit, calculate the total duration by using the earliest start time and the latest end time over all deployments

</div>


# Box Plot by minutes

```js
const dateRange = view(Inputs.radio(["Q3", "Q4"], {label: "Quarter", value:"Q4"}));
```


```js
const fillType = view(Inputs.radio(["pod", "team"], {label: "Color", value:"pod"}));
```


```js
display(Plot.plot({
    marginLeft: 270,
    marginRight: 50,
    width: 1200,
    marks: [Plot.boxX(commitsWithDuration, { x: "duration", y: "repository", fill: fillType })]
}))


```
