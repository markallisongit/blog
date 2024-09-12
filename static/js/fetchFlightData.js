async function fetchFlightData() {
    try {
        const response = await fetch('https://ppgstats.blob.core.windows.net/data/flight-data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const displayItems = {
            "Total Flights": "Flights",
            "Total Hours": "Hours",
            "Avg Flight Duration (Mins)": "Avg Flight Time (Mins)",
            "Longest Flight Duration": "Longest Flight",
            "Longest Range": "Longest Range (mi)",
            "Average Range": "Average Range (mi)"
        };

        let flightDataHtml = '';

        data.ResultSets.Table1.forEach(item => {
            if (displayItems[item.Item]) {
                if (item.Item === "Longest Flight Duration") {
                    const formattedDuration = item.Value.substring(0, 5);
                    flightDataHtml += `<p><strong>${displayItems[item.Item]}:</strong> ${formattedDuration}</p>`;
                } else {
                    flightDataHtml += `<p><strong>${displayItems[item.Item]}:</strong> ${item.Value}</p>`;
                }
            }
        });

        document.getElementById('flightData').innerHTML = flightDataHtml;
        document.getElementById('lastUpdated').innerHTML = `Last Updated: <span>${data.StatsDate}</span>`;
    } catch (error) {
        document.getElementById('flightData').innerHTML = `<p>Error loading data. Please try again later.</p>`;
        console.error('Error fetching data:', error);
    }
}

fetchFlightData();
