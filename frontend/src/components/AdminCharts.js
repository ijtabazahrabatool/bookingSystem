import React, { useEffect, useRef } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminCharts({ appointments, services }) {
  // Prepare Data
  // 1. Line Chart: Revenue over last few entries
  const labels = appointments
    .map(a => new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    .slice(-5);
  const dataPoints = appointments.map(a => a.price).slice(-5);

  // 2. Doughnut Chart: Service Popularity
  const serviceCounts = {};
  appointments.forEach(a => {
    let sName = "Unknown";
    if (a.serviceId) {
      if (typeof a.serviceId === 'object' && a.serviceId.name) {
        sName = a.serviceId.name;
      } else {
        const service = services.find(s => 
          s._id === a.serviceId || 
          s._id === a.serviceId?._id || 
          s.id === a.serviceId || 
          s.id === a.serviceId?.id
        );
        sName = service?.name || "Unknown";
      }
    }
    serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
  });

  const lineData = {
    labels: labels,
    datasets: [{
      label: 'Revenue ($)',
      data: dataPoints,
      borderColor: '#4f46e5', // indigo-600
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const doughnutData = {
    labels: Object.keys(serviceCounts),
    datasets: [{
      data: Object.values(serviceCounts),
      backgroundColor: ['#818cf8', '#34d399', '#f472b6', '#fbbf24', '#60a5fa'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 10
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Revenue Trend</h3>
        <div className="chart-container">
          <Line data={lineData} options={chartOptions} />
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Service Popularity</h3>
        <div className="chart-container">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
}

