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
