from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from main import get_profile_stats, compare_quarters, generate_strategy, list_profiles, get_customer_id
import os

app = FastAPI(title="Social Media Analytics API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StatsRequest(BaseModel):
    profile_id: str
    start_date: str
    end_date: str

class CompareRequest(BaseModel):
    stats_q1: dict
    stats_q2: dict

class StrategyRequest(BaseModel):
    report_data: dict

@app.get("/")
def read_root():
    return {"message": "Social Media Analytics API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/profiles")
def get_profiles():
    """Get list of available profiles"""
    try:
        return list_profiles()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/customer")
def get_customer():
    """Get customer ID"""
    try:
        customer_id = get_customer_id()
        return {"customer_id": customer_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/profile_stats")
def profile_stats(req: StatsRequest):
    try:
        return get_profile_stats(req.profile_id, req.start_date, req.end_date)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/compare_quarters")
def compare_quarters_endpoint(req: CompareRequest):
    try:
        return compare_quarters(req.stats_q1, req.stats_q2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/generate_strategy")
def generate_strategy_endpoint(req: StrategyRequest):
    try:
        strategy_json_string = generate_strategy(req.report_data)
        # Parse the JSON string returned by generate_strategy and return the object
        import json
        return json.loads(strategy_json_string)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/stats")
def stats_endpoint(req: StatsRequest):
    """
    New endpoint that matches frontend expectations.
    This is a wrapper around the existing profile_stats function.
    """
    try:
        # Call the existing profile_stats function
        raw_data = get_profile_stats(req.profile_id, req.start_date, req.end_date)

        # Transform the data to match frontend expectations
        # The frontend expects a response that can be used directly
        return raw_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/strategy")
def strategy_endpoint(req: StrategyRequest):
    """
    New endpoint that matches frontend expectations.
    This is a wrapper around the existing generate_strategy function.
    """
    try:
        strategy_json_string = generate_strategy(req.report_data)
        # Parse the JSON string returned by generate_strategy and return the object
        import json
        return json.loads(strategy_json_string)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port, reload=False)