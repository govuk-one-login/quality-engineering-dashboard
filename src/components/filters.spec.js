import {expandDateProperties} from "./dates.js";
import {filterByQuarterWithKey} from "./filters.js";

describe("filters", () => {

    describe("#filterByQuarterWithKey", () => {
        test("should return true for Q3", () => {
            const obj = {
                "time": expandDateProperties("2024-09-01T12:00:01Z")
            }

            expect(filterByQuarterWithKey("time")("Q3")(obj)).toBeTruthy()
            expect(filterByQuarterWithKey("time")("Q4")(obj)).toBeFalsy()
        })

        test("should return true for Q4", () => {
            const obj = {
                "time": expandDateProperties("2024-12-01T12:00:01Z")
            }
            expect(filterByQuarterWithKey("time")("Q3")(obj)).toBeFalsy()
            expect(filterByQuarterWithKey("time")("Q4")(obj)).toBeTruthy()
        })
    })

})
