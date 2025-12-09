# ============================================================================
# DataViz AI - R Backend API
# ============================================================================
# Plumber API router for data visualization backend
# Provides endpoints for data upload, analysis, chart recommendations,
# and Gemini AI insights
# ============================================================================

library(plumber)
library(jsonlite)
library(logger)

# Source helper functions
source("R/data_processor.R")
source("R/chart_recommender.R")
source("R/gemini_client.R")
source("R/utils.R")

# Configure logging
log_threshold(INFO)
log_appender(appender_file("logs/api.log"))

#* @apiTitle DataViz AI Backend
#* @apiDescription R backend for intelligent data visualization
#* @apiVersion 1.0.0

# ============================================================================
# CORS Configuration (MUST BE FIRST)
# ============================================================================

#* @filter cors
function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  
  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200
    return(list())
  } else {
    plumber::forward()
  }
}

# ============================================================================
# Health Check
# ============================================================================


#* @get /health
function() {
  list(
    status = "ok", 
    time = Sys.time(),
    r_version = R.version.string,
    packages = list(
      ggplot2 = packageVersion("ggplot2")
    )
  )
}

# ============================================================================
# Data Upload & Analysis
# ============================================================================

#* Upload and analyze data file (CSV or Excel)
#* @post /upload-data
#* @param file:file Data file (CSV or Excel)
#* @serializer json
function(req, file) {
  log_info("Received file upload request")
  
  tryCatch({
    # Validate file
    if (is.null(file) || length(file) == 0) {
      log_error("No file provided")
      return(list(
        error = TRUE,
        message = "No file provided"
      ))
    }
    
    # Get file info
    filename <- file[[1]]$name
    filepath <- file[[1]]$datapath
    
    log_info(paste("Processing file:", filename))
    
    # Read and analyze data
    result <- process_uploaded_file(filepath, filename)
    
    if (result$error) {
      log_error(paste("Error processing file:", result$message))
      return(result)
    }
    
    log_info("File processed successfully")
    return(result)
    
  }, error = function(e) {
    log_error(paste("Unexpected error:", e$message))
    return(list(
      error = TRUE,
      message = paste("Server error:", e$message)
    ))
  })
}

# ============================================================================
# Chart Recommendations
# ============================================================================

#* Get chart recommendations based on data structure
#* @post /suggest-plots
#* @param data:object Data analysis object from /upload-data
#* @serializer json
function(req, data = NULL) {
  log_info("Received chart recommendation request")
  
  tryCatch({
    # Parse request body if data is not provided
    if (is.null(data)) {
      body <- req$postBody
      if (is.null(body) || body == "") {
        return(list(
          error = TRUE,
          message = "No data provided"
        ))
      }
      data <- fromJSON(body)
    }
    
    # Validate data structure
    if (is.null(data$columns) || length(data$columns) == 0) {
      return(list(
        error = TRUE,
        message = "Invalid data structure: columns required"
      ))
    }
    
    log_info(paste("Analyzing", length(data$columns), "columns"))
    
    # Generate recommendations
    recommendations <- recommend_charts(data)
    
    log_info(paste("Generated", length(recommendations$recommended), "recommendations"))
    
    return(recommendations)
    
  }, error = function(e) {
    log_error(paste("Error generating recommendations:", e$message))
    return(list(
      error = TRUE,
      message = paste("Error:", e$message)
    ))
  })
}

# ============================================================================
# Gemini AI Insights
# ============================================================================

#* Get AI-powered insights using Google Gemini
#* @post /gemini-insight
#* @param data:object Data summary and optional user selections
#* @serializer json
function(req, data = NULL) {
  log_info("Received Gemini insight request")
  
  tryCatch({
    # Parse request body if data is not provided
    if (is.null(data)) {
      body <- req$postBody
      if (is.null(body) || body == "") {
        return(list(
          error = TRUE,
          message = "No data provided"
        ))
      }
      data <- fromJSON(body)
    }
    
    # Check API key
    api_key <- Sys.getenv("GEMINI_API_KEY")
    if (api_key == "") {
      log_error("GEMINI_API_KEY not set")
      return(list(
        error = TRUE,
        message = "Gemini API key not configured"
      ))
    }
    
    log_info("Calling Gemini API for insights")
    
    # Get insights from Gemini
    insights <- get_gemini_insights(data, api_key)
    
    if (insights$error) {
      log_error(paste("Gemini API error:", insights$message))
      return(insights)
    }
    
    log_info("Gemini insights generated successfully")
    
    return(insights)
    
  }, error = function(e) {
    log_error(paste("Error getting Gemini insights:", e$message))
    return(list(
      error = TRUE,
      message = paste("Error:", e$message)
    ))
  })
}
