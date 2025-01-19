import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const P9 = ({ data }) => {
    const svgRef = useRef(null);

    const [binningValue, setBinningValue] = useState(6000);
    const [threshold, setThreshold] = useState(null);
    const [standard, setStandard] = useState("frequency"); // 'frequency' or 'percentage'
    const [focusedBinFrequencyYPosition, setFocusedBinFrequencyYPosition] = useState(null);

    useEffect(() => {
        if (!binningValue || binningValue === 0) return;

        const incomeData = data.data;
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous chart

        const margin = { top: 10, right: 30, bottom: 65, left: 40 };
        const width = svgRef.current.clientWidth - margin.left - margin.right;
        const height = svgRef.current.clientHeight - margin.top - margin.bottom;

        const totalDataFrequency = incomeData.length;

        const x = d3
            .scaleLinear()
            .domain([d3.min(incomeData) - 100, d3.max(incomeData) + 100])
            .range([0, width]);

        const bins = d3
            .bin()
            .thresholds(x.ticks(Math.ceil(d3.max(incomeData) / binningValue)))(incomeData);

        // Adjust y-axis domain based on the selected standard
        const yMax =
            standard === "frequency"
                ? d3.max(bins, (d) => d.length)
                : d3.max(bins, (d) => (d.length / totalDataFrequency) * 100);

        const y = d3.scaleLinear().domain([0, yMax]).range([height, 0]);

        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));

        const yAxis = svg.append("g").call(
            d3.axisLeft(y).ticks(5).tickFormat((d) => (standard === "percentage" ? `${d}%` : d))
        );

        svg
            .append("text")
            .attr("class", "x-axis-label")
            .attr("x", width / 2)
            .attr("y", height + 45)
            .style("text-anchor", "middle")
            .text("Income");

        svg
            .append("text")
            .attr("class", "x-axis-label")
            .attr("x", width / 2)
            .attr("y", height + 65)
            .style("text-anchor", "middle")
            .style("font-weight", "lighter")
            .text(`(binning size of ${binningValue})`);

        svg
            .append("text")
            .attr("class", "x-axis-label")
            .attr("x", 35)
            .attr("y", 22)
            .style("font-size", "22px")
            .style("font-weight", "lighter")
            .text(
                `Threshold: ${
                    threshold !== null
                        ? standard === "percentage"
                            ? threshold.toFixed(4) 
                            : threshold 
                        : 0
                }`
            );

        if (threshold === null || threshold === 0) {
            svg
                .append("text")
                .attr("x", 35)
                .attr("y", 55)
                .attr("dy", -10)
                .attr("text-anchor", "start")
                .style("font-size", "15px")
                .style("font-weight", "lighter")
                .text("Click a bar or y-axis tick to set the threshold.");
        }

        svg
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - height / 2)
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .text(standard === "frequency" ? "Frequency" : "Percentage");

        svg
            .selectAll(".bar")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", (d) => x(d.x0) + 1)
            .attr("y", (d) =>
                y(standard === "frequency" ? d.length : (d.length / totalDataFrequency) * 100)
            )
            .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("height", (d) =>
                height - y(standard === "frequency" ? d.length : (d.length / totalDataFrequency) * 100)
            )
            .style("fill", (d) =>
                threshold !== null &&
                (standard === "frequency" ? d.length : (d.length / totalDataFrequency) * 100) <= threshold
                    ? "#D55E00" // Orange for outliers
                    : "#0072B2" // Blue for normal bins
            )
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                setThreshold(
                    standard === "frequency" ? d.length : (d.length / totalDataFrequency) * 100
                );
            })
            .on("mouseenter", function (event, d) {
                setFocusedBinFrequencyYPosition(
                    y(standard === "frequency" ? d.length : (d.length / totalDataFrequency) * 100)
                );
            })
            .on("mouseleave", () => {
                setFocusedBinFrequencyYPosition(null);
            });

        yAxis
            .selectAll(".tick")
            .on("mouseenter", function (event, d) {
                setFocusedBinFrequencyYPosition(y(d));
            })
            .on("mouseleave", function () {
                setFocusedBinFrequencyYPosition(null);
            })
            .on("click", function (event, d) {
                setThreshold(d);
            })
            .style("cursor", "pointer")
            .style("font-size", "14px");

        if (focusedBinFrequencyYPosition !== null) {
            svg.selectAll(".dashed-line").remove();
            svg
                .append("line")
                .attr("class", "dashed-line")
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", focusedBinFrequencyYPosition)
                .attr("y2", focusedBinFrequencyYPosition)
                .attr("stroke", "gray")
                .attr("stroke-dasharray", "5,7");
        } else {
            svg.selectAll(".dashed-line").remove();
        }
    }, [data, binningValue, threshold, standard, focusedBinFrequencyYPosition]);

    const handleBinningChange = (event) => {
        setBinningValue(parseInt(event.target.value, 10));
        setThreshold(0);
    };

    const handleStandardChange = (event) => {
        setStandard(event.target.value);
        setThreshold(null);
    };

    return (
        <div>
            <div className="d-flex">
                <div className="ms-auto mt-3" style={{width: "30%"}}>
                    <div className="d-flex ">
                        <p className="fs-4 fw-lighter me-4">임계기준 </p>
                        <div className="my-1">
                            <select
                                className="form-select form-select-sm"
                                value={standard}
                                onChange={handleStandardChange}
                                style={{height: "30px", width: "120px"}}>
                                <option value="frequency">건수</option>
                                <option value="percentage">비율</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div style={{marginTop: "70px"}}>
                <svg ref={svgRef} width="100%" height="330" viewBox="0 0 760 330"></svg>
            </div>
            <div className="d-flex">
                <div className="ms-auto" style={{width: "35%"}}>
                    <div className="d-flex align-content-center mt-3">
                        <p className="fw-lighter me-2">카운트구간길이 조정</p>
                        <div>
                            <input
                                type="range"
                                className="form-range"
                                id="input-range"
                                min="1000"
                                max="20000"
                                step="1000"
                                value={binningValue}
                                onChange={handleBinningChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default P9;
