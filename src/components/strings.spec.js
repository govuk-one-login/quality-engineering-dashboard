import {accountNameToService, removeOrg, shortSha, stackNameWithoutEnvironment} from "./strings.js";

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
        describe("#stackNameWithoutEnvironment", () => {
            test("should remove di prefix", () => {
                expect(accountNameToService("di-accountname")).toEqual("accountname")
            })

            test("should remove environment suffixes", () => {
                expect(accountNameToService("accountname-build")).toEqual("accountname")
            })
        })
    });

    describe("#stackNameWithoutEnvironment", () => {
        test("should remove di prefix", () =>{
            expect(stackNameWithoutEnvironment("di-stackname")).toEqual("stackname")
        })

        test("should remove environment suffixes from beginning", () => {
            expect(stackNameWithoutEnvironment("build-stackname")).toEqual("stackname")
        })

        test("should remove environment suffixes from end", () => {
            expect(stackNameWithoutEnvironment("stackname-build")).toEqual("stackname")
        })

    })

    describe("#removeOrg", () => {
        test("should remove org prefix", () => {
            expect(removeOrg("govuk-one-login/repository")).toEqual("repository")
        })
    })
})
