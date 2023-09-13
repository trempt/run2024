import React from 'react';
import Stat from '@/components/Stat';
import useActivities from '@/hooks/useActivities';
import Loading from '../Loading';

const PeriodStat = ({ onClick }: { onClick: (_period: string) => void }) => {
  const [{ runPeriod }, loading] = useActivities();

  const periodArr = Object.entries(runPeriod);
  periodArr.sort((a, b) => b[1] - a[1]);
  return (
    <div style={{ cursor: 'pointer' }}>
      <section>
        {loading ? <Loading /> : periodArr.map(([period, times]) => (
          <Stat
            key={period}
            value={period}
            description={` ${times} Runs`}
            citySize={3}
            onClick={() => onClick(period)}
          />
        ))}
      </section>
      <hr color="red" />
    </div>
  );
};

export default PeriodStat;
