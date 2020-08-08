import cv2
import math
import copy
import os
#import pytesseract
from cnstd import CnStd
from cnocr import CnOcr

std = CnStd()
ocr = CnOcr( ) #model_name='densenet-lite-gru' )

binary_threshold = 237

def quard_area(box):
    x_min = min(box[0][0],box[1][0],box[2][0],box[3][0])
    x_max = max(box[0][0],box[1][0],box[2][0],box[3][0])

    y_min = min(box[0][1],box[1][1],box[2][1],box[3][1])
    y_max = max(box[0][1],box[1][1],box[2][1],box[3][1])

    return (y_max - y_min) * (x_max - x_min)

def __calculate_white(_binary):
    """
    :param _binary: Mat矩阵
    :return: 白色像素点占比
    """
    height, width = _binary.shape
    return cv2.countNonZero(_binary) / (height * width)

def __similar_to_previous(_previous, _current):
    """
    :param _previous: 前一帧
    :param _current: 当前帧
    :return: 不同像素点数量
    """
    _image = cv2.absdiff(_previous, _current)
    return cv2.countNonZero(_image) + 1

def __preliminary_analyse(video_path,y):
    cv = cv2.VideoCapture(video_path)  # 读入视频文件
    current_analyse = 0
    similarity = [0, 0, 0]
    current_subtitle = [-1, -1, None, None]
    subtitle_list = []

    x = [97,525]

    _r, frame = cv.read()
    cropped = frame[y[0]:y[1], x[0]:x[1] ]  # 截取指定区域
    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)  # 灰度化
    _, binary = cv2.threshold(gray, binary_threshold, 255, cv2.THRESH_BINARY_INV)  # 反转二值化
    previous_binary = binary
    previous_cropped = cropped

    a = 0

    while _r:   # 循环读取视频帧
        cropped = frame[y[0]:y[1], x[0]:x[1] ]  # 截取指定区域
        gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)  # 灰度化
        _, binary = cv2.threshold(gray, binary_threshold, 255, cv2.THRESH_BINARY_INV)  # 反转二值化

        similarity = [similarity[1], similarity[2], __similar_to_previous(previous_binary, binary)]

        # 如果大于第1帧，且前一帧非空白图片
        if current_analyse > 1 and __calculate_white(previous_binary) < 0.99:
            # 如果综合判断为是不同帧
            if similarity[1] > 10 * similarity[0] and similarity[1] > 10 * similarity[2]:
                # 如果不是第一次添加时间轴
                if current_subtitle[0] != -1:
                    a = a + 1
                    #if a > 0 and a < 10:
                    subtitle_list.append(copy.deepcopy(current_subtitle))  # 添加时间轴
                    #if a > 10:
                    #    return subtitle_list

                current_subtitle[0] = current_analyse - 1  # 将当前时间轴起点设为前一帧
                current_subtitle[2] = previous_binary # previous_cropped  # 前一帧
            else:
                current_subtitle[1] = current_analyse - 1  # 将当前时间轴终点设为前一帧

        cv2.waitKey(1)
        previous_binary = binary
        previous_cropped = cropped
        _r, frame = cv.read()  # 下一帧
        current_analyse += 1

    subtitle_list.append(copy.deepcopy(current_subtitle))  # 添加时间轴
    cv.release()
    return subtitle_list

def __frame2file(subtitle_list):
    for subtitle in subtitle_list:
        cv2.imencode(".jpg", subtitle[2], [int(cv2.IMWRITE_JPEG_QUALITY), 40])[1]. \
            tofile('./tmp/' + str(subtitle[0]).zfill(6) + ".jpg")

def __frame2time(frame, fps):
    _s, _f = divmod(frame, fps)
    _f = int(_f * 1000 / fps)
    _m, _s = divmod(_s, 60)
    _h, _m = divmod(_m, 60)
    return "%02d:%02d:%02d,%03d" % (_h, _m, _s, _f)

video_path = 'test.mp4'

del_list = os.listdir('./tmp')
for f in del_list:
    os.remove(os.path.join('./tmp', f))

subtitle_list = __preliminary_analyse(video_path, [310, 335])

#run_recognizer

_cv = cv2.VideoCapture(video_path)
fps = float(_cv.get(cv2.CAP_PROP_FPS))
_cv.release()

for subtitle in subtitle_list:
    #content = pytesseract.image_to_string(subtitle[2], lang='chi_sim')
    content = ocr.ocr_for_single_line(subtitle[2])
    content = ''.join(content)
    subtitle[3] = content

# __frame2file(subtitle_list)

output = open("test.srt", mode="w", encoding="utf-8")
for i in range(len(subtitle_list) - 1):
    output.write("%d\n%s --> %s\n%s\n\n" % (i + 1,
                                            __frame2time(subtitle_list[i][0], fps),
                                            __frame2time(subtitle_list[i][1], fps),
                                            subtitle_list[i][3]))
output.close()