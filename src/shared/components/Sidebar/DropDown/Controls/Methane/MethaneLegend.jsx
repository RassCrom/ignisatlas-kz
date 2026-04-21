import styles from "../../DropDown.module.scss";

const MethaneLegend = ({ methaneLayerVisible, emitSn2LayerVisible, emmitLayerVisible }) => (
  <>
    {(emitSn2LayerVisible || emmitLayerVisible) && (
      <div className={styles["methane-legend-2"]}>
        <img src="/map_attributes/methane_legend_1.png" width={250} alt="Methane Legend 1" />
      </div>
    )}
    {methaneLayerVisible && (
      <div className={styles["methane-legend"]}>
        <img src="/map_attributes/methane_legend_2.png" width={250} alt="Methane Legend 2" />
      </div>
    )}
  </>
);

export default MethaneLegend;
