import {Temporal} from 'temporal-polyfill'
import _ from "lodash";


// not effecient algoritm
/*

- given all deployments for a particular service-stack
- get all deployments that make it to production successfully
- get earliest date + commit-sha for all commit-shas, sort by date
- group by commit-sha

- for i loop over sorted
    for i, till end of sorted list
        does this commit reach production sucessfully?

- loop over all deployments
- use production deployments to reset counters
- determine
    - min/max times
    - number of commits
*/

const utcCompareFn = (a, b) => {
    return a["start-time-utc"] < b["start-time-utc"] ? a : b
}

const utcSortFn = (a, b) => {
    return a["start-time-utc"] > b["start-time-utc"] ? a : b
}

export function createOrderedCommitLookup(deployments) {
    const groupedByCommits = Object.groupBy(deployments, (d) => d["commit-sha"]);

    const earliestCommits = Object.keys(groupedByCommits).map((commitSha) => {
        return groupedByCommits[commitSha].reduce(utcCompareFn, {})
    }).sort(utcCompareFn).reverse();

    return {
        commits: groupedByCommits,
        lookup: earliestCommits
    }
}
export function calculateStatisticsPerCommit(deployments) {
    const lookupTable = createOrderedCommitLookup(deployments);

    const stats = [];

    // Using a for-i loop over the sorted lookup property so that we can use i to start the search
    // for the next production deployment. This brings the O(N) down to something approaching O(1)
    // with a worst case of 1/2 O(N)^2
    for(let i=0; i<lookupTable.lookup.length; i++){
        const newStat = {
            commits: [lookupTable.lookup[i]["commit-sha"]],
            deployments:[lookupTable.commits[lookupTable.lookup[i]]],
            "start-time-utc": _.minBy(lookupTable.commits[i], "start-time-utc")["start-time-utc"],
            "end-time-utc": _.maxBy(lookupTable.commits[i], "end-time-utc")["end-time-utc"],
            // "start-time-utc" (deployment["start-time-utc"] < aggregated["start-time-utc"]) ? deployment["start-time-utc"] : aggregated["start-time-utc"];
            // "end-time-utc": (deployment["end-time-utc"] > aggregated["end-time-utc"]) ? deployment["end-time-utc"] : aggregated["end-time-utc"];

        };
        newStat.commits

        stats.push(newStat)
    }

    return stats
}

/*
 */

// get deployments with -10% range as a buffer
// sort commits by date descending
// reduce all commits by
//   - discard until production deployment
//   - all deployments until next produciton deployment were backed up behind this one
//   - track all environment / stages for later analysis
// keep going until first production deployment pass the required start date

// reprocess data
//  - deployments that go from production to starting environment aree full deploys
//  - deployments that are within the same environment are canaries
//    - retries are represented in a normal flow
//  - deployments that are dont' have a full flow are backed up behi9nd other deployments

// filter result to expected date range (

export function calculateAggregationMetrics (
    deploymentsPerServiceStack,
    targetEnvironment="production",
    targetStage="deploy") {

    const sorted = deploymentsPerServiceStack.sort((a, b) => a["start-time-utc"] > b["start-time-utc"] ? 1 : -1 );
    // const productionDeply;

    const grouped = [];
    const defaultAggregated = {
        commits: [],
        "start-time-utc": "2100-12-31T23:59:59Z",
        "end-time-utc": "1900-01-01T00:00:00Z"
        // "min-time-to-production": -Math.infinity,
        // "max-time-to-production": -Math.infinity
    };

    let aggregated = {...defaultAggregated };

    for (const deployment of sorted) {
        if(
            (deployment["environment"] === targetEnvironment) &&
            (deployment["stage"] === targetStage)) {
            aggregated = {...defaultAggregated};
        }

        console.log(deployment)
        console.log(deployment["start-time-utc"] >= aggregated["start-time-utc"])
        console.log(deployment["start-time-utc"] <= deployment["end-time-utc"])
        aggregated.commits.push(deployment["commit-sha"]);
        aggregated["start-time-utc"] = (deployment["start-time-utc"] < aggregated["start-time-utc"]) ? deployment["start-time-utc"] : aggregated["start-time-utc"];
        aggregated["end-time-utc"] = (deployment["end-time-utc"] > aggregated["end-time-utc"]) ? deployment["end-time-utc"] : aggregated["end-time-utc"];
        aggregated["time-to-production"] = Temporal.Instant.from(aggregated["start-time-utc"]).until(Temporal.Instant.from(aggregated["end-time-utc"])).round("minutes").toString();
        // aggregated["min-time-to-production"] = deployment["end-time-utc"] - deployment["start-time-utc"];
        // aggregated["max-time-to-production"] = deployment["end-time-utc"] - deployment["start-time-utc"];
    }


    console.log(aggregated);


    return grouped;

    return {
        ...aggregated,
        commits: [...new Set(aggregated["commits"])],

    };
}

/*
for all deployments
- does it contain env+fetch & env+promote for each (build,staging,production)
 */
