const Database = require('better-sqlite3');
const db = new Database('video.db', { verbose: console.log });

db.pragma('cache_size = 32000');

console.log(db.pragma('cache_size', { simple: true })); // => 32000

const stmt = db.prepare('INSERT INTO people VALUES ($firstName, $lastName, $age)');

// user : uid, website_id, name, have_subtitle, website
// user box: ubid,uid,start_time,end_time,up,down,left,right,font_color,font_size,font_name,font_bg_color
// video : uid, is_download( no,yes,doing ), have_subtitle, download_time, video_time
//         size, length, is_ocr(no,yes,doing), need_download, need_check_download, type,
//         ubid, need_ocr, need_check_ocr

// user_info : user_follower...
// video_info : watch_times...
