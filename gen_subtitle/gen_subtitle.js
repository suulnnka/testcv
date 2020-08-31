/*
from PIL import Image, ImageDraw, ImageFont

image = Image.new('RGB', (1920, 200), (0, 0, 0))

draw = ImageDraw.Draw(image)

font = ImageFont.truetype('font/msyh.ttf', size=72)

draw.text( (10, 10), '中国中央电视台', (255,255,255), font=font)

image.save(open('test.png', 'wb'), 'png')
*/

const gm = require('gm')

let strokeWitdh = 1
let strokeColor = '#000'
let fontSize = 48
let fontColor = '#fff'
let fontPath = 'font/msyh.ttf'
let savePath = 'new.png'

function draw_with_no_bg(text, savePath, fontPath, fontSize, fontColor, strokeWitdh){
    return new Promise(function(resolve, reject){
        gm(1920, 80, "#888")
            .font(fontPath)
            .fontSize(fontSize)
            .stroke('#000',strokeWitdh)
            .fill(fontColor)
            .gravity('Center')
            .drawText(0, 0, text)
            .write(savePath, resolve)
    })
}

async function main(){
    await draw_with_no_bg('你好，世界',savePath,fontPath,fontSize,fontColor,strokeWitdh)
}

main()
