// Helper functions for report calculations and formatting

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} - Percentage change
 */
export const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }
  
  /**
   * Format large numbers with K, M, B suffixes
   * @param {number} num - Number to format
   * @returns {string} - Formatted number string
   */
  export const formatLargeNumber = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + "B"
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }
  
  /**
   * Generate color palette for charts
   * @param {number} count - Number of colors needed
   * @returns {Array} - Array of color strings
   */
  export const generateChartColors = (count) => {
    const baseColors = [
      "#3B82F6", // Blue
      "#10B981", // Green
      "#F59E0B", // Yellow
      "#EF4444", // Red
      "#8B5CF6", // Purple
      "#06B6D4", // Cyan
      "#F97316", // Orange
      "#84CC16", // Lime
      "#EC4899", // Pink
      "#6B7280", // Gray
    ]
  
    if (count <= baseColors.length) {
      return baseColors.slice(0, count)
    }
  
    // Generate additional colors if needed
    const colors = [...baseColors]
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 137.508) % 360 // Golden angle approximation
      colors.push(`hsl(${hue}, 70%, 50%)`)
    }
  
    return colors
  }
  
  /**
   * Calculate conversion rate
   * @param {number} converted - Number of conversions
   * @param {number} total - Total number
   * @returns {number} - Conversion rate percentage
   */
  export const calculateConversionRate = (converted, total) => {
    if (total === 0) return 0
    return Math.round((converted / total) * 100 * 100) / 100 // Round to 2 decimal places
  }
  
  /**
   * Get date range presets
   * @returns {Object} - Object with date range presets
   */
  export const getDateRangePresets = () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
  
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
  
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
  
    const lastQuarter = new Date(today)
    lastQuarter.setMonth(lastQuarter.getMonth() - 3)
  
    const lastYear = new Date(today)
    lastYear.setFullYear(lastYear.getFullYear() - 1)
  
    return {
      today: {
        startDate: today.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        label: "Today",
      },
      yesterday: {
        startDate: yesterday.toISOString().split("T")[0],
        endDate: yesterday.toISOString().split("T")[0],
        label: "Yesterday",
      },
      lastWeek: {
        startDate: lastWeek.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        label: "Last 7 Days",
      },
      lastMonth: {
        startDate: lastMonth.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        label: "Last 30 Days",
      },
      lastQuarter: {
        startDate: lastQuarter.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        label: "Last 3 Months",
      },
      lastYear: {
        startDate: lastYear.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        label: "Last Year",
      },
    }
  }
  
  /**
   * Export data to CSV format
   * @param {Array} data - Array of objects to export
   * @param {Array} headers - Array of header strings
   * @param {string} filename - Filename for the export
   */
  export const exportToCSV = (data, headers, filename) => {
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || ""
            return `"${String(value).replace(/"/g, '""')}"`
          })
          .join(","),
      ),
    ].join("\n")
  
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  