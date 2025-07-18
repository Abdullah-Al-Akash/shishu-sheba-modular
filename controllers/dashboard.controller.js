const { ObjectId } = require("mongodb");
const client = require("../config/db");

const Order = client.db("sishuSheba").collection("orders");

// Helper functions
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

const getStartOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Main dashboard controller
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { timeframe, startDate, endDate, district } = req.query;
    
    // Base query
    let query = {};
    
    // Apply date filters if provided
    if (startDate && endDate) {
      query['user.orderDate'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Apply district filter if provided
    if (district) {
      query['user.district'] = district;
    }
    
    // Fetch all orders based on filters - using native driver
    const orders = await Order.find(query).toArray();
    
    if (!orders.length) {
      return res.status(200).json({
        success: true,
        message: 'No orders found with the given filters',
        data: {}
      });
    }
    
    // Process data based on timeframe
    let reportData = {};
    
    switch (timeframe) {
      case 'daily':
        reportData = generateDailyReport(orders);
        break;
      case 'weekly':
        reportData = generateWeeklyReport(orders);
        break;
      case 'monthly':
        reportData = generateMonthlyReport(orders);
        break;
      case 'yearly':
        reportData = generateYearlyReport(orders);
        break;
      default:
        // Default to all time summary
        reportData = generateSummaryReport(orders);
    }
    
    // Additional metrics
    const metrics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      avgOrderValue: orders.reduce((sum, order) => sum + order.total, 0) / orders.length,
      cancelledOrders: orders.filter(o => o.status === 'cancel').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
      pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'approved' || o.status === 'processing').length,
      popularProducts: getPopularProducts(orders),
      districtWiseDistribution: getDistrictDistribution(orders),
      statusDistribution: getStatusDistribution(orders)
    };
    
    res.status(200).json({
      success: true,
      message: 'Dashboard analytics fetched successfully',
      data: {
        timeframeReport: reportData,
        metrics,
        filters: {
          timeframe,
          startDate,
          endDate,
          district
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
};

// Report generation functions (remain the same as they work with plain JS objects)
function generateDailyReport(orders) {
  const dailyData = {};
  
  orders.forEach(order => {
    const orderDate = new Date(order.user.orderDate);
    const dateKey = formatDate(orderDate);
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        orders: 0,
        revenue: 0,
        items: 0
      };
    }
    
    dailyData[dateKey].orders += 1;
    dailyData[dateKey].revenue += order.total;
    dailyData[dateKey].items += order.items.reduce((sum, item) => sum + item.quantity, 0);
  });
  
  return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function generateWeeklyReport(orders) {
  const weeklyData = {};
  
  orders.forEach(order => {
    const orderDate = new Date(order.user.orderDate);
    const weekStart = getStartOfWeek(orderDate);
    const weekKey = formatDate(weekStart);
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        weekStart: weekKey,
        weekEnd: formatDate(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)),
        orders: 0,
        revenue: 0,
        items: 0
      };
    }
    
    weeklyData[weekKey].orders += 1;
    weeklyData[weekKey].revenue += order.total;
    weeklyData[weekKey].items += order.items.reduce((sum, item) => sum + item.quantity, 0);
  });
  
  return Object.values(weeklyData).sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart));
}

function generateMonthlyReport(orders) {
  const monthlyData = {};
  
  orders.forEach(order => {
    const orderDate = new Date(order.user.orderDate);
    const monthStart = getStartOfMonth(orderDate);
    const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        monthName: orderDate.toLocaleString('default', { month: 'long' }),
        year: orderDate.getFullYear(),
        orders: 0,
        revenue: 0,
        items: 0
      };
    }
    
    monthlyData[monthKey].orders += 1;
    monthlyData[monthKey].revenue += order.total;
    monthlyData[monthKey].items += order.items.reduce((sum, item) => sum + item.quantity, 0);
  });
  
  return Object.values(monthlyData).sort((a, b) => {
    return a.year === b.year ? 
      parseInt(a.month.split('-')[1]) - parseInt(b.month.split('-')[1]) :
      a.year - b.year;
  });
}

function generateYearlyReport(orders) {
  const yearlyData = {};
  
  orders.forEach(order => {
    const orderDate = new Date(order.user.orderDate);
    const year = orderDate.getFullYear();
    
    if (!yearlyData[year]) {
      yearlyData[year] = {
        year,
        orders: 0,
        revenue: 0,
        items: 0,
        months: Array(12).fill(0).map((_, i) => ({
          month: i + 1,
          orders: 0,
          revenue: 0
        }))
      };
    }
    
    yearlyData[year].orders += 1;
    yearlyData[year].revenue += order.total;
    yearlyData[year].items += order.items.reduce((sum, item) => sum + item.quantity, 0);
    
    const monthIndex = orderDate.getMonth();
    yearlyData[year].months[monthIndex].orders += 1;
    yearlyData[year].months[monthIndex].revenue += order.total;
  });
  
  return Object.values(yearlyData).sort((a, b) => a.year - b.year);
}

function generateSummaryReport(orders) {
  return {
    daily: generateDailyReport(orders),
    weekly: generateWeeklyReport(orders),
    monthly: generateMonthlyReport(orders),
    yearly: generateYearlyReport(orders)
  };
}

function getPopularProducts(orders) {
  const productMap = {};
  
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!productMap[item.name]) {
        productMap[item.name] = {
          name: item.name,
          quantity: 0,
          revenue: 0,
          image: item.image,
          category: item.category
        };
      }
      
      productMap[item.name].quantity += item.quantity;
      productMap[item.name].revenue += item.quantity * parseFloat(item.price);
    });
  });
  
  return Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5); // Top 5 products
}

function getDistrictDistribution(orders) {
  const districtMap = {};
  
  orders.forEach(order => {
    const district = order.user.district || 'Unknown';
    
    if (!districtMap[district]) {
      districtMap[district] = {
        district,
        orders: 0,
        revenue: 0
      };
    }
    
    districtMap[district].orders += 1;
    districtMap[district].revenue += order.total;
  });
  
  return Object.values(districtMap)
    .sort((a, b) => b.orders - a.orders);
}

function getStatusDistribution(orders) {
  const statusMap = {
    pending: { count: 0, label: 'Pending', color: '#FFA500' },
    approved: { count: 0, label: 'Approved', color: '#87CEEB' },
    processing: { count: 0, label: 'Processing', color: '#6495ED' },
    delivered: { count: 0, label: 'Delivered', color: '#32CD32' },
    cancel: { count: 0, label: 'Cancelled', color: '#FF4500' }
  };
  
  orders.forEach(order => {
    if (statusMap[order.status]) {
      statusMap[order.status].count += 1;
    }
  });
  
  return Object.values(statusMap);
}

// Additional endpoint for product performance
exports.getProductPerformance = async (req, res) => {
  try {
    const { productName, timeframe } = req.query;
    
    let query = {};
    if (productName) {
      query['items.name'] = productName;
    }
    
    // Using native driver method
    const orders = await Order.find(query).toArray();
    
    if (!orders.length) {
      return res.status(200).json({
        success: true,
        message: 'No orders found for the specified product',
        data: {}
      });
    }
    
    let performanceData = {};
    
    switch (timeframe) {
      case 'weekly':
        performanceData = generateWeeklyProductReport(orders, productName);
        break;
      case 'monthly':
        performanceData = generateMonthlyProductReport(orders, productName);
        break;
      default:
        performanceData = generateDailyProductReport(orders, productName);
    }
    
    res.status(200).json({
      success: true,
      message: 'Product performance data fetched successfully',
      data: performanceData
    });
    
  } catch (error) {
    console.error('Error fetching product performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product performance data',
      error: error.message
    });
  }
};

function generateDailyProductReport(orders, productName) {
  const dailyData = {};
  
  orders.forEach(order => {
    const orderDate = new Date(order.user.orderDate);
    const dateKey = formatDate(orderDate);
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        quantity: 0,
        revenue: 0
      };
    }
    
    order.items.forEach(item => {
      if (!productName || item.name === productName) {
        dailyData[dateKey].quantity += item.quantity;
        dailyData[dateKey].revenue += item.quantity * parseFloat(item.price);
      }
    });
  });
  
  return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function generateWeeklyProductReport(orders, productName) {
  const weeklyData = {};
  
  orders.forEach(order => {
    const orderDate = new Date(order.user.orderDate);
    const weekStart = getStartOfWeek(orderDate);
    const weekKey = formatDate(weekStart);
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        weekStart: weekKey,
        weekEnd: formatDate(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)),
        quantity: 0,
        revenue: 0
      };
    }
    
    order.items.forEach(item => {
      if (!productName || item.name === productName) {
        weeklyData[weekKey].quantity += item.quantity;
        weeklyData[weekKey].revenue += item.quantity * parseFloat(item.price);
      }
    });
  });
  
  return Object.values(weeklyData).sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart));
}

function generateMonthlyProductReport(orders, productName) {
  const monthlyData = {};
  
  orders.forEach(order => {
    const orderDate = new Date(order.user.orderDate);
    const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        monthName: orderDate.toLocaleString('default', { month: 'long' }),
        year: orderDate.getFullYear(),
        quantity: 0,
        revenue: 0
      };
    }
    
    order.items.forEach(item => {
      if (!productName || item.name === productName) {
        monthlyData[monthKey].quantity += item.quantity;
        monthlyData[monthKey].revenue += item.quantity * parseFloat(item.price);
      }
    });
  });
  
  return Object.values(monthlyData).sort((a, b) => {
    return a.year === b.year ? 
      parseInt(a.month.split('-')[1]) - parseInt(b.month.split('-')[1]) :
      a.year - b.year;
  });
}