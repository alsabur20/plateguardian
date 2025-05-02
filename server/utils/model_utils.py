import cv2
from skimage.feature import hog
import joblib

# Load the trained model once
clf = joblib.load("models/hog_lreg_model_3.pkl")


def extract_license_plate_text(image_path):
    im = cv2.imread(image_path)
    im_gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    ret, im_th = cv2.threshold(im_gray, 120, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    ctrs, _ = cv2.findContours(im_th, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    bboxes = [cv2.boundingRect(c) for c in ctrs]
    sorted_bboxes = sorted(bboxes, key=lambda b: b[0])

    plate_char = []
    for [x, y, w, h] in sorted_bboxes:
        if h > 100 and w < 100:
            roi = im_gray[y: y + h, x: x + w]
            roi = cv2.resize(roi, (64, 128), interpolation=cv2.INTER_AREA)
            roi_hog_fd = hog(
                roi, orientations=9, pixels_per_cell=(8, 8), cells_per_block=(1, 1)
            )
            prediction = clf.predict([roi_hog_fd])
            plate_char.append(str(prediction[0]))

    return "".join(plate_char)
