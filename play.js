import { db } from "./db.js";

export const Functions = async (req,res) => {
  try {
    const [row] = await db.query("SELECT * FROM user_activities WHERE user_id = 13 ORDER BY created_at ASC");
    if(row.length > 10){
        const outs = row.slice(0,row.length)
        outs.map(async(out)=>{
            await db.query("DELETE FROM user_activities WHERE id = ?",[out.id])
            res.status(200).json(true)
        })
    }
    else{
        res.json({status:false})
    }
  } catch (err) {
    console.log(err.message || "error");
  }
};


