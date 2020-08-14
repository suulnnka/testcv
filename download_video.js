const Database = require('better-sqlite3');
const db = new Database('video.db', { verbose: console.log });

db.pragma('cache_size = 32000');

console.log(db.pragma('cache_size', { simple: true })); // => 32000

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

// create_user()

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

// create_video()


