const puppeteer = require("puppeteer");
const schedule = require('node-schedule');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

const port = 3000; // or any other port number you prefer

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

const myWalletAddresses = [
	"0x1a248bf7ecb369712e443d84603094dde3ef8653",
	"0x4bfd8854890358811c845afd9f42c03761efbd17",
];
const filePath = 'data.txt';

let browser = null;
let page = null;

app.get('/get-data', (req, res) => {
	getData().then(data => {
		res.send({ success: "Fetched data", data });
	}).catch((err) => {
		res.send({ error: err })
	})
});

app.get('/trigger-scraper', (req, res) => {
	init().then((response) => {
		if (response.success) {
			getData().then(data => {
				res.send({ success: "Fetched data", data });
			}).catch((err) => {
				res.send({ error: err })
			})
		} else {
			res.send({ error: response.error })
		}
	}).catch(err => {
		res.send({ error: err })
	})
});

//init();
schedule.scheduleJob('30 9,17,1 * * *', init);

async function init() {
	browser = await puppeteer.launch({ headless: 'new' });
	page = await browser.newPage();

	const data = new Map();

	try {
		for await (let address of myWalletAddresses) {
			const amount = await getWalletAmount(address);

			data.set(address, amount);
		}

		await writeMapToFile(data);

		await browser.close();

		return { success: "Init function executed" }
	} catch (error) {
		console.error(error);
		return { error: error }
	}
}

async function getWalletAmount(address) {
	let amount = 0;
	try {
		await page.goto(`https://debank.com/profile/${address}`);

		const textSelector = await page.waitForSelector(
			".HeaderInfo_totalAssetInner__1mOQs"
		);

		const loadSelector = await page.waitForSelector(
			".UpdateButton_refresh__1tR6K"
		)

		let loadingText = "";

		const requiredString = "Data updated";

		while (!loadingText.includes(requiredString)) {
			loadingText = await loadSelector?.evaluate((el) => el.textContent);

			amount = await textSelector?.evaluate((el) => el.textContent);
			amount = amount.slice(1);
			if (amount.includes('+')) {
				amount = amount.split('+')[0];
			} else if (amount.includes('-')) {
				amount = amount.split('-')[0];
			}

			sleep(1500);
		}

	} catch (error) {
		console.error(error);
	}

	return amount;
}


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


function writeMapToFile(map) {

	let content = '';

	content += `Date: ${getCurrentDateTime()}\n`;
	let totalAmount = 0;

	// Iterate over the map and append key-value pairs to the content string
	for (const [key, value] of map) {
		totalAmount += parseInt(value.replace(/,/g, ""));
		content += `${key}: ${value}\n`;
	}

	content += `Total Amount: ${totalAmount} \n \n`;

	// Write the content to the file
	return new Promise((resolve, reject) => {
		fs.appendFile(filePath, content, (err) => {
			if (err) {
				console.error('Error writing to file:', err);
				reject(err);
			} else {
				console.log('Data written to file successfully.');
				resolve('Data written to file successfully.')
			}
		});
	})
}



function getCurrentDateTime() {
	const now = new Date();
	const date = now.toISOString().slice(0, 10); // Format: YYYY-MM-DD
	const time = now.toLocaleTimeString(); // Format: HH:MM:SS
	return `${date} ${time}`;
}


async function getData() {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, 'utf8', (err, data) => {
			if (err) {
				reject(err);
			} else {
				// Split the data into individual entries using double line breaks as the separator
				const entries = data.split('\n \n');

				// Initialize an empty array to store the objects
				const objects = [];

				// Iterate over each entry
				for (const entry of entries) {
					// Split the entry into lines
					const lines = entry.trim().split('\n');

					// Extract the date from the first line
					const date = lines[0].replace('Date: ', '');

					// Initialize an object to store the values
					const obj = {
						date: date,
						amounts: []
					};

					// Iterate over the remaining lines
					for (let i = 1; i < lines.length; i++) {
						// Split each line into key-value pairs
						const [address, amount] = lines[i].split(': ');

						// Remove any leading/trailing spaces and commas from the amount
						const cleanedAmount = amount.replace(/,/g, '').trim();

						// Push the address and amount to the amounts array
						obj.amounts.push({
							address: address,
							amount: cleanedAmount
						});
					}

					// Push the object to the objects array
					if (obj.amounts.length > 0) {
						objects.push(obj);
					}
				}

				resolve(objects);
			}
		})
	})
}