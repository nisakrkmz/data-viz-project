# ============================================================================
# Server Startup Script
# ============================================================================
# Starts the Plumber API server
# ============================================================================

# Load environment variables
if (file.exists(".env")) {
  readRenviron(".env")
}

# Load required packages
required_packages <- c(
  "plumber",
  "jsonlite",
  "logger",
  "readr",
  "readxl",
  "data.table",
  "dplyr",
  "httr",
  "uuid",
  "ggplot2",
  "gridExtra",
  "scales"
)

# Install missing packages
missing_packages <- required_packages[!(required_packages %in% installed.packages()[,"Package"])]
if (length(missing_packages) > 0) {
  cat("Installing missing packages:", paste(missing_packages, collapse = ", "), "\n")
  install.packages(missing_packages, repos = "https://cloud.r-project.org/")
}

# Load packages
invisible(lapply(required_packages, library, character.only = TRUE))

# Configuration
port <- as.integer(Sys.getenv("API_PORT", "8000"))
host <- Sys.getenv("API_HOST", "0.0.0.0")

# Create necessary directories
dir.create("uploads", showWarnings = FALSE)
dir.create("logs", showWarnings = FALSE)

# Set working directory to the script's location
args <- commandArgs(trailingOnly = FALSE)
file.arg.name <- "--file="
script.name <- sub(file.arg.name, "", grep(file.arg.name, args, value = TRUE))
if (length(script.name) > 0) {
  script.dir <- dirname(script.name)
  setwd(script.dir)
  cat(sprintf("Set working directory to: %s\n", script.dir))
} else {
  # Fallback if running interactively or without --file
  # Check if plumber.R is in current dir, if not, try backend/
  if (!file.exists("plumber.R") && file.exists("backend/plumber.R")) {
      setwd("backend")
  }
}

# Load API
cat("Loading Plumber API...\n")
if (!file.exists("plumber.R")) {
    stop("Could not find plumber.R in ", getwd())
}
pr <- plumb("plumber.R")

# Start server
cat(sprintf("Starting server on %s:%d\n", host, port))
cat("API Documentation available at: http://localhost:", port, "/__docs__/\n", sep = "")
cat("\nEndpoints:\n")
cat("  POST /upload-data      - Upload and analyze data file\n")
cat("  POST /suggest-plots    - Get chart recommendations\n")
cat("  POST /gemini-insight   - Get AI insights\n")
cat("  GET  /health           - Health check\n")
cat("\nPress Ctrl+C to stop the server\n\n")

# Run server
pr$run(
  host = host,
  port = 8001,
  docs = TRUE
)
```
