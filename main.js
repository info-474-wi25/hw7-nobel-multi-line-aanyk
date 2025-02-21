// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create the SVG container and group element for the chart
const svgLine = d3.select("#lineChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 2: LOAD DATA
d3.csv("nobel_laureates.csv").then(data => {
    // 2.a: REFORMAT DATA
    data.forEach(d => {
        d.year = +d.year;       // Convert year to a number
        d.name = d.fullname;    // Rename column for clarity

        // 3.a: Categorize data into STEM and Non-STEM
        // Assume STEM categories are physics, chemistry, medicine
        if (["physics", "chemistry", "medicine"].includes(d.category.toLowerCase())) {
            d.categoryGroup = "STEM";
        } else {
            d.categoryGroup = "Non-STEM";
        }
    });

    // 3.b: Group data by categoryGroup and year, and count entries using d3.rollup
    const groupedData = Array.from(
        d3.rollup(data, v => v.length, d => d.categoryGroup, d => d.year)
    ).map(([categoryGroup, yearMap]) => ({
        categoryGroup,
        values: Array.from(yearMap, ([year, count]) => ({ year: +year, count }))
            .sort((a, b) => a.year - b.year)
    }));

    // 4: SET SCALES
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);

    const yMax = d3.max(groupedData, group => d3.max(group.values, d => d.count));
    const yScale = d3.scaleLinear()
        .domain([0, yMax])
        .nice()
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(["STEM", "Non-STEM"])
        .range(["steelblue", "orange"]);

    // 5: PLOT LINES
    // 5.a: Create a line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.count));

    // 5.b: Plot lines by binding data to <path> elements
    svgLine.selectAll(".line")
        .data(groupedData)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => line(d.values))
        // 5.c: Add style: set stroke using colorScale, width, and hover effects.
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d.categoryGroup))
        .attr("stroke-width", 2)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke-width", 4);
        })
        .on("mouseout", function(event, d) {
            d3.select(this).attr("stroke-width", 2);
        });

    // 6: ADD AXES
    // 6.a: X-Axis
    svgLine.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    // 6.b: Y-Axis
    svgLine.append("g")
        .call(d3.axisLeft(yScale));

    // 7: ADD LABELS
    // 7.a: Chart Title
    svgLine.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Nobel Laureates Trends: STEM vs Non-STEM");

    // 7.b: X-axis Label
    svgLine.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Year");

    // 7.c: Y-axis Label (rotated)
    svgLine.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .text("Number of Laureates");

    // 8: LEGEND
    const legend = svgLine.selectAll(".legend")
    .data(groupedData)
    .enter()
    .append("g")
    .attr("class", "legend")
    // Move the legend group near top-right of the chart:
    .attr("transform", (d, i) => `translate(${width - 110}, ${-50 + i * 20})`);

    // Draw color squares at x=0 inside the legend group
    legend.append("rect")
    .attr("width", 14)
    .attr("height", 14)
    .attr("fill", d => colorScale(d.categoryGroup));

    // Add text at x=20 so it appears to the right of the square
    legend.append("text")
    .attr("x", 20)
    .attr("y", 10)      // Slightly down so it aligns with rect
    .text(d => d.categoryGroup);

});