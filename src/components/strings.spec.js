import {accountNameToService, shortSha} from "./strings.js";

describe("strings", () => {
    describe("#shortSha", () => {
        test("should truncate a long sha", () =>{
            expect(shortSha("ABCDEFGHIJKLMNOP")).toEqual("ABCDEFGHIJ")
        })

        test("should return a short sha unchanged", () => {
            expect(shortSha("ABC")).toEqual("ABC")
        })
    })

    describe("#accountNameToService", () => {
        test("should remove di prefix", () =>{
            expect(accountNameToService("di-accountname")).toEqual("accountname")
        })

        test("should remove environment suffixes", () => {
            expect(accountNameToService("accountname-build")).toEqual("accountname")
        })
    })
})
