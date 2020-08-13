const Database = require('better-sqlite3');
const db = new Database('video.db', { verbose: console.log });

db.pragma('cache_size = 32000');

console.log(db.pragma('cache_size', { simple: true })); // => 32000

const stmt = db.prepare('INSERT INTO people VALUES ($firstName, $lastName, $age)');

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
    last_check_time datetime
)

create table video
(
    vid INTEGER not null
        constraint video_pk
        primary key autoincrement,
    uid integer not null,
    ubid integer not null,
    wvid varchar(30),
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