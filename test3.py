import cv2
import math
import os
from cnocr import CnOcr

import numpy as np

import numba
from numba import jit

ocr = CnOcr()

kernel = cv2.getStructuringElement(cv2.MORPH_RECT,(5,5))

@jit(nopython=True)
def dilate_jit(frame,erosion):
    height, width = frame.shape

    for i in range(height):
        for j in range(width):
            if erosion[i][j] < 128 and frame[i][j] < 128:
                frame[i][j] = 255

    return frame

@jit(nopython=True)
def dilate_flood_fill(frame,dilation):
    height, width = frame.shape

    stack = []

    for i in range(height):
        for j in range(width):
            if dilation[i][j] < 128:
                frame[i][j] = 255
                stack.append([i,j])

    while len(stack) > 0 :
        point = stack.pop()
        x = point[0]
        y = point[1]

        if x > 0 and frame[x-1][y] < 128 :
            frame[x-1][y] = 255
            stack.append([x-1,y])
        if y > 0 and frame[x][y-1] < 128 :
            frame[x][y-1] = 255
            stack.append([x,y-1])
        if x < height - 1 and frame[x+1][y] < 128 :
            frame[x+1][y] = 255
            stack.append([x+1,y])
        if y < width - 1 and frame[x][y+1] < 128 :
            frame[x][y+1] = 255
            stack.append([x,y+1])
    
    return frame


def dilate(frame):
    #return frame
    dilation = cv2.dilate(frame, kernel)
    #erosion = cv2.erode(dilation, kernel)

    #return dilate_jit(frame,erosion)
    return dilate_flood_fill(frame,dilation)

def frame2file(frame_list):
    for i,frame in enumerate(frame_list):
        cv2.imencode(".bmp", frame)[1].tofile('./tmp/' + str(i).zfill(3) + ".bmp")

binary_threshold = 246
expand_threshold = 220

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
    _, binary = cv2.threshold(_image, 128, 255, cv2.THRESH_BINARY)
    return cv2.countNonZero(binary) + 1

@jit(nopython=True)
def expand(binary,gray):
    flood_fill_map = binary.copy()
    
    stack = []

    for i,line in enumerate(binary):
        for j,ele in enumerate(line):
            if ele == 0:
                stack.append([i,j])

    height = binary.shape[0] - 1
    width = binary.shape[1] - 1

    while len(stack) > 0:
        point = stack.pop()
        x = point[0]
        y = point[1]
        point_value = gray[x][y]
        if x > 0:
            if flood_fill_map[x-1][y] == 255:
                flood_fill_map[x-1][y] = 0
                new_point_value = gray[x - 1][y]
                if new_point_value > expand_threshold:
                    binary[x-1][y] = 255 - new_point_value
                    stack.append([x-1,y])
        if x < height:
            if flood_fill_map[x+1][y] == 255:
                flood_fill_map[x+1][y] = 0
                new_point_value = gray[x+1][y]
                if new_point_value > expand_threshold:
                    binary[x+1][y] = 255 - new_point_value
                    stack.append([x+1,y])
        if y > 0:
            if flood_fill_map[x][y-1] == 255:
                flood_fill_map[x][y-1] = 0
                new_point_value = gray[x][y-1]
                if new_point_value > expand_threshold:
                    binary[x][y-1] = 255 - new_point_value
                    stack.append([x,y-1])
        if y < width:
            if flood_fill_map[x][y+1] == 255:
                flood_fill_map[x][y+1] = 0
                new_point_value = gray[x][y+1]
                if new_point_value > expand_threshold:
                    binary[x][y+1] = 255 - new_point_value
                    stack.append([x,y+1])
    return binary


def threshold(gray):
    _, binary = cv2.threshold(gray, binary_threshold, 255, cv2.THRESH_BINARY_INV)  # 反转二值化
    #binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, 5 ,3 )  # 反转二值化
    #th,binary = cv2.threshold(gray,0,255,cv2.THRESH_BINARY_INV+cv2.THRESH_OTSU)

    #return binary

    binary = expand(binary,gray)

    return binary

del_list = os.listdir('./tmp')
for f in del_list:
    os.remove(os.path.join('./tmp', f))

video_path = 'test.mp4'

cap = cv2.VideoCapture(video_path)
fps = float(cap.get(cv2.CAP_PROP_FPS))

frame_pos = ( 60+54 ) * fps

cap.set(cv2.CAP_PROP_POS_FRAMES,math.floor(frame_pos))

_,frame = cap.read()

y = [310, 335]
x = [97,525]

cropped = frame[ y[0]:y[1], x[0]:x[1] ]

gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)  # 灰度化
binary = threshold(gray)

height, width = binary.shape
area = height * width

cropped_list = [binary]

last_binary_1 = binary
last_binary_2 = binary

for i in range(0,100):
    _,frame = cap.read()
    cropped = frame[ y[0]:y[1], x[0]:x[1] ]

    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)  # 灰度化
    binary = threshold(gray)

    binary = dilate(binary)

    diff_1 = __similar_to_previous(last_binary_2, last_binary_1)
    diff_2 = __similar_to_previous(last_binary_1, binary)

    if diff_1 / area > 0.01 and diff_2 / area < 0.01:
        cropped_list.append(binary)

    last_binary_2 = last_binary_1
    last_binary_1 = binary

frame2file(cropped_list)

for subtitle in cropped_list:
    content = ocr.ocr_for_single_line(subtitle)
    content = ''.join(content)
    print(content)
