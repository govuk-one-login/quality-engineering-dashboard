import _ from "lodash";

export function createAWSAccountLookupTable(awsAccountMappings) {
    return _.reduce(awsAccountMappings, (acc1, pod) => {
        return [...acc1, ..._.reduce(pod.teams, (acc2, team) => {
            return [...acc2, ..._.reduce(team.accounts, (acc3, account) => {
                return [...acc3, {
                    pod_name: pod.pod_name,
                    team_name: team.team_name,
                    account_id: account.account_id,
                    account_name: account.account_name
                }]
            }, [])]
        }, [])]
    }, [])
}