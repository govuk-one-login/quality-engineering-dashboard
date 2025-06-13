import _ from "lodash";

export function accountNameToService(account) {
    return String(account)
        .replace(/^di-/i, '')
        .replace(/-(dev|build|staging|stage|integration|int|production|prod|non-prod)$/i, '')
}

export function shortSha(sha) {
    return _.truncate(sha, {length: 10, omission: ''})
}

export function removeOrg(repository) {
    return repository.replace("govuk-one-login/", "")
}
