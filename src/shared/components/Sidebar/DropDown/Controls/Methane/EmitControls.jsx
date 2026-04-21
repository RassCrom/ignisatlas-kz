import { useCallback } from "react";
import { Card, DatePicker, List } from "antd";
import dayjs from "dayjs";
const { RangePicker } = DatePicker;
import ToggleSwitch from "../../../ToggleSwitch/ToggleSwitch";

const EmitControls = ({
  emmitLayerVisible,
  setEmmitLayerVisible,
  beginDateEmmit,
  endDateEmmit,
  setBeginDateEmmit,
  setEndDateEmmit,
  emmitLayerIds,
}) => {
  const handleEmitDateChange = useCallback((dates, dateStrings) => {
    const [beginStr, endStr] = dateStrings;
    setBeginDateEmmit(dayjs(beginStr));
    setEndDateEmmit(dayjs(endStr));
  }, [setBeginDateEmmit, setEndDateEmmit]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div><i>EMIT</i></div>
        <ToggleSwitch
          isChecked={emmitLayerVisible}
          onChange={setEmmitLayerVisible}
        />
      </div>
      <RangePicker
        value={[
          dayjs(beginDateEmmit, 'YYYY-MM-DD'),
          dayjs(endDateEmmit, 'YYYY-MM-DD'),
        ]}
        format="YYYY-MM-DD"
        onChange={handleEmitDateChange}
      />
      {emmitLayerVisible && (
        <List style={{ height: 300, overflowY: 'scroll' }}>
          {emmitLayerIds.map((emmit) => (
            <Card hoverable key={emmit} style={{ marginBottom: '1px #011' }}>
              <p>{emmit}</p>
            </Card>
          ))}
        </List>
      )}
    </>
  );
};

export default EmitControls;
