import {
    expandDateProperties,
    daysBetween,
    sortDeploymentsByDate,
    sortFailedDeploymentsByDate,
    sortByDateWithKey
} from "./dates"
import {Temporal} from "temporal-polyfill";

describe("dates", () => {
    describe("#expandDateProperties", () => {

        it('should expand date', () => {
            const utcDate ="2025-01-01T12:00:00Z"

            const expandedDate = expandDateProperties(utcDate)

            expect(expandedDate).toEqual({
                "date": new Date(utcDate),
                "day": "Wednesday",
                "dayOfMonth": 1,
                "dayOfYear": 1,
                "hour": 12,
                "month": "January",
                "quarter": "Q1",
                "quarterString": "Q1: Jan - Mar",
                "value": "2025-01-01T12:00:00Z",
                "week": 1,
                "weekOfYear": 1,
                "year": 2025,
                "yearWeek": "2025 01",
                "weekend": "Weekday",
                "temporal": Temporal.Instant.from(utcDate).toZonedDateTimeISO(
                    "Europe/London")
            })
        })
    })

    describe("#daysBetween", () => {
        test("should calculate week days between dates", () => {
            const utcStart = "2025-01-01T12:00:00.000Z";
            const utcEnd = "2025-01-04T12:00:00.000Z";

            const daysCount = daysBetween(utcStart, utcEnd);

            expect(daysCount).toEqual(3)
        })
    })


    describe("#sortDeploymentsByDate", () => {
        test("should sort by start time", () => {
            const a = {
                "start-time-utc": "2025-01-01T12:00:00Z"
            };

            const b = {
                "start-time-utc": "2025-01-01T12:00:01Z"
            }

            expect(sortDeploymentsByDate(a, b)).toEqual(-1000)
        })
    })

    describe("#sortFailedDeploymentsByDate", () => {
        test("should sort by failure end time", () => {
            const a = {
                "failure-end-time-utc": "2025-01-01T12:00:00Z"
            };

            const b = {
                "failure-end-time-utc": "2025-01-01T12:00:01Z"
            }

            expect(sortFailedDeploymentsByDate(a, b)).toEqual(-1000)
        })
    })

    describe("#sortByDateWithKey", () => {
        test("should sort by time", () => {
            const a = {
                "time-utc": "2025-01-01T12:00:00Z"
            };

            const b = {
                "time-utc": "2025-01-01T12:00:01Z"
            }

            expect(sortByDateWithKey("time-utc")(a, b)).toEqual(-1000)
        })
    })
})