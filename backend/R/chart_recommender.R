# ============================================================================
# Chart Recommender Module
# ============================================================================
# Implements data-to-viz decision tree logic
# Recommends appropriate chart types based on data structure
# Provides ggplot2 code templates
# ============================================================================

library(dplyr)

#' Recommend charts based on data analysis
#' 
#' Implements data-to-viz.com decision tree logic
#' 
#' @param data_analysis Analysis object from data_processor
#' @return List with chart recommendations
recommend_charts <- function(data_analysis) {
  columns <- data_analysis$columns
  
  # Count column types
  numeric_cols <- Filter(function(col) col$type == "numeric", columns)
  categorical_cols <- Filter(function(col) col$type == "categorical", columns)
  date_cols <- Filter(function(col) col$type == "date", columns)
  
  n_numeric <- length(numeric_cols)
  n_categorical <- length(categorical_cols)
  n_date <- length(date_cols)
  has_time_series <- data_analysis$has_time_series %||% FALSE
  
  recommendations <- list()
  
  # ========================================================================
  # Decision Tree Logic (based on data-to-viz.com)
  # ========================================================================
  
  # 1 Numeric Variable
  if (n_numeric == 1 && n_categorical == 0) {
    recommendations <- append(recommendations, list(
      create_recommendation(
        type = "histogram",
        score = 0.95,
        reason = "Tek sayısal değişken için dağılım analizi",
        variables = list(x = numeric_cols[[1]]$name),
        ggplot_template = "histogram"
      ),
      create_recommendation(
        type = "boxplot",
        score = 0.85,
        reason = "Dağılım, medyan ve aykırı değerleri görmek için",
        variables = list(y = numeric_cols[[1]]$name),
        ggplot_template = "boxplot"
      ),
      create_recommendation(
        type = "density",
        score = 0.75,
        reason = "Sürekli dağılım eğrisi için",
        variables = list(x = numeric_cols[[1]]$name),
        ggplot_template = "density"
      )
    ))
  }
  
  # 1 Categorical Variable
  if (n_categorical == 1 && n_numeric == 0) {
    recommendations <- append(recommendations, list(
      create_recommendation(
        type = "bar",
        score = 0.95,
        reason = "Kategorileri karşılaştırmak için en uygun",
        variables = list(x = categorical_cols[[1]]$name),
        ggplot_template = "bar"
      ),
      create_recommendation(
        type = "pie",
        score = 0.70,
        reason = "Kategorilerin oransal dağılımını görmek için",
        variables = list(fill = categorical_cols[[1]]$name),
        ggplot_template = "pie"
      )
    ))
  }
  
  # 2 Numeric Variables
  if (n_numeric >= 2) {
    if (has_time_series || n_date >= 1) {
      # Time series
      recommendations <- append(recommendations, list(
        create_recommendation(
          type = "line",
          score = 0.95,
          reason = "Zaman serisi verisi için trend analizi",
          variables = list(
            x = if(n_date > 0) date_cols[[1]]$name else numeric_cols[[1]]$name,
            y = numeric_cols[[if(n_date > 0) 1 else 2]]$name
          ),
          ggplot_template = "line"
        ),
        create_recommendation(
          type = "area",
          score = 0.85,
          reason = "Zaman içindeki hacimsel değişimi görmek için",
          variables = list(
            x = if(n_date > 0) date_cols[[1]]$name else numeric_cols[[1]]$name,
            y = numeric_cols[[if(n_date > 0) 1 else 2]]$name
          ),
          ggplot_template = "area"
        )
      ))
    } else {
      # Correlation/relationship
      recommendations <- append(recommendations, list(
        create_recommendation(
          type = "scatter",
          score = 0.95,
          reason = "İki sayısal değişken arasındaki ilişkiyi görmek için",
          variables = list(
            x = numeric_cols[[1]]$name,
            y = numeric_cols[[2]]$name
          ),
          ggplot_template = "scatter"
        ),
        create_recommendation(
          type = "hexbin",
          score = 0.75,
          reason = "Çok sayıda gözlem için yoğunluk analizi",
          variables = list(
            x = numeric_cols[[1]]$name,
            y = numeric_cols[[2]]$name
          ),
          ggplot_template = "hexbin"
        )
      ))
    }
  }
  
  # 1 Numeric + 1 Categorical
  if (n_numeric >= 1 && n_categorical >= 1) {
    recommendations <- append(recommendations, list(
      create_recommendation(
        type = "grouped_bar",
        score = 0.95,
        reason = "Kategorilere göre sayısal değerleri karşılaştırmak için",
        variables = list(
          x = categorical_cols[[1]]$name,
          y = numeric_cols[[1]]$name
        ),
        ggplot_template = "grouped_bar"
      ),
      create_recommendation(
        type = "boxplot_grouped",
        score = 0.85,
        reason = "Kategorilere göre dağılım analizi",
        variables = list(
          x = categorical_cols[[1]]$name,
          y = numeric_cols[[1]]$name
        ),
        ggplot_template = "boxplot_grouped"
      ),
      create_recommendation(
        type = "violin",
        score = 0.75,
        reason = "Kategorilere göre detaylı dağılım analizi",
        variables = list(
          x = categorical_cols[[1]]$name,
          y = numeric_cols[[1]]$name
        ),
        ggplot_template = "violin"
      )
    ))
  }
  
  # Multiple numeric variables (3+)
  if (n_numeric >= 3) {
    recommendations <- append(recommendations, list(
      create_recommendation(
        type = "scatter_3d",
        score = 0.70,
        reason = "Üç boyutlu ilişki analizi (bubble chart olarak)",
        variables = list(
          x = numeric_cols[[1]]$name,
          y = numeric_cols[[2]]$name,
          size = numeric_cols[[3]]$name
        ),
        ggplot_template = "bubble"
      )
    ))
  }
  
  # Multiple time series
  if (has_time_series && n_numeric > 1) {
    recommendations <- append(recommendations, list(
      create_recommendation(
        type = "multi_line",
        score = 0.85,
        reason = "Birden fazla metriğin zaman içindeki karşılaştırması",
        variables = list(
          x = if(n_date > 0) date_cols[[1]]$name else "time",
          y = "multiple"
        ),
        ggplot_template = "multi_line"
      )
    ))
  }
  
  # Fallback: if no recommendations
  if (length(recommendations) == 0) {
    recommendations <- list(
      create_recommendation(
        type = "bar",
        score = 0.50,
        reason = "Genel amaçlı görselleştirme",
        variables = list(),
        ggplot_template = "bar"
      )
    )
  }
  
  # Sort by score
  recommendations <- recommendations[order(sapply(recommendations, function(r) r$score), decreasing = TRUE)]
  
  return(list(
    recommended = recommendations,
    total_count = length(recommendations)
  ))
}

#' Create a chart recommendation object
#' 
#' @param type Chart type
#' @param score Recommendation score (0-1)
#' @param reason Explanation
#' @param variables Variable mapping
#' @param ggplot_template Template name
#' @return List with recommendation details
create_recommendation <- function(type, score, reason, variables, ggplot_template) {
  list(
    type = type,
    score = score,
    reason = reason,
    variables = variables,
    ggplot_code = generate_ggplot_code(ggplot_template, variables)
  )
}

#' Generate ggplot2 code template
#' 
#' @param template Template name
#' @param variables Variable mapping
#' @return Character string with ggplot2 code
generate_ggplot_code <- function(template, variables) {
  switch(template,
    "histogram" = sprintf(
      "ggplot(df, aes(x = %s)) +\n  geom_histogram(bins = 30, fill = '#667eea', alpha = 0.7) +\n  theme_minimal() +\n  labs(title = 'Distribution of %s')",
      variables$x, variables$x
    ),
    "boxplot" = sprintf(
      "ggplot(df, aes(y = %s)) +\n  geom_boxplot(fill = '#667eea', alpha = 0.7) +\n  theme_minimal() +\n  labs(title = 'Boxplot of %s')",
      variables$y, variables$y
    ),
    "density" = sprintf(
      "ggplot(df, aes(x = %s)) +\n  geom_density(fill = '#667eea', alpha = 0.5) +\n  theme_minimal() +\n  labs(title = 'Density Plot of %s')",
      variables$x, variables$x
    ),
    "bar" = sprintf(
      "ggplot(df, aes(x = %s)) +\n  geom_bar(fill = '#667eea', alpha = 0.7) +\n  theme_minimal() +\n  labs(title = 'Count by %s')",
      variables$x, variables$x
    ),
    "pie" = sprintf(
      "# Pie chart requires data aggregation\ndf_summary <- df %%>%%\n  count(%s) %%>%%\n  mutate(percentage = n / sum(n))\n\nggplot(df_summary, aes(x = '', y = n, fill = %s)) +\n  geom_bar(stat = 'identity', width = 1) +\n  coord_polar('y') +\n  theme_void()",
      variables$fill, variables$fill
    ),
    "scatter" = sprintf(
      "ggplot(df, aes(x = %s, y = %s)) +\n  geom_point(color = '#667eea', alpha = 0.6, size = 2) +\n  theme_minimal() +\n  labs(title = '%s vs %s')",
      variables$x, variables$y, variables$x, variables$y
    ),
    "line" = sprintf(
      "ggplot(df, aes(x = %s, y = %s)) +\n  geom_line(color = '#667eea', size = 1) +\n  geom_point(color = '#667eea', size = 2) +\n  theme_minimal() +\n  labs(title = '%s over %s')",
      variables$x, variables$y, variables$y, variables$x
    ),
    "area" = sprintf(
      "ggplot(df, aes(x = %s, y = %s)) +\n  geom_area(fill = '#667eea', alpha = 0.5) +\n  geom_line(color = '#667eea', size = 1) +\n  theme_minimal() +\n  labs(title = '%s over %s')",
      variables$x, variables$y, variables$y, variables$x
    ),
    "grouped_bar" = sprintf(
      "ggplot(df, aes(x = %s, y = %s)) +\n  geom_col(fill = '#667eea', alpha = 0.7) +\n  theme_minimal() +\n  labs(title = '%s by %s')",
      variables$x, variables$y, variables$y, variables$x
    ),
    "boxplot_grouped" = sprintf(
      "ggplot(df, aes(x = %s, y = %s)) +\n  geom_boxplot(fill = '#667eea', alpha = 0.7) +\n  theme_minimal() +\n  labs(title = '%s by %s')",
      variables$x, variables$y, variables$y, variables$x
    ),
    "violin" = sprintf(
      "ggplot(df, aes(x = %s, y = %s)) +\n  geom_violin(fill = '#667eea', alpha = 0.7) +\n  theme_minimal() +\n  labs(title = '%s Distribution by %s')",
      variables$x, variables$y, variables$y, variables$x
    ),
    "bubble" = sprintf(
      "ggplot(df, aes(x = %s, y = %s, size = %s)) +\n  geom_point(color = '#667eea', alpha = 0.6) +\n  theme_minimal() +\n  labs(title = 'Bubble Chart')",
      variables$x, variables$y, variables$size
    ),
    "hexbin" = sprintf(
      "ggplot(df, aes(x = %s, y = %s)) +\n  geom_hex(bins = 30) +\n  scale_fill_gradient(low = '#f0f0f0', high = '#667eea') +\n  theme_minimal() +\n  labs(title = 'Density Hexbin')",
      variables$x, variables$y
    ),
    "multi_line" = "# Multi-line chart requires data in long format\nggplot(df_long, aes(x = time, y = value, color = variable)) +\n  geom_line(size = 1) +\n  theme_minimal() +\n  labs(title = 'Multiple Time Series')",
    # Default
    "ggplot(df) + geom_point() + theme_minimal()"
  )
}

#' Null coalescing operator
#' @keywords internal
`%||%` <- function(x, y) {
  if (is.null(x)) y else x
}
