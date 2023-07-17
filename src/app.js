import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
);

const options = {
	responsive: true,
	plugins: {
		legend: {
			position: 'top',
		},
		title: {
			display: true,
			text: 'My crypto portfolio chart',
		},
	},
};

const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

const defaultChartData = {
	labels,
	datasets: [
		{
			label: 'Dataset 1',
			data: ['0', '1', '2', '3'],
			borderColor: 'rgb(255, 99, 132)',
			backgroundColor: 'rgba(255, 99, 132, 0.5)',
		},
	],
};

function App() {
	const [data, setData] = useState([]);
	const [triggerBtnLoading, setTriggerBtnLoading] = useState(false);
	const [chartData, setChartData] = useState(defaultChartData);

	useEffect(() => {
		getData()
	}, []);

	useEffect(() => {
		if (data.length > 0) {
			let newLabels = [];
			let newData = [];
			data.forEach((value) => {
				newLabels.push(value.date);
				newData.push(value.amounts[2].amount);
			})

			const newChartData = {
				labels: newLabels,
				datasets: [
					{
						label: 'Total Amount',
						data: newData,
						borderColor: 'rgb(255, 99, 132)',
						backgroundColor: 'rgba(255, 99, 132)',

					}
				]
			}

			setChartData(newChartData)
		}
	}, [data]);

	function getData() {
		fetch('https://debank-scraper-server.onrender.com/get-data')
			.then(res => res.json())
			.then(res => {
				console.log(res);
				if (res.success) {
					console.log(res.data);
					setData(res.data);
				}
			})
	}

	function handleTriggerScraperBtn() {
		setTriggerBtnLoading(true);
		document.body.style.cursor = "wait";
		fetch('https://debank-scraper-server.onrender.com/trigger-scraper')
			.then(res => res.json())
			.then(res => {
				console.log(res);
				if (res.success) {
					setData(res.data);
				}
			}).catch(err => {
				console.log(err);
			}).finally(() => {
				setTriggerBtnLoading(false);
				document.body.style.cursor = "default";
			})
	}

	return (
		<div className='w-full h-full p-3 items-center justify-center flex flex-col'>
			<button onClick={handleTriggerScraperBtn}
				disabled={triggerBtnLoading}
				className='border border-black mb-4 rounded-md p-2 hover:bg-slate-100'>{
					triggerBtnLoading ? "Loading..." : "Trigger scraper"
				}</button>
			<table className="w-full table-fixed mb-10">
				<thead>
					<tr>
						<th className="p-2 text-center">Date</th>
						<th className="p-2">Cold wallet</th>
						<th className="p-2">Hot wallet</th>
						<th className="p-2">Total amount</th>
					</tr>
				</thead>
				<tbody>
					{
						data.map((value, index) => (
							<tr key={index}>
								<td className="p-2 text-center">{value.date}</td>
								<td className="p-2 text-center">{value.amounts[0]?.amount}</td>
								<td className="p-2 text-center">{value.amounts[1]?.amount}</td>
								<td className="p-2 text-center">{value.amounts[2]?.amount}</td>
							</tr>
						))
					}
				</tbody>
			</table>
			<div className='w-5/6'>
				<Line options={options} data={chartData} />
			</div>

		</div>
	)
}


const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App tab="home" />);