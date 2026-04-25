import pytesseract
from PIL import Image
import cv2
import numpy as np

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_text(file):
    img = Image.open(file)

    # Convert to RGB first (important)
    img = img.convert("RGB")

    img_np = np.array(img)

    # Convert to grayscale
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

    # Resize bigger for better OCR
    gray = cv2.resize(gray, None, fx=2, fy=2)

    # Threshold = sharper text
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

    text = pytesseract.image_to_string(thresh)

    return text.strip()