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
              <h2>Light On</h2>
              <v-slider label="Amplitude" :max="3" :min="-3" :step="0.1" v-model="settings.lightOnAmplitude">
                <template v-slot:append>
                  <v-text-field v-model="settings.lightOnAmplitude" density="compact" style="width: 70px" type="number" hide-details
                    single-line></v-text-field>
                </template>
              </v-slider>
              <v-slider label="Offset" :max="100" :min="-100" :step="1" v-model="settings.lightOnOffset">
                <template v-slot:append>
                  <v-text-field v-model="settings.lightOnOffset" density="compact" style="width: 70px" type="number" hide-details
                    single-line></v-text-field>
                </template>

              </v-slider>
              <h2>Light Off</h2>
              <v-slider label="Amplitude" :max="3" :min="-3" :step="0.1" v-model="settings.lightOffAmplitude">
                <template v-slot:append>
                  <v-text-field v-model="settings.lightOffAmplitude" density="compact" style="width: 90px" type="number" hide-details
                    single-line></v-text-field>
                </template>
              </v-slider>
              <v-slider label="Offset" :max="10" :min="-10" :step="0.1" v-model="settings.lightOffOffset">
                <template v-slot:append>
                  <v-text-field v-model="settings.lightOffOffset" density="compact" style="width: 90px" type="number" hide-details
                    single-line></v-text-field>
                </template>

              </v-slider>
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

            <v-data-table :items="tableRows">

            </v-data-table>
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

// type EChartsOption = ComposeOption<
//   | TitleComponentOption
//   | TooltipComponentOption
//   | LegendComponentOption
//   | PieSeriesOption
// >;

// const amplitude = ref(1.0);
// const period = ref(1.0);
// const offset = ref(10);

const startOfSunYear = dayjs().subtract(1, 'year').month(11).date(27);
// const fixedDate = dayjs('2000-1-1 00:00:00')
let oneDay = 24 * 3600 * 1000;
const lat = ref(49.051944);
const lng = ref(11.782778);
const elevation = ref(514);
const option = ref();
const loading = ref(false);
const chart = shallowRef(null);
let updateOptions = {};

const tableRows = ref<{
  date: string;
  sunrise: string;
  sunset: string;
  sunsetStart: string;
  lightOn: string;
  lightOff: string,
  altitudeOn: number,
  altitudeOff: number,
}[]>([])

const settings = reactive({
  lightOnAmplitude: -0.5,
  lightOnOffset: 0,
  lightOffAmplitude: -0.5,
  lightOffOffset: 1
})


const update = debounce(async () => {
  // console.log('Update chart');
  loading.value = true;
  if (chart.value) {
    await getDataSet();
    (chart.value as any).setOption(
      updateOptions = {
        dataset: {
          source: tableRows.value
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
  tableRows.value = [];
  // const dataset = [] as any[];

  // dataset.push(['date']);
  // dataset.push(['sunrise']);
  // dataset.push(['sunsetStart']);
  // dataset.push(['sunset']);
  // dataset.push(['lightOn']);
  // dataset.push(['lightOff']);

  for (var i = 0; i < 365; i++) {

    // const altitude = 1 * (settings.amplitude * Math.sin((settings.period * i) - (1.377 - Math.PI)) + settings.offset);


    // https://math.stackexchange.com/questions/650223/formula-for-sine-wave-that-lines-up-with-calendar-seasons
    const altitudeOn = settings.lightOnAmplitude * (Math.sin(((2 * Math.PI) / 365) * (now.dayOfYear() - 81.75))) + settings.lightOnOffset;
    const altitudeOff = settings.lightOffAmplitude * (Math.sin(((2 * Math.PI) / 365) * (now.dayOfYear() - 81.75))) + settings.lightOffOffset;

    SunCalc.addTime(altitudeOn, 'lightOnMorning', 'lightOnEvening');
    SunCalc.addTime(altitudeOff, 'lightOffMorning', 'lightOffEvening');

    var sunPos = SunCalc.getTimes(now.toDate(), lat.value, lng.value, elevation.value);

    // add date to header row
    const date = [now.year(), now.month() + 1, now.date()].join('/');
    // dataset[0].push(date);
    // dataset[1].push(getOneDayTimeString(sunPos['sunrise']));
    // dataset[2].push(getOneDayTimeString(sunPos['sunset']));
    // dataset[3].push(getOneDayTimeString(sunPos['lightOnEvening']));
    // dataset[4].push(getOneDayTimeString(sunPos['lightOffEvening']));

    tableRows.value.push(
      {
        date,
        sunrise: getOneDayTimeString(sunPos['sunrise']),
        sunsetStart: getOneDayTimeString(sunPos['sunsetStart']),
        sunset: getOneDayTimeString(sunPos['sunset']),
        lightOn: getOneDayTimeString(sunPos['lightOnEvening']),
        lightOff: getOneDayTimeString(sunPos['lightOffEvening']),
        altitudeOn,
        altitudeOff
      }
    )

    now = now.add(1, 'day');
  }

  // console.dir(tableRows.value);

  // return dataset;
}

const setOptions = async (source) => {
  return {
    animation: false,
    legend: {},
    tooltip: {
      trigger: 'axis',
      // axisPointer: {
      //   label: {
      //     formatter: (params) => {
      //       console.dir(params);
      //     }
      //   }
      // },
      // formatter: function (params) {

      //   // let text = '';
      //   // for (const param of params) {

      //   // }

      //   console.dir(params);
      //   params = params[0];
      //   var date = new Date(params.name);
      //   return (
      //     date.getDate() +
      //     '/' +
      //     (date.getMonth() + 1) +
      //     '/' +
      //     date.getFullYear() +
      //     ' : ' +
      //     params.value[1] 
      //   );
      // },
      axisPointer: {
        animation: false
      }
    },
    dataset: {
      dimensions: ['date', 'sunrise', 'sunsetStart', 'sunset', 'lightOn', 'lightOff', 'altitudeOn', 'altitudeOff'],
      source
    },
    xAxis: {
      type: 'category',
      splitLine: {
        show: false
      }
    },
    yAxis: [
      {
        type: 'time',
        // boundaryGap: ['00:00:00'],
        splitLine: {
          show: false
        },
      },
      {
        type: 'value',
        name: 'Altitude',
        // min: 0,
        // max: 1
      }
    ],
    // grid: { top: '55%' },
    series: [
      {
        type: 'line',
        seriesLayoutBy: 'row',
        smooth: true,
        showSymbol: false,
        tooltip: {
          valueFormatter: value => {
            return value['sunrise']
          }
        },
        // itemStyle: {normal: {areaStyle: {type: 'default'}}},
        lineStyle: { color: '#fcc603', type: 'dashed', width: 1 }
      },
      {
        type: 'line',
        seriesLayoutBy: 'row',
        smooth: true,
        showSymbol: false,
        tooltip: {
          valueFormatter: value => {
            return value['sunsetStart']
          }
        },
        // itemStyle: {normal: {areaStyle: {type: 'default'}}},
        lineStyle: { color: '#fcc603', type: 'dashed', width: 1 }
      },
      {
        type: 'line',
        seriesLayoutBy: 'row',
        smooth: true,
        showSymbol: false,
        tooltip: {
          valueFormatter: value => {
            return value['sunset']
          }
        },
        // itemStyle: {normal: {areaStyle: {type: 'default'}}},
        lineStyle: { color: '#fcc603', type: 'dashed', width: 1 }
      },
      {
        type: 'line',
        seriesLayoutBy: 'row',
        smooth: true,
        showSymbol: false,
        tooltip: {
          valueFormatter: value => {
            return value['lightOn']
          }
        },
      },
      {
        type: 'line',
        seriesLayoutBy: 'row',
        smooth: true,
        showSymbol: false,
        tooltip: {
          valueFormatter: value => {
            return value['lightOff']
          }
        },
      },
      {
        type: 'line',
        seriesLayoutBy: 'row',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
      },
      {
        type: 'line',
        seriesLayoutBy: 'row',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
      },
    ]
  }
};

onMounted(async () => {
  await getDataSet();
  option.value = await setOptions(tableRows.value);
})

</script>

<style scoped>
.chart {
  height: 100vh;
}
</style>