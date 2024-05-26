<script setup lang="ts">
import { onMounted, ref, watchEffect } from "vue";
import * as d3 from "d3";
import { useResizeObserver } from "../use/resizeObserver";

const props = withDefaults(defineProps<{ data: number[] }>(),
  { data: () => [0] });

// create ref to pass to D3 for DOM manipulation
const svgRef = ref(null);

// create another ref to observe resizing, since observing SVGs doesn't work!
const { resizeRef, resizeState } = useResizeObserver();

onMounted(() => {

  const width = 640;
  const height = 400;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 30;
  const marginLeft = 40;

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc()
    .domain([new Date("2023-12-21"), new Date("2024-12-20")])
    .range([marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleTime()
    .domain([new Date("2000-1-1").setHours(0, 0, 0, 0), new Date("2000-1-1").setHours(23, 59, 59, 999)])
    .nice()
    // .domain([new Date().setHours(0,0,0,0), new Date().setHours(23,59,59,999)])
    .range([height - marginBottom, marginTop]);

  // Create the SVG container.
  const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

  // Add the x-axis.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x));

  // Add the y-axis.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y));

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "orange")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .x(function (d) { return x(d.date) })
      .y(function (d) { return y(d.sunrise) })
    )

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "orange")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .x(function (d) { return x(d.date) })
      .y(function (d) { return y(d.sunset) })
    )

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .x(function (d) { return x(d.date) })
      .y(function (d) { return y(d.lightOn) })
    )

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .x(function (d) { return x(d.date) })
      .y(function (d) { return y(d.lightOff) })
    )
});
</script>

<template>
  <div ref="resizeRef">
    <svg ref="svgRef">
      <g class="x-axis" />
      <g class="y-axis" />
    </svg>
  </div>
</template>
