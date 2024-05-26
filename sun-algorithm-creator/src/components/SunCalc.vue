<template>
  <v-container class="fill-height">
    <v-responsive class="align-centerfill-height mx-auto" max-width="900">

      <v-row>
        <v-col cols="12">
          <h1>Sun algorithm calculator</h1>
        </v-col>
      </v-row>

      <v-row>

        <v-col cols="12">
          <v-card class="py-4" color="surface-variant" rounded="lg" variant="outlined" :loading="loading">
            <template #title>
              <h2 class="text-h5 font-weight-bold">Parameters</h2>
            </template>

            <template #subtitle>
              <div class="text-subtitle-1">
                Use the following parameters to adjust the algorithm.
              </div>
            </template>

            <v-card-text>
              <v-slider label="Amplitude" :max="180" :min="-180" :step="1" v-model="settings.amplitude"></v-slider>
              {{ settings.amplitude }}
              <v-slider label="Period" :max="1" :min="0" :step="0.01" v-model="settings.period"></v-slider>
              {{ settings.period }}
              <v-slider label="Offset" :max="100" :min="0" :step="1" v-model="settings.offset"></v-slider>
              {{ settings.offset }}
              {{ loading }}
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-card class="py-4" color="surface-variant" rounded="lg" variant="outlined">
            <template #title>
              <h2 class="text-h5 font-weight-bold">Graph</h2>
            </template>

            <template #subtitle>
              <div class="text-subtitle-1">
                Visual representation
              </div>
            </template>

            <v-card-text>
              <v-chart ref="chart" class="chart" :loading="loading" :option="option" autoresize style="height: 500px" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, provide, reactive, ref, shallowRef, watch, watchEffect } from 'vue';
import { use } from 'echarts/core';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
} from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';
import { CanvasRenderer } from 'echarts/renderers';
import type { ComposeOption } from 'echarts/core';
import type { PieSeriesOption } from 'echarts/charts';
import type {
  TitleComponentOption,
  TooltipComponentOption,
  LegendComponentOption,
} from 'echarts/components';
import SunCalc from 'suncalc';
import dayjs from 'dayjs'
import dayOfYear from 'dayjs/plugin/dayOfYear';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import debounce from 'lodash.debounce'
dayjs.extend(localizedFormat)
dayjs.extend(dayOfYear)

use([
  TitleComponent,
  TooltipComponent,
  DatasetComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
  GridComponent,
  BarChart,
  PieChart
]);

provide(THEME_KEY, 'dark');

type EChartsOption = ComposeOption<
  | TitleComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | PieSeriesOption
>;

const amplitude = ref(1.0);
const period = ref(1.0);
const offset = ref(10);

const startOfSunYear = dayjs().subtract(1, 'year').month(11).date(27);
const fixedDate = dayjs('2000-1-1 00:00:00')
let oneDay = 24 * 3600 * 1000;
const lat = ref(49.051944);
const lng = ref(11.782778);
const elevation = ref(514);
const option = ref();
const loading = ref(false);
const chart = shallowRef(null);
let updateOptions = {};

const settings = reactive({
  amplitude: 1.0,
  period: 0.01,
  offset: 10
})


const update = debounce(async () => {
  console.log('Update chart');
  loading.value = true;
  // console.dir(source);
  if (chart.value) {
    const source = await getDataSet();
    (chart.value as any).setOption(
      updateOptions = {
        dataset: {
          source
        },
      });
  }
  // setOptions(source);
  loading.value = false;
}, 200)

watch(settings, async () => {
  await update();
})


const getOneDayTimeString = (date: Date): string => {
  return dayjs('2000-1-1').hour(date.getHours()).minute(date.getMinutes()).second(date.getSeconds()).format('YYYY/MM/DD HH:mm:ss')
}

const getDataSet = async () => {
  let now = startOfSunYear;
  const dataset = [] as any[];

  dataset.push(['date']);
  dataset.push(['sunrise']);
  dataset.push(['sunset']);
  dataset.push(['lightOn']);
  dataset.push(['lightOff']);
  console.log(settings.amplitude);

  for (var i = 0; i < 365; i++) {
    const dayOfYear = dayjs().dayOfYear();
    const altitude = -1.0 * (settings.amplitude * Math.sin((settings.period * dayOfYear) - (1.377 - Math.PI)) + settings.offset);
    SunCalc.addTime(altitude, 'lightOn', 'lightOff');

    var sunPos = SunCalc.getTimes(now.toDate(), lat.value, lng.value, elevation.value);

    // add date to header row
    dataset[0].push([now.year(), now.month() + 1, now.date()].join('/'))
    dataset[1].push(getOneDayTimeString(sunPos['sunrise']));
    dataset[2].push(getOneDayTimeString(sunPos['sunset']));
    dataset[3].push(getOneDayTimeString(sunPos['lightOn']));
    dataset[4].push(getOneDayTimeString(sunPos['lightOff']));
    now = now.add(1, 'day');
  }

  return dataset;
}

const setOptions = async (source) => {
  return {
    animation: false,
    legend: {},
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        params = params[0];
        var date = new Date(params.name);
        return (
          date.getDate() +
          '/' +
          (date.getMonth() + 1) +
          '/' +
          date.getFullYear() +
          ' : ' +
          params.value[1]
        );
      },
      axisPointer: {
        animation: false
      }
    },
    dataset: {
      source
    },
    xAxis: {
      type: 'category',
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'time',
      // boundaryGap: ['00:00:00'],
      splitLine: {
        show: false
      }
    },
    // grid: { top: '55%' },
    series: [
      {
        type: 'line',
        seriesLayoutBy: 'row',
        smooth: true,
        showSymbol: false,
        // itemStyle: {normal: {areaStyle: {type: 'default'}}},
        lineStyle: { color: '#fcc603' }
      },
      {
        type: 'line',
        seriesLayoutBy: 'row',
        smooth: true,
        showSymbol: false,
        // itemStyle: {normal: {areaStyle: {type: 'default'}}},
        lineStyle: { color: '#fcc603' }
      },
      {
        type: 'line',
        seriesLayoutBy: 'row',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#fc3903' }
      },
      {
        type: 'line',
        seriesLayoutBy: 'row',
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#fc3903' }
      },
    ]
  }
};

onMounted(async () => {
  const source = await getDataSet();
  option.value = await setOptions(source);
})

</script>

<style scoped>
.chart {
  height: 100vh;
}
</style>