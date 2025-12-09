# ============================================================================
# Utility Functions
# ============================================================================
# Helper functions for the API
# ============================================================================

#' Safe file path generation
#' 
#' @param filename Original filename
#' @param upload_dir Upload directory
#' @return Safe file path
safe_filepath <- function(filename, upload_dir = "uploads") {
  # Create upload directory if it doesn't exist
  if (!dir.exists(upload_dir)) {
    dir.create(upload_dir, recursive = TRUE)
  }
  
  # Generate unique filename
  timestamp <- format(Sys.time(), "%Y%m%d_%H%M%S")
  random_id <- paste0(sample(c(letters, 0:9), 8, replace = TRUE), collapse = "")
  ext <- tools::file_ext(filename)
  
  safe_name <- paste0(timestamp, "_", random_id, ".", ext)
  file.path(upload_dir, safe_name)
}

#' Validate data structure
#' 
#' @param data Data object to validate
#' @return List with validation result
validate_data_structure <- function(data) {
  if (is.null(data)) {
    return(list(
      valid = FALSE,
      message = "Data is NULL"
    ))
  }
  
  if (!is.list(data)) {
    return(list(
      valid = FALSE,
      message = "Data must be a list"
    ))
  }
  
  if (is.null(data$columns) || length(data$columns) == 0) {
    return(list(
      valid = FALSE,
      message = "Data must contain 'columns' field"
    ))
  }
  
  return(list(
    valid = TRUE,
    message = "Valid"
  ))
}

#' Format error response
#' 
#' @param message Error message
#' @param code Error code
#' @return List with error details
error_response <- function(message, code = "ERROR") {
  list(
    error = TRUE,
    code = code,
    message = message,
    timestamp = Sys.time()
  )
}

#' Format success response
#' 
#' @param data Response data
#' @param message Success message
#' @return List with success details
success_response <- function(data, message = "Success") {
  list(
    error = FALSE,
    message = message,
    data = data,
    timestamp = Sys.time()
  )
}

#' Clean temporary files
#' 
#' @param max_age_hours Maximum age in hours
#' @param upload_dir Upload directory
clean_temp_files <- function(max_age_hours = 24, upload_dir = "uploads") {
  if (!dir.exists(upload_dir)) {
    return(0)
  }
  
  files <- list.files(upload_dir, full.names = TRUE)
  current_time <- Sys.time()
  removed_count <- 0
  
  for (file in files) {
    file_age <- difftime(current_time, file.info(file)$mtime, units = "hours")
    
    if (file_age > max_age_hours) {
      file.remove(file)
      removed_count <- removed_count + 1
    }
  }
  
  return(removed_count)
}

#' Log request details
#' 
#' @param req Request object
#' @param endpoint Endpoint name
log_request <- function(req, endpoint) {
  log_info(sprintf(
    "Request to %s from %s",
    endpoint,
    req$REMOTE_ADDR %||% "unknown"
  ))
}

#' Null coalescing operator
#' @keywords internal
`%||%` <- function(x, y) {
  if (is.null(x)) y else x
}
