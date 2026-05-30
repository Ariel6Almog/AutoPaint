from tensorflow.keras.models import load_model
import os

def load_segmentation_model(model_path="models/seg/unet_full_model_v1.h5"):
    try:
        if os.path.exists(model_path):
            model = load_model(model_path)
            print(" Segmentation model loaded successfully!")
            return model
        else:
            print(f"Warning: Segmentation model not found at {model_path}")
            return None
    except Exception as e:
        print(f"Error loading Segmentation model: {e}")
        return None