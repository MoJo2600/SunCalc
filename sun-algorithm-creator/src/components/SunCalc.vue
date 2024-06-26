<template>
  <v-container class="fill-height">
    <v-responsive class="align-centerfill-height mx-auto" max-width="900">

      <v-row>
        <v-col cols="12">
          <h1>Sun algorithm for adaptive lighting</h1>
        </v-col>
      </v-row>

      <v-row>

        <v-col cols="12">
          <v-card class="py-4" color="surface-variant" rounded="lg" variant="outlined" :loading="loading">
            <template #title>
              Parameters
            </template>

            <template #subtitle>
              Use the following parameters to adjust the algorithm.
            </template>
            <v-card-text>
              <p>
                The table below show the sun altitudes which define the specific stages of the twilight period (See <a
                  href="https://en.wikipedia.org/wiki/Sunset">wikipedia</a>).
                This algorithm will adjust the time when to run an automation (e.g. switch of a light) based on the day
                of year. It does this by applying a sinus wave which follows
                the sun year for which one is able to adjust the amplitude and and offset. The result can be seen in the
                graph below.
                With the correct settings one is able to have lights on longer in winter and shorter in summer.
              </p>
              <v-spacer class="mb-2"></v-spacer>
              <v-expansion-panels>
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    Sun altitude table
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-table>
                      <thead>
                        <tr>
                          <th>
                            Angle
                          </th>
                          <th>
                            Event
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>6°</td>
                          <td>golden hour</td>
                        </tr>
                        <tr>
                          <td>-0.833°</td>
                          <td>Sunset</td>
                        </tr>
                        <tr>
                          <td>-6°</td>
                          <td>dusk</td>
                        </tr>
                        <tr>
                          <td>-12°</td>
                          <td>nautical dusk</td>
                        </tr>
                        <tr>
                          <td>-18°</td>
                          <td>night</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>

            <v-divider class="mx-4 mb-1"></v-divider>

            <v-card-title>Settings</v-card-title>

            <div class="px-4 mb-2">
              <v-text-field label="latitude" v-model="settings.lat"></v-text-field>
              <v-text-field label="longitude" v-model="settings.lng"></v-text-field>
              <v-text-field label="height" v-model="settings.elevation"></v-text-field>
              <v-slider label="Amplitude" :max="20" :min="-20" :step="0.1" v-model="settings.lightOffAmplitude">
                <template v-slot:append>
                  <v-text-field v-model="settings.lightOffAmplitude" density="compact" style="width: 70px" type="number"
                    hide-details single-line></v-text-field>
                </template>
              </v-slider>
              <v-slider label="Offset" :max="30" :min="-30" :step="0.1" v-model="settings.lightOffOffset">
                <template v-slot:append>
                  <v-text-field v-model="settings.lightOffOffset" density="compact" style="width: 70px" type="number"
                    hide-details single-line></v-text-field>
                </template>
              </v-slider>

              <span>
                With the current settings, the amplitude will be between <strong>{{ lowerBound }}</strong> degrees
                in winter and <strong>{{ upperBound }}</strong> degrees in summer.
              </span>
            </div>

            <span class="mx-4 mb-1"></span>

            <v-chart ref="chart" class="chart" :loading="loading" :option="option" autoresize style="height: 500px" />
          </v-card>
        </v-col>
      </v-row>
    </v-responsive>
  </v-container>
</template>

<script setup lang="ts">
///// imports /////
import { computed, onMounted, provide, reactive, ref, shallowRef, watch, watchEffect } from 'vue';
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
import SunCalc from 'suncalc';
import dayjs from 'dayjs'
import dayOfYear from 'dayjs/plugin/dayOfYear';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import debounce from 'lodash.debounce'
import { color } from 'echarts';
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

///// props/emits /////
///// refs and variables /////

// type EChartsOption = ComposeOption<
//   | TitleComponentOption
//   | TooltipComponentOption
//   | LegendComponentOption
//   | PieSeriesOption
// >;

const startOfSunYear = dayjs().subtract(1, 'year').month(11).date(27);
const option = ref();
const loading = ref(false);
const chart = shallowRef(null);
let updateOptions = {};

const tableRows = ref<{
  date: string;
  sunset: string;
  lightOff: string;
  altitudeOff: number,
}[]>([])

const settings = reactive({
  lightOffAmplitude: 12,
  lightOffOffset: -22,
  lat: 49.01525,
  lng: 12.10175,
  elevation: 337
});

///// computed /////
const lowerBound = computed(() => {
  return settings.lightOffOffset - (settings.lightOffAmplitude);
});

const upperBound = computed(() => {
  return settings.lightOffOffset + (settings.lightOffAmplitude);
});


///// functions /////
const getOneDayTimeString = (date: Date): string => {
  return dayjs('2000-1-1').hour(date.getHours()).minute(date.getMinutes()).second(date.getSeconds()).format('YYYY/MM/DD HH:mm:ss')
}

const update = debounce(async () => {
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
  loading.value = false;
}, 200)

const getDataSet = async () => {
  let now = startOfSunYear;
  tableRows.value = [];

  for (var i = 0; i < 365; i++) {
    // https://math.stackexchange.com/questions/650223/formula-for-sine-wave-that-lines-up-with-calendar-seasons
    const altitudeOff = settings.lightOffAmplitude * (Math.sin(((2 * Math.PI) / 365) * (now.dayOfYear() - 81.75))) + settings.lightOffOffset;

    SunCalc.addTime(altitudeOff, 'lightOffMorning', 'lightOffEvening');

    var sunPos = SunCalc.getTimes(now.toDate(), settings.lat, settings.lng, settings.elevation);

    // add date to header row
    const date = [now.year(), now.month() + 1, now.date()].join('/');

    tableRows.value.push(
      {
        date,
        sunset: getOneDayTimeString(sunPos['sunset']),
        lightOff: getOneDayTimeString(sunPos['lightOffEvening']),
        altitudeOff,
      }
    )

    now = now.add(1, 'day');
  }
}

const setOptions = async (source) => {
  return {
    color: [
      '#fcba03',
      '#03fcfc',
      '#fc0349',
    ],
    animation: false,
    legend: {},
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        animation: false
      }
    },
    dataset: {
      dimensions: ['date', 'sunset', 'lightOff', 'altitudeOff'], // 'sunrise', 'sunsetStart', , 'altitudeOff'
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
        splitLine: {
          show: false
        },
      },
      {
        type: 'value',
        name: 'Altitude',
      }
    ],
    series: [
      {
        type: 'line',
        seriesLayoutBy: 'row',
        smooth: true,
        showSymbol: false,
        // color: colorPalette,
        tooltip: {
          valueFormatter: value => {
            return value['sunset'].split(' ')[1];
          }
        },
        // itemStyle: {normal: {areaStyle: {type: 'default'}}},
        lineStyle: { type: 'dashed', width: 1 }
      },
      {
        type: 'line',
        seriesLayoutBy: 'row',
        smooth: true,
        showSymbol: false,
        // color: colorPalette,
        tooltip: {
          valueFormatter: value => {
            return value['lightOff'].split(' ')[1];
          }
        },
      },
      {
        type: 'line',
        seriesLayoutBy: 'row',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        // color: colorPalette,
        tooltip: {
          valueFormatter: value => {
            return Math.round(value * 100) / 100;
          }
        },
        lineStyle: { type: 'dotted', width: .5 }
      },
    ],
    // graph: {
    //   color: colorPalette,
    // }
  }
};

///// watchers /////
watch(settings, async () => {
  await update();
})

///// lifecycle /////
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