import { db } from "../../db.js";

// Post a new activity
export const PostRecentactivities = async (user_id, text, type) => {
  if (!user_id || !text) {
    throw new Error("user_id and activity text are required");
  }

  try {
    await db.query(
      "INSERT INTO user_activities (user_id, activity, type) VALUES (?, ?, ?)",
      [user_id, text, type || null] // type can be optional
    );
    return { success: true };
  } catch (err) {
    console.error("Error inserting activity:", err.message);
    return { success: false, message: err.message };
  }
};

// Get recent activities for a user
export const getRecentactivities = async (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) {
    return res.status(400).json({ success: false, message: "User ID missing" });
  }

  try {
    // Limit to last 50 activities for performance
    const [recentActivities] = await db.query(
      "SELECT activity, type, created_at FROM user_activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [user_id]
    );
    res.status(200).json({ success: true, recents: recentActivities });
  } catch (err) {
    console.error("Error fetching activities:", err.message);
    res.status(500).json({ success: false, message: "Unable to fetch activities" });
  }
};
