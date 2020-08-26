const Database = require('better-sqlite3');
const child_process = require('child_process');
const db = new Database('video.db');

let sleep = time=>new Promise(res=>setTimeout(res,time))

async function download_video(wvid,vid,part){
    console.log(wvid)
    await new Promise(function(resolve,reject){
        child_process.exec('./annie -f 16 -o videos/ -O '+vid+' https://www.bilibili.com/video/'+wvid+'?p='+part, function(error, stdout, stderr){
            if(error){
                console.log(wvid,'error.')
                return resolve()
            }
            let video_update = db.prepare('update video set download_time = ? where vid = ?')
            let time = new Date().getTime()
            video_update.run(time,vid)
            console.log(wvid,'done.')
            return resolve()
        })
    });
    await sleep(60 * 1000)
}

async function download_user_video(uid){
    let video_select = db.prepare('select vid,wvid,part,download_time from video where uid = ? and length < 1800 order by video_time desc limit 10')
    let videos = video_select.all(uid)
    
    for( let i of videos ){
        let wvid = i.wvid
        let vid = i.vid
        let part = i.part

        if(i.download_time !== null){
            continue
        }
        
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
