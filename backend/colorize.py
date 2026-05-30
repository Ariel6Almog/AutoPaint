import tensorflow as tf
from tensorflow.keras import layers
from tensorflow.keras.models import load_model
import os

def load_colorization_model(checkpoint_path="models/cgan/cgan.h5"):
    try:
        if os.path.exists(checkpoint_path):
            print(f"Loading CGAN model from {checkpoint_path}...")
            
            model = load_model(checkpoint_path)
            
            print("CGAN model loaded successfully!")
            return model
        else:
            print(f"Model file not found at: {checkpoint_path}")
            return None
            
    except Exception as e:
        print(f"Error loading model from {checkpoint_path}: {e}")
        return None