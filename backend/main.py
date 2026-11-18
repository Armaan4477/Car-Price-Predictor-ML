from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import os
import json

app = FastAPI(title="Used Car Price Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model at startup
MODEL_PATH = "random_forest_final.joblib"
PREDICTIONS_CSV = "../random_forest_final_predictions.csv"
try:
    model_package = joblib.load(MODEL_PATH)
    preprocessor = model_package["preprocessor"]
    model = model_package["model"]
    features = model_package["features"]
    MODEL_LOADED = True
except Exception as e:
    print(f"Error loading model: {e}")
    MODEL_LOADED = False

# Try to load predictions CSV for dashboards and filters
try:
    df_preds = pd.read_csv(PREDICTIONS_CSV)
    
    # Build filter hierarchy: Brand -> Model -> Variant
    filters_data = {}
    
    # Extract brand from Car_Model (usually first word)
    df_preds["Brand"] = df_preds["Car_Model"].apply(lambda x: x.split(" ")[0] if isinstance(x, str) else "")
    
    for brand in df_preds["Brand"].unique():
        brand_df = df_preds[df_preds["Brand"] == brand]
        models = {}
        for car_model in brand_df["Car_Model"].unique():
            model_df = brand_df[brand_df["Car_Model"] == car_model]
            variants = model_df["Car_Variant"].unique().tolist()
            models[car_model] = variants
        filters_data[brand] = models

    # Dashboard data calculations
    avg_price_by_brand = df_preds.groupby("Brand")["Actual_Price_Lakhs"].mean().reset_index().rename(columns={"Actual_Price_Lakhs": "AveragePrice"}).to_dict(orient="records")
    fuel_type_dist = df_preds["Fuel_Type"].value_counts().reset_index().rename(columns={"count": "Count"}).to_dict(orient="records")
    # limit scatter to 100 points for performance
    scatter_data = df_preds[["KM_Driven", "Actual_Price_Lakhs"]].sample(n=min(100, len(df_preds))).rename(columns={"Actual_Price_Lakhs": "Price"}).to_dict(orient="records")
    
    DASHBOARD_DATA = {
        "avg_price_by_brand": avg_price_by_brand,
        "fuel_type_dist": fuel_type_dist,
        "scatter_data": scatter_data
    }
except Exception as e:
    print(f"Error loading predictions data: {e}")
    filters_data = {}
    DASHBOARD_DATA = {}

class CarFeatures(BaseModel):
    Year: int
    Car_Model: str
    Car_Variant: str
    KM_Driven: int
    Fuel_Type: str
    Transmission_Type: str
    Owner_Count: int
    City: str

@app.get("/")
def read_root():
    return {"message": "Used Car Price Predictor API is running"}

@app.get("/health")
def read_health():
    return {
        "status": "healthy" if MODEL_LOADED else "unhealthy",
        "model_loaded": MODEL_LOADED
    }

@app.get("/filters")
def get_filters():
    return filters_data

@app.get("/dashboard-data")
def get_dashboard_data():
    return DASHBOARD_DATA

@app.post("/predict")
def predict_price(car: CarFeatures):
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model is not loaded")
    
    if car.KM_Driven < 0:
        raise HTTPException(status_code=400, detail="KM_Driven must be >= 0")
        
    if car.Owner_Count < 0:
        raise HTTPException(status_code=400, detail="Owner_Count must be >= 0")
        
    input_df = pd.DataFrame([car.model_dump()])
    
    try:
        processed = preprocessor.transform(input_df)
        prediction = model.predict(processed)[0]
        
        predicted_price_lakhs = round(float(prediction), 2)
        predicted_price_inr = int(predicted_price_lakhs * 100000)
        
        return {
            "predicted_price_lakhs": predicted_price_lakhs,
            "predicted_price_inr": predicted_price_inr,
            "currency": "INR"
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Error during prediction")

@app.post("/predict-depreciation")
def predict_depreciation(car: CarFeatures):
    if not MODEL_LOADED:
        raise HTTPException(status_code=503, detail="Model is not loaded")
        
    try:
        years = []
        df_list = []
        base_year = car.Year
        base_km = car.KM_Driven
        
        # Predict for the next 5 years
        for i in range(6):
            future_car = car.model_copy()
            # The model was trained on historical data. A "future" car means it will be older.
            # But the model uses 'Year' as manufacturing year. So manufacturing year stays the SAME.
            # Wait, the feature is `Year` (manufacturing year). As time passes, the car gets older. 
            # Does the model have a `Current_Year` feature? No, it just has `Year`.
            # A Random Forest doesn't know what the "current" year is. It just mapped e.g. 2015 to a price.
            # Wait, if we want to simulate it being 5 years older, we have to subtract 5 from its manufacturing year
            # Because a 5-year old car in 2024 (made in 2019) is priced like a 2014 car was priced in 2024.
            # Alternatively, we just decrease the `Year` feature by 1 each iteration.
            
            future_car.Year = base_year - i 
            future_car.KM_Driven = base_km + (i * 10000) # Assume 10k km per year
            df_list.append(future_car.model_dump())
            years.append(f"Year {i}")
            
        input_df = pd.DataFrame(df_list)
        processed = preprocessor.transform(input_df)
        predictions = model.predict(processed)
        
        results = []
        for i, pred in enumerate(predictions):
            results.append({
                "year_offset": i,
                "simulated_mfg_year": base_year - i,
                "simulated_km": base_km + (i * 10000),
                "predicted_price_lakhs": round(float(pred), 2)
            })
            
        return {"depreciation_curve": results}
    except Exception as e:
        print(f"Depreciation prediction error: {e}")
        raise HTTPException(status_code=500, detail="Error during depreciation prediction")
