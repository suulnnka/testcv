const Database = require('better-sqlite3');
const child_process = require('child_process');
const db = new Database('video.db');

async function download_video(wvid,vid,part){
    console.log(wvid)
    await new Promise(function(res,rej){
        child_process.exec('./annie -f 16 -o videos/ -O '+vid+' https://www.bilibili.com/video/'+wvid+'?p='+part, function(error, stdout, stderr){
            if(error){
                console.log(wvid,'error.')
                return rej()
            }
            let video_update = db.prepare('update video set download_time = ? where vid = ?')
            let time = new Date().getTime()
            video_update.run(time,vid)
            console.log(wvid,'done.')
            return res()
        })
    });
}

async function download_user_video(uid){
    let video_select = db.prepare('select vid,wvid,part from video where uid = ? and download_time is null and length < 1800 order by vid asc limit 10')
    let videos = video_select.all(uid)
    
    for( let i of videos ){
        let wvid = i.wvid
        let vid = i.vid
        let part = i.part
        
        await download_video(wvid,vid,part)
    }
}

async function download_all_video(){
    let user_select = db.prepare('select uid from user')
    let users = user_select.all()

    for( let i of users ){
        let uid = i.uid
        await download_user_video(uid)
    }
}

download_all_video()
// download_video('BV1fb411P7WD',3,1)
