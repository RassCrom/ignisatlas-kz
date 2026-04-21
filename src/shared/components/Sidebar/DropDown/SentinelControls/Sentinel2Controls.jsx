import OpacityController from "../OpacityController";
import ToggleSwitch from "../../ToggleSwitch/ToggleSwitch";

const Sentinel2Controls = ({
  emitSn2LayerVisible,
  setEmitSn2LayerVisible,
  emitSn2Opacity,
  setEmitSn2Opacity,
}) => (
  <div style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.2)', paddingBottom: 32 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div><i>Sentinel - 2</i></div>
      <ToggleSwitch
        isChecked={emitSn2LayerVisible}
        onChange={setEmitSn2LayerVisible}
      />
    </div>
    <OpacityController
      id="sp_sn2"
      opacityValue={emitSn2Opacity}
      setOpacityValue={setEmitSn2Opacity}
    />
  </div>
);

export default Sentinel2Controls;
