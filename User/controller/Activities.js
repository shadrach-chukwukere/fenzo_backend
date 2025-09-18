import { db } from "../../db.js";

export const PostRecentactivities = async (user_id, text, type) => {
  if (!user_id && !text) {
    console.log("error");
  }
  try {
    await db.query(
      "INSERT INTO user_activities (user_id,activity,type) VALUES(?,?,?)",
      [user_id, text, type]
    );
  } catch (err) {
    console.log(err.message);
  }
};

export const getRecentactivities = async (req, res) => {
  const user_id = req.user.id;
  try {
    const [recentActivities] = await db.query(
      "SELECT activity , type , created_at FROM user_activities WHERE user_id = ? ORDER BY created_at DESC",
      [user_id]
    );
    res.status(200).json({ success: true, recents: recentActivities });
  } catch (err) {
    res.status(404).json({ success: false, message: "unable to fetch" });
  }
};
