
import { db } from "../../db.js"



export const PostRecentactivities = async(user_id,text)=>{
    if(!user_id && !text){
        console.log("error")
    }
    try{
        await db.query('INSERT INTO user_activities (user_id,activity) VALUES(?,?)',[user_id,text])
        console.log('activities success')
    }
    catch(err){
        console.log(err.message)
    }
}



export const getRecentactivities = async(req,res)=>{
    const user_id = req.user.id
    try{
        const [recentActivities] = await db.query('SELECT * FROM user_activities WHERE user_id = ?',[user_id])
        res.status(200).json({ success: true, recents: recentActivities })
        console.log('get success')
    }
    catch(err){
        res.status(404).json({ success: false, message: "unable to fetch" });
    }
}