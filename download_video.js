const Database = require('better-sqlite3');
const axios = require('axios')
const db = new Database('video.db');

db.pragma('cache_size = 32000');

let change_ip_url = 'https://tps.kdlapi.com/api/changetpsip?orderid=909823772898578&signature=iyhbimxq4zthtbvqwcgjv5emps05lvd6'

last_change_ip_time = 0
last_time = 0
const sleep = function (){
    return new Promise(function(res,rej){
        let now = new Date().getTime();
        let diff = now - last_time
        let need_sleep_time = Math.max(500 - diff,0)
        setTimeout(async function(){
            last_time = new Date().getTime()
            if(now - last_change_ip_time > 1000 * 2){
                last_change_ip_time = now
                //let status = await axios.get(change_ip_url)
                //console.log(status.data)
                //let new_ip = status.data.data.new_ip
                //console.log('change ip done,ip:'+new_ip)
            }
            res()
        },need_sleep_time)
    })
}

// 代理服务器
const proxyHost = "tps185.kdlapi.com";
const proxyPort = 15818;

// 代理隧道验证信息
const proxyUser = "t19823772898528";
const proxyPass = "hn5zk0yg";

let proxy = {
    host: proxyHost,
    port: proxyPort,
    auth: {
        username: proxyUser,
        password: proxyPass
    },
}

// console.log(db.pragma('cache_size', { simple: true })); // => 32000

// const stmt = db.prepare('INSERT INTO people VALUES ($firstName, $lastName, $age)');

/*
create table user_box
(
    ubid INTEGER not null
        constraint user_box_pk
        primary key autoincrement,
    uid integer not null,
    start_time datetime,
    end_time datetime,
    font_name varchar(20),
    font_color varchar(20),
    font_bg_color varchar(20),
    font_size int,
    subtitle_up int,
    subtitle_down int,
    subtitle_left int,
    subtitle_right int
)
create table user
(
    uid INTEGER default 0 not null
	    constraint user_pk
	    primary key autoincrement,
	wid varchar(50) not null,
	website varchar(50) not null,
	name varchar(50),
	have_subtitle boolean default false not null,
    last_check_time datetime,
    main_type varchar(50)
)

create table video
(
    vid INTEGER not null
        constraint video_pk
        primary key autoincrement,
    uid integer not null,
    ubid integer,
    wvid varchar(30) not null,
    video_name varchar(50),
    part int,
    website varchar(20),
    download_time datetime,
    video_time datetime,

    size int,
    length int,
    type varchar(20),

    have_subtitle boolean,
    is_ocr varchar(10), -- yes no doing
    is_download varchar(10), -- yes no doing

    need_download boolean,
    need_check_download boolean,
    need_check_ocr boolean,
    need_ocr boolean
)
*/

async function create_user(){
    let user_list = require('./videoList.json')

    const stmt = db.prepare('INSERT INTO user (wid, name, website, main_type) VALUES (?, ?, ?, ?)');

    for(i of user_list){
        const info = stmt.run(i.uid.toString(),i.name,'bilibili',i.area);

        console.log(info)
    }
}

async function create_video(){
    let user_list = require('./videoList.json')

    const video_create = db.prepare('INSERT INTO video (uid, wvid, part, website) VALUES (?, ?, ?, ?)');
    const user_select  = db.prepare('SELECT * FROM user WHERE website=? and wid=?')

    for(i of user_list){
        let user = user_select.get('bilibili',i.uid.toString())

        for( j in i.videos ){
            video_id = i.videos[j]
            // console.log(video_id)
            const info = video_create.run(user.uid,video_id,1,'bilibili');
        }
    }
}

// const user_select  = db.prepare('SELECT * FROM user WHERE website=? and uid=?')
// let user = user_select.get('bilibili',6)
// console.log(user)

//let video_select = db.prepare("SELECT wvid,need_download FROM video WHERE need_download = true")

//let video = video_select.all();
//console.log(video)

function set_need_download(){
    // 1. user的have_subtitle == true
    // 2. 长度不超过30分钟 (?)
    // 3. video的have_subtitle != false

}

async function get_videos_info(){
    let video_select = db.prepare("SELECT wvid FROM video WHERE video_name is null")
    let video = video_select.all();
    for(let i in video){
        wvid = video[i].wvid
        get_bilibili_video_info(wvid)
    }
}

async function download_bilibili_video(bv){
    // get part number from database
    // download every part
    // ./annie -f 16 -p https://www.bilibili.com/video/BV1iV411z7Ub
    // rename video
    // mv video into new folder
    // update database
}

async function download_videos(){
    let video_select = db.prepare("SELECT wvid FROM video WHERE need_download = true AND part = 1")
    let video = video_select.all();
    for(let i in video){
        wvid = video[i].wvid
        download_bilibili_video(wvid)
    }
}

// get_videos_info()

// if user have subtitle
// if video length < 30 min
//     need_download = true
// else
//     need_check_download = true

// if have need download video
// download it

async function get_user_video(){
    let user_select = db.prepare("SELECT uid FROM user")
    let user_list = user_select.all();
    
    // console.log(user)

    let video_select = db.prepare("SELECT wvid FROM video WHERE uid = ? LIMIT 10")

    for( let i in user_list ){
        let uid = user_list[i].uid
        
        let video_list = video_select.all(uid)

        console.log(video_list)

    }

}

async function get_bilibili_video_part_info(av,cid,part,uid){
    let url = 'https://api.bilibili.com/x/web-interface/view?aid=' + av + '&cid=' + cid
    await sleep()
    let json = await axios.get(url,{proxy})

    let data = json.data.data

    // let mid = data.owner.mid

    // let user_select = db.prepare('SELECT uid FROM user WHERE wid=?');
    // let uid = user_select.get(String(mid)).uid

    let wvid = data.bvid
    let video_name = data.title+'-'+data.pages[part-1].part
    let video_time = data.ctime
    let length = data.duration
    let type = data.tname

    let subtitle = data.subtitle
    let subtitle_json = null

    for( let i in subtitle.list ){
        if( subtitle.list[i].lan == 'zh-CN' ){
            subtitle_json = subtitle.list[i].subtitle_url
        }
    }

    let video_insert = db.prepare("INSERT INTO video (uid,wvid,part,website,video_name,video_time,length,type,subtitle_json) VALUES (?,?,?,?,?,?,?,?,?)")
    video_insert.run(uid,wvid,part,'bilibili',video_name,video_time,length,type,subtitle_json)
}

async function get_bilibili_video_info(bv){
    // get info from api

    // update video info

    // if part > 1
    //   insert new video into video table

    // console.log(bv)

    let url = 'https://api.bilibili.com/x/web-interface/view?bvid=' + bv
    // url = 'https://api.bilibili.com/x/web-interface/view?bvid=BV1Yt411R7Nk'

    console.log(bv)

    await sleep()
    let json = await axios.get(url,{proxy})

    let data = json.data.data

    let subtitle
    try{
        subtitle = data.subtitle
    }catch(err){
        let video_delete = db.prepare('DELETE FROM video WHERE wvid = ?');
        video_delete.run(bv)
        console.log(bv,'delete')
        return
    }

    let subtitle_json = null

    let aid = data.aid

    for( let i in subtitle.list ){
        if( subtitle.list[i].lan == 'zh-CN' ){
            subtitle_json = subtitle.list[i].subtitle_url
        }
    }

    for( let i = 1 ; i < data.pages.length ; i ++ ){
        let page = data.pages[i]
        let cid = page.cid
        let part = page.page

        let user_select = db.prepare('SELECT uid FROM video WHERE wvid=? AND website=?');
        let uid = user_select.get(bv, 'bilibili').uid

        await get_bilibili_video_part_info(aid,cid,part,uid)
    }

    let video_name = data.title
    if ( data.videos > 1){
        video_name = video_name+'-'+data.pages[0].part
    }

    let video_time = data.ctime
    let length = data.duration
    let type = data.tname

    let video_update = db.prepare("UPDATE video SET video_name=?,video_time=?,length=?,type=?,subtitle_json=?  WHERE wvid = ? ")
    video_update.run(video_name,video_time,length,type,subtitle_json,bv)

    // console.log(JSON.stringify(data,null,2))
}

async function get_videos_info(){

    let select = db.prepare("SELECT max(vid) as max FROM video")
    let total = select.get().max

    let pos = 0

    while( pos < total ){
        let video_select = db.prepare("SELECT vid,wvid,video_name FROM video WHERE vid > ? AND video_name is null AND part = 1 ORDER BY vid ASC LIMIT 100")
        let video_list = video_select.all(pos)

        for(let i in video_list){
            let vid = video_list[i].vid
            pos = Math.max(vid,pos)
        
            let video_name = video_list[i].video_name
            let wvid = video_list[i].wvid

            if(!video_name){
                try{
                    await get_bilibili_video_info(wvid)
                }catch(err){
                    console.error(wvid,'error')
                    console.error(err)
                }
            }

        }
    
    }
}

get_videos_info()
