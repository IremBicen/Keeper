import { getUserDepartments, roleRank } from "../utils/roles";

describe("roleRank", () => {
  it("orders roles from lowest to highest correctly", () => {
    expect(roleRank.employee).toBeLessThan(roleRank.manager);
    expect(roleRank.manager).toBeLessThan(roleRank.coordinator);
    expect(roleRank.coordinator).toBeLessThan(roleRank.director);
    expect(roleRank.director).toBeLessThan(roleRank.admin);
  });
});

describe("getUserDepartments", () => {
  it("returns empty array when user has no department info", () => {
    expect(getUserDepartments(null as any)).toEqual([]);
    expect(getUserDepartments({} as any)).toEqual([]);
  });

  it("normalizes single department to array", () => {
    const result = getUserDepartments({ department: "Satış" } as any);
    expect(result).toEqual(["Satış"]);
  });

  it("merges department and departments[] and removes duplicates", () => {
    const user: any = {
      department: "Satış ",
      departments: ["Hukuk", "Satış", "Yazılım ve IT"],
    };
    const result = getUserDepartments(user);
    expect(result.sort()).toEqual(["Hukuk", "Satış", "Yazılım ve IT"].sort());
  });

  it("trims whitespace and ignores empty values", () => {
    const user: any = {
      department: "  Satış  ",
      departments: ["", "  Hukuk  ", null],
    };
    const result = getUserDepartments(user);
    expect(result).toEqual(["Hukuk", "Satış"]);
  });
});

