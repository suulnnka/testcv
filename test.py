import cv2
import math
import copy
from cnstd import CnStd

std = CnStd()

def get_key_frame(video_path):
    cap = cv2.VideoCapture(video_path)

    frames_number = cap.get(cv2.CAP_PROP_FRAME_COUNT)

    frames = []
    
    for i in range(0,10): #10

        pos = 0.05 + i * 0.1

        frame = math.floor(frames_number * pos)

        cap.set(cv2.CAP_PROP_POS_FRAMES,frame)

        _,frame = cap.read()

        frames.append(frame)

        #cv2.imwrite(str(i)+'.png',frame)
    
    cap.release()
    
    return frames

def quard_area(box):
    x_min = min(box[0][0],box[1][0],box[2][0],box[3][0])
    x_max = max(box[0][0],box[1][0],box[2][0],box[3][0])

    y_min = min(box[0][1],box[1][1],box[2][1],box[3][1])
    y_max = max(box[0][1],box[1][1],box[2][1],box[3][1])

    return (y_max - y_min) * (x_max - x_min)

def get_key_frame_box(frames):

    y_list = []

    num = 0

    for frame in frames:
        box_info_list = std.detect(frame)

        if box_info_list == None or len(box_info_list) == 0:
            continue

        max_area = 0
        y = [0,0]

        for i in box_info_list:
            box = i.get("box")

            area = quard_area(box)

            if area > max_area:
                max_area = area
                font_y_min = min(box[0][1],box[1][1],box[2][1],box[3][1])
                font_y_max = max(box[0][1],box[1][1],box[2][1],box[3][1])
                y[0] = font_y_min
                y[1] = font_y_max
        
        if max_area > 0:
            y_list.append(y)
            #cropped = frame[y[0]:y[1], : ]
            #cv2.imwrite( str(num) + '.png',cropped)

        num = num + 1

    return y_list
    
def get_subtitle_y(y_list):

    if len(y_list) < 2:
        print('not found subtitle')
        return

    y_map = []

    for y in y_list:
        flag = False
        mid = ( y[0] + y[1] ) / 2
        for i in y_map:
            if mid > ( i[0] / i[2] ) and mid < ( i[1] / i[2] ):
                i[0] = i[0] + y[0]
                i[1] = i[1] + y[1]
                i[2] = i[2] + 1
                i[3].append(y)
                flag = True
                break
        
        if flag == False:
            y_map.append([y[0],y[1],1, [y] ])
            continue
    
    max_num = 0
    true_y_list = []
    for y in y_map:
        if max_num < y[2]:
            max_num = y[2]
            true_y_list = y[3]
    
    font_size_list = []
    for i in true_y_list:
        font_size_list.append(i[1] - i[0])


    font_size_list.sort()

    size = 0
    max_num = 0
    last = 0
    last_num = 0
    for i in font_size_list:
        if i > last * 1.05 :
            last = i
            last_num = 1
        else:
            last_num = last_num + 1

        if last_num > max_num:
            size = last
            max_num = last_num
    
    y_min = 0
    y_max = 0
    y_count = 0

    for i in true_y_list:
        if ( i[1] - i[0] ) > size * 0.95 and ( i[1] - i[0] ) < size * 1.05:
            y_min = y_min + i[0]
            y_max = y_max + i[1]
            y_count = y_count + 1

    y_min = math.ceil(  y_min / y_count )
    y_max = math.floor( y_max / y_count )

    return [y_min,y_max]

def get_subtitle(video_path,y):
    return 0
    
video_path = 'test.mp4'

frames = get_key_frame(video_path)

print("get key frame done.")

y_list = get_key_frame_box(frames)
#y_list = [[310, 335], [310, 335], [310, 335], [306, 335], [310, 335], [0, 102], [288, 365], [310, 335], [302, 335], [310, 335]]

print("get key frame box done.")

subtitle_y = get_subtitle_y(y_list)

print("get subtitle y done.")

print(subtitle_y)

subtitle = get_subtitle(video_path,subtitle_y)

print("get subtitle done.")