# ============================================================================
# Data Processor Module
# ============================================================================
# Functions for reading, analyzing, and summarizing data files
# Supports CSV and Excel formats
# ============================================================================

library(readr)
library(readxl)
library(data.table)
library(dplyr)
library(lubridate)

#' Process uploaded file
#' 
#' Reads CSV or Excel file and returns structured analysis
#' 
#' @param filepath Path to uploaded file
#' @param filename Original filename
#' @return List with data analysis or error
process_uploaded_file <- function(filepath, filename) {
  # Determine file type
  ext <- tolower(tools::file_ext(filename))
  
  # Read file based on extension
  df <- tryCatch({
    if (ext == "csv") {
      read_csv(filepath, show_col_types = FALSE)
    } else if (ext %in% c("xlsx", "xls")) {
      read_excel(filepath)
    } else {
      return(list(
        error = TRUE,
        message = paste("Unsupported file format:", ext)
      ))
    }
  }, error = function(e) {
    return(list(
      error = TRUE,
      message = paste("Error reading file:", e$message)
    ))
  })
  
  # Check if read was successful
  if (is.list(df) && !is.null(df$error)) {
    return(df)
  }
  
  # Analyze data
  analysis <- analyze_dataframe(df)
  
  # Convert sample data to JSON-friendly format
  sample_rows <- head(df, 5)
  sample_data_list <- lapply(1:nrow(sample_rows), function(i) {
    row_list <- as.list(sample_rows[i, ])
    # Convert any factors to characters
    lapply(row_list, function(x) {
      if (is.factor(x)) as.character(x) else x
    })
  })
  
  return(list(
    error = FALSE,
    filename = filename,
    n_rows = nrow(df),
    n_cols = ncol(df),
    columns = analysis$columns,
    has_time_series = analysis$has_time_series,
    has_geographic = analysis$has_geographic,
    sample_data = sample_data_list
  ))
}

#' Analyze dataframe structure
#' 
#' Analyzes each column and detects data patterns
#' 
#' @param df Data frame to analyze
#' @return List with column analyses and metadata
analyze_dataframe <- function(df) {
  columns <- lapply(names(df), function(col_name) {
    analyze_column(df, col_name)
  })
  
  # Detect time series
  has_time_series <- any(sapply(columns, function(col) {
    col$type == "date" || 
    grepl("date|time|year|month|day", tolower(col$name))
  }))
  
  # Detect geographic data
  has_geographic <- any(sapply(columns, function(col) {
    grepl("country|city|region|location|lat|lon|latitude|longitude", 
          tolower(col$name))
  }))
  
  list(
    columns = columns,
    has_time_series = has_time_series,
    has_geographic = has_geographic
  )
}

#' Analyze single column
#' 
#' Determines column type and computes summary statistics
#' 
#' @param df Data frame
#' @param col_name Column name
#' @return List with column analysis
analyze_column <- function(df, col_name) {
  col_data <- df[[col_name]]
  
  # Basic info
  result <- list(
    name = col_name,
    unique_count = length(unique(col_data)),
    na_count = sum(is.na(col_data))
  )
  
  # Determine type and add type-specific analysis
  if (is.numeric(col_data)) {
    result$type <- "numeric"
    result$summary <- list(
      min = min(col_data, na.rm = TRUE),
      max = max(col_data, na.rm = TRUE),
      mean = mean(col_data, na.rm = TRUE),
      median = median(col_data, na.rm = TRUE),
      sd = sd(col_data, na.rm = TRUE)
    )
  } else if (is.logical(col_data)) {
    result$type <- "boolean"
    result$summary <- list(
      true_count = sum(col_data, na.rm = TRUE),
      false_count = sum(!col_data, na.rm = TRUE)
    )
  } else if (inherits(col_data, c("Date", "POSIXct", "POSIXt"))) {
    result$type <- "date"
    result$summary <- list(
      min_date = as.character(min(col_data, na.rm = TRUE)),
      max_date = as.character(max(col_data, na.rm = TRUE))
    )
  } else if (is.character(col_data) || is.factor(col_data)) {
    # Check if it's a date string
    if (is_date_string(col_data)) {
      result$type <- "date"
    } else {
      result$type <- "categorical"
      
      # Add value counts if not too many unique values
      if (result$unique_count <= 50) {
        value_counts <- table(col_data)
        result$value_counts <- as.list(value_counts)
      }
    }
  } else {
    result$type <- "unknown"
  }
  
  return(result)
}

#' Check if character vector contains date strings
#' 
#' @param x Character vector
#' @return Boolean
is_date_string <- function(x) {
  # Sample first non-NA values
  sample_vals <- head(x[!is.na(x)], 10)
  
  if (length(sample_vals) == 0) {
    return(FALSE)
  }
  
  # Try to parse as date
  parsed <- suppressWarnings(as.Date(sample_vals))
  
  # If more than 50% parse successfully, consider it a date column
  success_rate <- sum(!is.na(parsed)) / length(sample_vals)
  return(success_rate > 0.5)
}

#' Get summary statistics for dataframe
#' 
#' @param df Data frame
#' @return Character string with summary
get_data_summary <- function(df) {
  # Get basic summary
  summary_text <- capture.output(summary(df))
  
  # Get first few rows
  head_text <- capture.output(print(head(df, 3)))
  
  # Combine
  paste(
    "=== Data Summary ===",
    paste(summary_text, collapse = "\n"),
    "\n=== Sample Data ===",
    paste(head_text, collapse = "\n"),
    sep = "\n"
  )
}

#' Convert dataframe to JSON-friendly format
#' 
#' @param df Data frame
#' @param max_rows Maximum rows to include
#' @return List suitable for JSON conversion
df_to_json_list <- function(df, max_rows = 100) {
  # Limit rows
  if (nrow(df) > max_rows) {
    df <- head(df, max_rows)
  }
  
  # Convert to list of lists
  lapply(1:nrow(df), function(i) {
    as.list(df[i, ])
  })
}
