import { Router } from "express";
import User from "../models/User";
import { protect, authorize } from "../middleware/auth";

const router = Router();

// GET /api/users - Get users (admin sees all, manager sees only their department)
router.get("/", protect, async (req: any, res) => {
  try {
    let query: any = {};
    const forEvaluation = req.query.forEvaluation === 'true';
    
    // Managers can only see users in their department
    if (req.user.role === "manager") {
      const managerDept = req.user.department;
      if (!managerDept) {
        return res.status(403).json({
          message: "Manager must have a department assigned to view users"
        });
      }

      if (forEvaluation) {
        // For evaluation purposes:
        // return users that share the manager's department
        // via either `department` or `departments` array
        query = {
          $or: [
            { department: managerDept },
            { departments: managerDept },
          ],
        };
      } else {
        // Default behaviour: managers only see users in their primary department
        query.department = managerDept;
      }
    } else if (req.user.role === "employee" && forEvaluation) {
      // Employees can fetch users for evaluation purposes
      // Return:
      // - Employees in the same department (for teammate surveys)
      // - All potential superiors (manager / coordinator / director / admin)
      query = {
        $or: [
          { department: req.user.department, role: "employee" }, // Teammates
          { role: { $in: ["manager", "coordinator", "director", "admin"] } } // Potential superiors
        ]
      };
    } else if (req.user.role !== "admin") {
      // Regular users cannot see other users unless for evaluation
      return res.status(403).json({ message: "Access denied" });
    }
    
    const users = await User.find(query).select("-password");
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch users" });
  }
});

// GET /api/users/:id - Get specific user (if user has access)
router.get("/:id", protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Managers can only see users in their department
    if (req.user.role === "manager") {
      if (user.department !== req.user.department) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (req.user.role !== "admin") {
      // Regular users can only see themselves
      const userIdStr = String(user._id);
      const reqUserIdStr = String(req.user._id);
      if (userIdStr !== reqUserIdStr) {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch user" });
  }
});

// PUT /api/users/:id - Update user (admin only)
router.put("/:id", protect, authorize("admin"), async (req: any, res) => {
  try {
    const { name, email, role, department, kpi } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (kpi !== undefined) updateData.kpi = kpi; // Allow KPI update
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Failed to update user" });
  }
});

export default router;
