'use client';

import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Chart({ type, data, options }) {
  return (
    <div className="relative h-64">
      {type === 'bar' ? (
        <Bar data={data} options={options} />
      ) : (
        <Pie data={data} options={options} />
      )}
    </div>
  );
}