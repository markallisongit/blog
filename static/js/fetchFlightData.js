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
                // Special handling for "Longest Flight Duration" to format it to HH:MM
                if (item.Item === "Longest Flight Duration") {
                    const formattedDuration = item.Value.substring(0, 5); // Take only HH:MM from HH:MM:SS
                    flightDataHtml += `<p style="text-align:center;"><strong>${displayItems[item.Item]}:</strong> ${formattedDuration}</p>`;
                } else {
                    flightDataHtml += `<p style="text-align:center;"><strong>${displayItems[item.Item]}:</strong> ${item.Value}</p>`;
                }
            }
        });

        // Update the flight data box with the formatted data
        document.getElementById('flightData').innerHTML = flightDataHtml;

        // Update the last updated field with smaller text and center alignment
        document.getElementById('lastUpdated').innerHTML = `
            <p style="font-size:12px; text-align:center;">Last Updated: <span>${data.StatsDate}</span></p>
        `;
    } catch (error) {
        document.getElementById('flightData').innerHTML = `<p style="text-align:center;">Error loading data. Please try again later.</p>`;
        console.error('Error fetching data:', error);
    }
}

// Call the function to fetch and display the flight data
fetchFlightData();
