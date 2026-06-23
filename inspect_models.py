import joblib
import os

models = ['best_dropout_model.pkl', 'model.pkl', 'student_dropout_model.pkl']
base_path = 'backend/app/ml'

for model_name in models:
    path = os.path.join(base_path, model_name)
    if os.path.exists(path):
        print(f"\n--- Model: {model_name} ---")
        try:
            model = joblib.load(path)
            print(f"Type: {type(model).__name__}")
            if hasattr(model, 'feature_names_in_'):
                print("Feature Names In:")
                for i, name in enumerate(model.feature_names_in_):
                    print(f"  {i}: {name}")
            else:
                print("No feature_names_in_ attribute.")
            
            if hasattr(model, 'n_features_in_'):
                print(f"N Features In: {model.n_features_in_}")
                
        except Exception as e:
            print(f"Error loading {model_name}: {e}")
