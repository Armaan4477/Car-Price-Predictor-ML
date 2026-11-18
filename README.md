# Used Car Price Predictor

## Overview
This project is an end-to-end Machine Learning web application designed to predict the resale price of a used car in the Indian market. It uses a trained Random Forest Regressor and provides a responsive UI to interact with the model.

## Machine Learning
**Algorithm:** Random Forest Regressor

## Dataset
Cars24 Indian used-car dataset.

## Features
The model uses the following 8 input features:
1. `Year` (Numeric)
2. `KM_Driven` (Numeric)
3. `Owner_Count` (Numeric)
4. `Car_Model` (Categorical)
5. `Car_Variant` (Categorical)
6. `Fuel_Type` (Categorical)
7. `Transmission_Type` (Categorical)
8. `City` (Categorical)

## Model Performance
- **MAE:** 1.1909 lakh (The average absolute error in prediction is approximately ₹1.19 lakh).
- **RMSE:** 2.1897 lakh (Standard deviation of the residuals/prediction errors).
- **R²:** 0.8160 (The model explains ~81.6% of the variance in the target variable).

## Tech Stack
- **Frontend:** Next.js (React), Tailwind CSS
- **Backend:** FastAPI (Python), Uvicorn, Pydantic
- **ML:** Python, scikit-learn (v1.6.1), Pandas, NumPy
- **Model persistence:** joblib

## Project Structure
```
.
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── random_forest_final.joblib
├── frontend/
│   ├── src/app/page.tsx
│   ├── .env.local
│   ├── package.json
│   └── tailwind.config.ts
└── README.md
```

## Running the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   
   # Windows:
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
The backend API will run on `http://127.0.0.1:8000`.

## Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
The frontend application will be available at `http://localhost:3000`.

## API Documentation

### `GET /`
Returns a simple API status response.
```json
{
  "message": "Used Car Price Predictor API is running"
}
```

### `GET /health`
Returns the health status of the API and checks if the model is loaded.
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### `POST /predict`
Predicts the price based on car features.

**Example Request:**
```json
{
  "Year": 2019,
  "Car_Model": "Honda City",
  "Car_Variant": "VX",
  "KM_Driven": 45000,
  "Fuel_Type": "Petrol",
  "Transmission_Type": "Manual",
  "Owner_Count": 1,
  "City": "Mumbai"
}
```

**Example Response:**
```json
{
  "predicted_price_lakhs": 6.64,
  "predicted_price_inr": 664000,
  "currency": "INR"
}
```
