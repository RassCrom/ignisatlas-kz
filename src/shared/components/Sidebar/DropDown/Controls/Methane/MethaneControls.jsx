import { useCallback } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import ToggleSwitch from "../../../ToggleSwitch/ToggleSwitch";
import OpacityController from "../../OpacityController";

const MethaneControls = ({
  methaneLayerVisible,
  setMethaneLayerVisible,
  methaneYear,
  setMethaneYear,
  methaneOpacity,
  setMethaneOpacity,
}) => {
  const disabledDateSP = useCallback((current) => {
    return current.year() < 2019 || current.year() > 2024;
  }, []);

  const handleMethaneDateChange = useCallback((date, dateString) => {
    setMethaneYear(dateString);
  }, [setMethaneYear]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div><i>Sentinel - 5P</i></div>
        <ToggleSwitch
          isChecked={methaneLayerVisible}
          onChange={setMethaneLayerVisible}
        />
      </div>
      <DatePicker
        value={dayjs(methaneYear)}
        picker="year"
        disabledDate={disabledDateSP}
        onChange={handleMethaneDateChange}
      />
      <OpacityController
        id="sp"
        opacityValue={methaneOpacity}
        setOpacityValue={setMethaneOpacity}
      />
      <hr color="gray" />
    </>
  );
};

export default MethaneControls;
