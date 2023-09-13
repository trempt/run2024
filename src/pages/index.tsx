import { Analytics } from '@vercel/analytics/react';
import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import LocationStat from '@/components/LocationStat';
import RunMap from '@/components/RunMap';
import RunTable from '@/components/RunTable';
import SVGStat from '@/components/SVGStat';
import YearsStat from '@/components/YearsStat';
import useActivities from '@/hooks/useActivities';
import useSiteMetadata from '@/hooks/useSiteMetadata';
import { IS_CHINESE } from '@/utils/const';
import {
  Activity,
  IViewport,
  filterAndSortRuns,
  filterCityRuns,
  filterTitleRuns,
  filterYearRuns,
  geoJsonForRuns,
  getBoundsForGeoData,
  scrollToMap,
  sortDateFunc,
  titleForShow,
} from '@/utils/utils';

const Index = () => {
  const { siteTitle } = useSiteMetadata();
  const [{ activities, thisYear }] = useActivities();
  const [year, setYear] = useState(thisYear);
  const [runIndex, setRunIndex] = useState(-1);

  useEffect(() => {
    setYear(thisYear);
  }, [thisYear]);

  const [runs, setRuns] = useState<Activity[]>([]);

  useEffect(() => {
    setRuns(filterAndSortRuns(activities, year, filterYearRuns, sortDateFunc));
  }, [activities, year]);

  const [title, setTitle] = useState('');
  const [geoData, setGeoData] = useState(geoJsonForRuns([]));
  // for auto zoom
  const bounds = useMemo(() => {
    return geoData.features.length > 0 ? getBoundsForGeoData(geoData) : {};
  }, [geoData])
  const [intervalId, setIntervalId] = useState<number>();

  const [viewport, setViewport] = useState<IViewport>({
    ...bounds,
  });

  const changeByItem = (
    item: string,
    name: string,
    func: (_run: Activity, _value: string) => boolean
  ) => {
    scrollToMap();
    setRuns(filterAndSortRuns(activities, item, func, sortDateFunc));
    setRunIndex(-1);
    setTitle(`${item} ${name} Running Heatmap`);
  };

  const changeYear = (y: string) => {
    // default year
    setYear(y);

    if ((viewport.zoom ?? 0) > 3) {
      setViewport({
        ...bounds,
      });
    }

    changeByItem(y, 'Year', filterYearRuns);
    clearInterval(intervalId);
  };

  const changeCity = (city: string) => {
    changeByItem(city, 'City', filterCityRuns);
  };

  const changeTitle = (title: string) => {
    changeByItem(title, 'Title', filterTitleRuns);
  };

  const locateActivity = (runDate: string) => {
    const activitiesOnDate = runs.filter(
      (r) => r.start_date_local.slice(0, 10) === runDate
    );

    if (!activitiesOnDate.length) {
      return;
    }

    const sortedActivities = activitiesOnDate.sort(
      (a, b) => b.distance - a.distance
    );
    const info = sortedActivities[0];

    if (!info) {
      return;
    }

    setGeoData(geoJsonForRuns([info]));
    setTitle(titleForShow(info));
    clearInterval(intervalId);
    scrollToMap();
  };

  useEffect(() => {
    setViewport({
      ...bounds,
    });
  }, [geoData]);

  useEffect(() => {
    const runsNum = runs.length;
    // maybe change 20 ?
    const sliceNume = runsNum >= 20 ? runsNum / 20 : 1;
    let i = sliceNume;
    const id = setInterval(() => {
      if (i >= runsNum) {
        clearInterval(id);
      }

      const tempRuns = runs.slice(0, i);
      setGeoData(geoJsonForRuns(tempRuns));
      i += sliceNume;
    }, 100);
    setIntervalId(id);
    return () => clearInterval(id);
  }, [runs]);

  useEffect(() => {
    if (year !== 'Total') {
      return;
    }

    let svgStat = document.getElementById('svgStat');
    if (!svgStat) {
      return;
    }
    svgStat.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target) {
        const tagName = target.tagName.toLowerCase();

        if (
          (tagName === 'rect' &&
            parseFloat(target.getAttribute('width') as string) === 2.6 &&
            parseFloat(target.getAttribute('height') as string) === 2.6 &&
            target.getAttribute('fill') !== '#444444') ||
          tagName === 'polyline'
        ) {
          const [runDate] = target.innerHTML.match(/\d{4}-\d{1,2}-\d{1,2}/) || [
            `${+thisYear + 1}`,
          ];
          locateActivity(runDate);
        }
      }
    });
  }, [year]);

  return (
    <Layout>
      <div className="fl w-30-l">
        <h1 className="f1 fw9 i">
          <a href="/">{siteTitle}</a>
        </h1>
        {(viewport.zoom ?? 0) <= 3 && IS_CHINESE ? (
          <LocationStat
            changeYear={changeYear}
            changeCity={changeCity}
            changeTitle={changeTitle}
          />
        ) : (
          <YearsStat year={year} onClick={changeYear} />
        )}
      </div>
      <div className="fl w-100 w-70-l">
        <RunMap
          title={title}
          viewport={viewport}
          geoData={geoData}
          setViewport={setViewport}
          changeYear={changeYear}
          thisYear={year}
        />
        {year === 'Total' ? (
          <SVGStat />
        ) : (
          <RunTable
            runs={runs}
            locateActivity={locateActivity}
            setActivity={setRuns}
            runIndex={runIndex}
            setRunIndex={setRunIndex}
          />
        )}
      </div>
      {/* Enable Audiences in Vercel Analytics: https://vercel.com/docs/concepts/analytics/audiences/quickstart */}
      <Analytics />
    </Layout>
  );
};

export default Index;
