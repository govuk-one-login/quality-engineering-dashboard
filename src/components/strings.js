import _ from "lodash";

export function accountNameToService(account, repository) {
    const longName = account ?? repository
    return String(longName)
        .replace(/^di-/i, '')
        .replace(/-(dev|build|staging|stage|integration|int|production|prod|non-prod)$/i, '')
}

export function stackNameWithoutEnvironment(stackName) {
    return String(stackName)
        .replace(/^di-/i, '')
        .replace(/-(dev|build|staging|stage|integration|int|production|prod|non-prod)$/i, '')
        .replace(/^(dev|build|staging|stage|integration|int|production|prod|non-prod)-/i, '')
        .replace(/-(deploy|promo-deploy|promodeploy|main)$/i, '')
}

export function shortSha(sha) {
    return _.truncate(sha, {length: 10, omission: ''})
}

export function removeOrg(repository) {
    return repository.replace("govuk-one-login/", "")
}
