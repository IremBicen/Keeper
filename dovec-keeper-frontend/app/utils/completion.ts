export function computeSurveyCompletionForUser(params: {
  user: any;
  surveys: any[];
  users: any[];
  responses: any[];
}) {
  const { user, surveys, users, responses } = params;

  const result = new Map<string, { filled: number; required: number }>();

  if (!user) return result;

  const currentUserId =
    (user as any)?.id?.toString() || (user as any)?._id?.toString();
  if (!currentUserId) return result;

  // Build map: surveyId -> Set<targetEmployeeId> that current user has submitted for
  const perSurveyTargets = new Map<string, Set<string>>();

  (responses || []).forEach((r: any) => {
    if (!r || r.status !== "submitted") return;

    const surveyObj: any =
      typeof r.survey === "string" ? null : (r.survey as any);
    const surveyIdRaw =
      typeof r.survey === "string" ? r.survey : surveyObj?._id || surveyObj?.id;
    if (!surveyIdRaw) return;
    const surveyId = surveyIdRaw.toString();

    const titleLower = (
      surveyObj?.title ||
      surveyObj?.surveyName ||
      ""
    )
      .toString()
      .toLowerCase();
    const isManagerForm = titleLower.includes("yönetici");
    const isTeammateForm = titleLower.includes("takım arkadaşı");

    const empIdRaw =
      typeof r.employee === "string"
        ? r.employee
        : r.employee?._id || r.employee?.id;
    const evalIdRaw =
      typeof r.evaluator === "string"
        ? r.evaluator
        : r.evaluator?._id || r.evaluator?.id;

    let actorIdRaw: any;
    if (isManagerForm || isTeammateForm) {
      actorIdRaw = evalIdRaw || empIdRaw;
    } else {
      actorIdRaw = empIdRaw;
    }

    const actorId = actorIdRaw?.toString();
    const targetId = empIdRaw?.toString();
    if (!actorId || !targetId || actorId !== currentUserId) return;

    if (!perSurveyTargets.has(surveyId)) {
      perSurveyTargets.set(surveyId, new Set<string>());
    }
    perSurveyTargets.get(surveyId)!.add(targetId);
  });

  const currentUserFull =
    users.find(
      (u: any) =>
        u._id?.toString() === currentUserId || u.id?.toString() === currentUserId
    ) || user;

  const getUserId = (u: any) => (u?._id || u?.id)?.toString() || "";

  surveys.forEach((survey: any) => {
    const sId = (survey._id || survey.id)?.toString();
    if (!sId) return;

    const title = (survey.title || survey.surveyName || "").toLowerCase();
    const isManagerForm = title.includes("yönetici");
    const isTeammateForm = title.includes("takım arkadaşı");

    const role = (currentUserFull.role || "").toLowerCase();
    const deptRaw = (currentUserFull.department || "").toString().trim();
    const dept = deptRaw;

    const submittedTargets = perSurveyTargets.get(sId) || new Set<string>();

    let filled = 0;
    let required = 0;

    if (isManagerForm) {
      if (!dept) {
        result.set(sId, { filled: 0, required: 0 });
        return;
      }

      const deptNorm = dept.toLowerCase();

      const inSameDept = (v: any) => {
        const mainDept = (v.department || "").toString().trim().toLowerCase();
        const extraDepts = Array.isArray(v.departments)
          ? v.departments.map((d: any) => d.toString().trim().toLowerCase())
          : [];
        const allDepts = [mainDept, ...extraDepts].filter(Boolean);
        return allDepts.includes(deptNorm) && getUserId(v) !== currentUserId;
      };

      let requiredUsers: any[] = [];

      if (role === "employee") {
        const managers = users.filter(
          (v: any) =>
            (v.role || "").toLowerCase() === "manager" && inSameDept(v)
        );
        const coordinators = users.filter(
          (v: any) =>
            (v.role || "").toLowerCase() === "coordinator" && inSameDept(v)
        );
        const directors = users.filter(
          (v: any) =>
            (v.role || "").toLowerCase() === "director" && inSameDept(v)
        );

        if (managers.length) {
          requiredUsers = managers;
        } else if (coordinators.length) {
          requiredUsers = coordinators;
        } else if (directors.length) {
          requiredUsers = directors;
        }
      } else if (role === "manager") {
        requiredUsers = users.filter(
          (v: any) =>
            inSameDept(v) &&
            ["coordinator", "director"].includes(
              (v.role || "").toLowerCase()
            )
        );
      } else if (role === "coordinator") {
        requiredUsers = users.filter(
          (v: any) =>
            inSameDept(v) && (v.role || "").toLowerCase() === "director"
        );
      } else {
        requiredUsers = [];
      }

      const requiredTargets = requiredUsers
        .map((v: any) => getUserId(v))
        .filter(Boolean);

      filled = requiredTargets.filter((tid) => submittedTargets.has(tid)).length;
      required = requiredTargets.length;
    } else if (isTeammateForm) {
      if (!dept) {
        result.set(sId, { filled: 0, required: 0 });
        return;
      }

      const teammates = users.filter((v: any) => {
        const vDept = (v.department || "").toString().trim();
        const vRole = (v.role || "").toLowerCase();
        const vId = getUserId(v);
        return (
          vRole === "employee" &&
          vDept === dept &&
          vId &&
          vId !== currentUserId
        );
      });

      required = teammates.length;
      filled = teammates.filter((tm: any) =>
        submittedTargets.has(getUserId(tm))
      ).length;
    } else {
      // Self/keeper/general surveys: completed if they evaluated themselves
      filled = submittedTargets.has(currentUserId) ? 1 : 0;
      required = 1;
    }

    result.set(sId, { filled, required });
  });

  return result;
}


