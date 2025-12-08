import { IUser } from "../models/User";

// Role ranking for hierarchy checks (higher number = higher level)
export const roleRank: Record<string, number> = {
  employee: 1,
  manager: 2,
  coordinator: 3,
  director: 4,
  admin: 99,
};

// Helper: get normalized list of departments for a user (supports multi-department roles)
export const getUserDepartments = (user: Partial<IUser> | any): string[] => {
  if (!user) return [];
  const single = (user.department || "").toString().trim();
  const multi = Array.isArray(user.departments) ? user.departments : [];
  const all = [...multi, single]
    .map((d) => d && d.toString().trim())
    .filter(Boolean);
  return Array.from(new Set(all));
};


