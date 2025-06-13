import {Temporal} from 'temporal-polyfill'
import _ from "lodash";

export function expandDateProperties (d) {
    const tzdate = Temporal.Instant.from(d).toZonedDateTimeISO(
        "Europe/London"
    ); // date in localized timezone
    const date = new Date(tzdate.epochMilliseconds);
    const year = tzdate.year;
    // Javascript Date object, stores date in browser's local timezone
    const hour = tzdate.hour;
    const dayOfMonth = tzdate.day;
    const dayOfYear = tzdate.dayOfYear;
    const weekOfYear = tzdate.weekOfYear;
    const day = days[tzdate.dayOfWeek + -1];
    const weekend = tzdate.dayOfWeek > 5 ? "Weekend" : "Weekday";
    const week = tzdate.weekOfYear;
    const month = months[tzdate.month - 1];
    const quarter =
        tzdate.month < 4
            ? "Q1"
            : tzdate.month < 7
                ? "Q2"
                : tzdate.month < 10
                    ? "Q3"
                    : "Q4";

    const quarterString =
        tzdate.month < 4
            ? "Q1: Jan - Mar"
            : tzdate.month < 7
                ? "Q2: Apr - Jun"
                : tzdate.month < 10
                    ? "Q3: Jul - Sep"
                    : "Q4: Oct - Dec";    const value = d;


    return {
        date,
        hour,
        day,
        dayOfYear,
        weekOfYear,
        weekend,
        week,
        month,
        quarter,
        quarterString,
        value,
        dayOfMonth,
        year,
        yearWeek: `${tzdate.yearOfWeek} ${weekOfYear < 10 ? '0':''}${weekOfYear}`,
        temporal: tzdate
    }
}

export function daysBetween (start, end) {
    const startTzdate = start?.temporal?.epochMilliseconds ? start.temporal : Temporal.Instant.from(start).toZonedDateTimeISO(
        "Europe/London"
    );

    const endTzdate = end?.temporal?.epochMilliseconds ? end.temporal : Temporal.Instant.from(end).toZonedDateTimeISO(
        "Europe/London"
    );


    // return 90
    return endTzdate.dayOfYear - startTzdate.dayOfYear - ((endTzdate.weekOfYear - startTzdate.weekOfYear) * 2)
    // return startTzdate.until(endTzdate, {largestUnit: 'days', smallestUnit:'minutes'}).days - ((endTzdate.weekOfYear - startTzdate.weekOfYear) * 2)

    // return startTzdate.until(endTzdate).round({largestUnit: "days", smallestUnit: "days"}).toString();
}

export function minutesBetween (start, end) {
    return start.until(end, {
        largestUnit: "minute",
        smallestUnit: "minute",
        roundingMode: "ceil"
    }).minutes
}

export const months = ["January","February","March","April","May","June","July","August","September","October","November","December"]
export const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const weekendDays = ["Saturday", "Sunday"]
export const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

export function sortDeploymentsByDate(a, b) {
    return Date.parse(a["start-time-utc"]) - Date.parse(b["start-time-utc"])
}

export function sortFailedDeploymentsByDate(a, b) {
    return Date.parse(a["failure-end-time-utc"]) - Date.parse(b["failure-end-time-utc"])
}

export function sortByDateWithKey(key) {
    return (a, b) => {
        return Date.parse(a[key]) - Date.parse(b[key])
    }
}

export function sortByTemporalWithKey(key) {
    return (a, b) => {
        return a[key].epochMilliseconds - b[key].epochMilliseconds
    }
}
