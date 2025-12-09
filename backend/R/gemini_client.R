# ============================================================================
# Gemini API Client Module
# ============================================================================
# Handles communication with Google Gemini API
# Generates AI-powered insights about data and visualizations
# ============================================================================

library(httr2)
library(jsonlite)

#' Get insights from Google Gemini API
#' 
#' @param data_summary Data analysis summary
#' @param api_key Gemini API key
#' @return List with insights or error
get_gemini_insights <- function(data_summary, api_key) {
  # Build prompt
  prompt <- build_gemini_prompt(data_summary)
  
  # Call Gemini API
  tryCatch({
    response <- call_gemini_api(prompt, api_key)
    
    if (response$error) {
      return(response)
    }
    
    # Parse response
    insights <- parse_gemini_response(response$text)
    
    return(list(
      error = FALSE,
      analysis_text = insights$analysis,
      suggested_chart_types = insights$chart_types,
      confidence = insights$confidence,
      raw_response = response$text
    ))
    
  }, error = function(e) {
    return(list(
      error = TRUE,
      message = paste("Gemini API error:", e$message)
    ))
  })
}

#' Build prompt for Gemini
#' 
#' @param data_summary Data analysis object
#' @return Character string with prompt
build_gemini_prompt <- function(data_summary) {
  # Extract column information
  columns_info <- sapply(data_summary$columns, function(col) {
    type_info <- paste0(col$name, " (", col$type, ")")
    
    if (!is.null(col$summary)) {
      if (col$type == "numeric") {
        stats <- sprintf(
          "min=%.2f, max=%.2f, mean=%.2f",
          col$summary$min, col$summary$max, col$summary$mean
        )
        type_info <- paste0(type_info, " - ", stats)
      }
    }
    
    type_info
  })
  
  columns_text <- paste(columns_info, collapse = "\n  - ")
  
  # Build comprehensive prompt
  prompt <- sprintf(
    "Analyze this dataset and provide insights in Turkish:

Dataset Overview:
- Total Rows: %d
- Total Columns: %d
- Has Time Series: %s
- Has Geographic Data: %s

Columns:
  - %s

Please provide:
1. A brief, natural language description of what this dataset contains
2. Key patterns or interesting observations
3. Recommended chart types for visualizing this data (choose from: bar, line, scatter, pie, area, histogram, boxplot, heatmap, violin, grouped_bar)
4. Reasoning for each chart recommendation

Format your response as JSON:
{
  \"analysis\": \"Natural language description and insights in Turkish\",
  \"chart_types\": [\"chart1\", \"chart2\", \"chart3\"],
  \"reasoning\": \"Why these charts are suitable\",
  \"confidence\": 0.85
}",
    data_summary$n_rows,
    data_summary$n_cols,
    ifelse(data_summary$has_time_series, "Yes", "No"),
    ifelse(data_summary$has_geographic, "Yes", "No"),
    columns_text
  )
  
  return(prompt)
}

#' Call Gemini API
#' 
#' @param prompt Text prompt
#' @param api_key API key
#' @return List with response or error
call_gemini_api <- function(prompt, api_key) {
  api_url <- "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
  
  # Build request body
  request_body <- list(
    contents = list(
      list(
        parts = list(
          list(text = prompt)
        )
      )
    ),
    generationConfig = list(
      temperature = 0.7,
      maxOutputTokens = 1000,
      topP = 0.95
    )
  )
  
  # Make request
  response <- tryCatch({
    request(api_url) %>%
      req_url_query(key = api_key) %>%
      req_headers(
        `Content-Type` = "application/json"
      ) %>%
      req_body_json(request_body) %>%
      req_timeout(30) %>%
      req_perform()
  }, error = function(e) {
    return(list(
      error = TRUE,
      message = paste("HTTP request failed:", e$message)
    ))
  })
  
  # Check if error
  if (is.list(response) && !is.null(response$error)) {
    return(response)
  }
  
  # Parse response
  tryCatch({
    response_data <- resp_body_json(response)
    
    # Extract text from response
    if (!is.null(response_data$candidates) && 
        length(response_data$candidates) > 0) {
      text <- response_data$candidates[[1]]$content$parts[[1]]$text
      
      return(list(
        error = FALSE,
        text = text
      ))
    } else {
      return(list(
        error = TRUE,
        message = "No response from Gemini"
      ))
    }
  }, error = function(e) {
    return(list(
      error = TRUE,
      message = paste("Failed to parse response:", e$message)
    ))
  })
}

#' Parse Gemini response
#' 
#' @param response_text Text response from Gemini
#' @return List with parsed insights
parse_gemini_response <- function(response_text) {
  # Try to extract JSON from response
  json_match <- regexpr("\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\}", response_text, perl = TRUE)
  
  if (json_match > 0) {
    json_text <- regmatches(response_text, json_match)
    
    tryCatch({
      parsed <- fromJSON(json_text)
      
      return(list(
        analysis = parsed$analysis %||% response_text,
        chart_types = parsed$chart_types %||% list(),
        reasoning = parsed$reasoning %||% "",
        confidence = parsed$confidence %||% 0.7
      ))
    }, error = function(e) {
      # Fallback: use raw text
      return(list(
        analysis = response_text,
        chart_types = list(),
        reasoning = "",
        confidence = 0.5
      ))
    })
  } else {
    # No JSON found, return raw text
    return(list(
      analysis = response_text,
      chart_types = list(),
      reasoning = "",
      confidence = 0.5
    ))
  }
}

#' Null coalescing operator
#' @keywords internal
`%||%` <- function(x, y) {
  if (is.null(x) || length(x) == 0) y else x
}
