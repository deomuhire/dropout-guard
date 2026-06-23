import joblib
import numpy as np
import os


# Ensure stable dtype/shape and deterministic dummy alignment.





# Load model once when server starts
# Loads the latest recreated model (kept in the same folder)
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'student_model21.pkl')



try:
    model = joblib.load(MODEL_PATH)
    print(f"ML model loaded successfully: {MODEL_PATH}")
    print(f"Model class: {model.__class__.__name__}")
except FileNotFoundError:
    # Try fallback to model.pkl
    MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')
    try:
        model = joblib.load(MODEL_PATH)
        print(f"ML model loaded successfully: {MODEL_PATH}")
    except FileNotFoundError:
        model = None
        print("WARNING: model file not found in app/ml/")


def encode_input(data: dict) -> np.ndarray:
    """Encode teacher-provided attendance fields into the exact feature vector
    expected by the trained dropout model.

    Training pipeline mirrored here:
    - Drop: Student_ID (identifier) and Dropped_out (target) before training.
    - One-hot encode categoricals using pd.get_dummies() with bins:
        * Child_Gender -> Child_Gender_Male, Child_Gender_Female
        * Social_activity -> Social_activity_None, Social_activity_Sport, Social_activity_Dance, Social_activity_Other
        * Performance -> Performance_0-40, Performance_41-50, Performance_51-60, Performance_61-70, Performance_71-100
    - Missing values for Social_activity filled with 'None' (meaning no social activity).
    - Binary columns passed through as 0/1.
    - Feature alignment to model.feature_names_in_ (missing dummy columns => 0).
    """


    if model is None:
        raise RuntimeError("ML model not loaded")

    # Normalize/parse inputs (matching backend form keys)
    child_gender = data.get('gender', 'Male')
    performance = data.get('performance', '51-60')
    # Social_activity in training was filled with 'None' for missing values
    social_activity = data.get('social_activity', 'None')
    if social_activity is None:
        social_activity = 'None'
    social_activity = str(social_activity).strip()
    if not social_activity or social_activity.lower() == 'nan':
        social_activity = 'None'

    # One-hot encoding (mirrors pd.get_dummies categories used in training)
    gender_onehot = {
        'Child_Gender_Male': 1.0 if str(child_gender).strip() == 'Male' else 0.0,
        'Child_Gender_Female': 1.0 if str(child_gender).strip() == 'Female' else 0.0,
    }

    social_onehot = {
        'Social_activity_None': 1.0 if social_activity == 'None' else 0.0,
        'Social_activity_Sport': 1.0 if social_activity == 'Sport' else 0.0,
        'Social_activity_Dance': 1.0 if social_activity == 'Dance' else 0.0,
        'Social_activity_Other': 1.0 if social_activity == 'Other' else 0.0,
    }

    performance_onehot = {
        'Performance_0-40': 1.0 if performance == '0-40' else 0.0,
        'Performance_41-50': 1.0 if performance == '41-50' else 0.0,
        'Performance_51-60': 1.0 if performance == '51-60' else 0.0,
        'Performance_61-70': 1.0 if performance == '61-70' else 0.0,
        'Performance_71-100': 1.0 if performance == '71-100' else 0.0,
    }



    def b(x):

        try:
            return int(x)
        except Exception:
            return 0

    # Binary features (already 0/1 in training)
    binary = {
        'lack_of_motivation': b(data.get('lack_of_motivation', 0)),
        'lack_of_school_material': b(data.get('lack_of_school_material', 0)),
        'lack_of_school_fees': b(data.get('lack_of_school_fees', 0)),
        'family_conflicts': b(data.get('family_conflicts', 0)),
        'drug_abuse': b(data.get('drug_abuse', 0)),
        'illness': b(data.get('illness', 0)),
        'absenteeism': b(data.get('absenteeism', 0)),
        'bad_discipline': b(data.get('bad_discipline', 0)),
    }

    feature_order = getattr(model, 'feature_names_in_', None)

    if feature_order is None:
        raise RuntimeError("Model does not expose feature_names_in_ for alignment")

    # Construct a mapping from the exact dummy feature names to their 0/1 values.
    input_features_by_name = {}

    input_features_by_name.update(gender_onehot)
    input_features_by_name.update(social_onehot)
    input_features_by_name.update(performance_onehot)

    # Binary fields: names in training are the original column names
    input_features_by_name.update({
        'Lack_of_motivation': float(binary['lack_of_motivation']),
        'Lack_of_School_Material': float(binary['lack_of_school_material']),
        'Lack_of_School_Fees': float(binary['lack_of_school_fees']),
        'Family _conflicts': float(binary['family_conflicts']),
        'Drug_abuse': float(binary['drug_abuse']),
        'Illness': float(binary['illness']),
        'Absenteism': float(binary['absenteeism']),
        'Bad_Discipline': float(binary['bad_discipline']),
    })


    vec = []
    for feat in feature_order:
        feat_str = str(feat)
        vec.append(float(input_features_by_name.get(feat_str, 0.0)))

    return np.array(vec, dtype=float).reshape(1, -1)






def predict(data: dict) -> dict:
    """
    Run prediction on student data.
    Returns dict with:
    - label (0/1) using threshold 0.60 on proba[:,1]
    - dropout_probability_percent (float)
    - safe_probability_percent (float)
    """

    if model is None:
        return {
            'label': 0,
            'dropout_probability_percent': 0.0,
            'safe_probability_percent': 100.0,
            'error': 'Model not loaded'
        }


    features = encode_input(data)
    probabilities = model.predict_proba(features)[0]

    dropout_prob_percent = round(float(probabilities[1]) * 100, 1)
    safe_prob_percent = round(float(probabilities[0]) * 100, 1)

    # Non-default threshold: 0.60
    label = 1 if probabilities[1] >= 0.60 else 0

    return {
        'label': label,
        'dropout_probability_percent': dropout_prob_percent,
        'safe_probability_percent': safe_prob_percent,
    }

