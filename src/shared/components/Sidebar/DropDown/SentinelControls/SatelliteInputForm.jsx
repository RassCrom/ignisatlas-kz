import {
  Satellite,
  Calendar,
  Grid3x3,
  Search,
  Download,
  Loader,
} from "lucide-react";
import { ICON_SIZE, SATELLITE_COLLECTIONS } from "../DropDownConstants";
import styles from "../DropDown.module.scss";

const SatelliteInputForm = ({
  satelliteInputs,
  handleInputChange,
  handleSearch,
  handleDownload,
  isLoading,
  searchResult,
  error,
}) => (
  <div className={styles.satellite__container}>
    <div className={styles.dropdown__input}>
      <div className={styles.input__group}>
        <Satellite size={ICON_SIZE} />
        <label htmlFor="satellite-collection">Collection:</label>
        <select
          id="satellite-collection"
          value={satelliteInputs.collection}
          onChange={(e) => handleInputChange("collection", e.target.value)}
        >
          {SATELLITE_COLLECTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className={styles.input__row}>
        <div className={styles.input__group}>
          <Calendar size={ICON_SIZE} />
          <label htmlFor="start-date">Start:</label>
          <input
            id="start-date"
            type="date"
            value={satelliteInputs.startDate}
            onChange={(e) => handleInputChange("startDate", e.target.value)}
          />
        </div>
        <div className={styles.input__group}>
          <Calendar size={ICON_SIZE} />
          <label htmlFor="end-date">End:</label>
          <input
            id="end-date"
            type="date"
            value={satelliteInputs.endDate}
            onChange={(e) => handleInputChange("endDate", e.target.value)}
          />
        </div>
      </div>

      <div className={styles.input__group}>
        <Grid3x3 size={ICON_SIZE} />
        <label htmlFor="bands-input">Bands:</label>
        <input
          id="bands-input"
          value={satelliteInputs.bands}
          onChange={(e) => handleInputChange("bands", e.target.value)}
          placeholder="B2,B4,B8"
        />
      </div>

      <div className={styles.input__row}>
        {['west', 'east'].map(direction => (
          <div key={direction} className={styles.input__group}>
            <label htmlFor={`${direction}-input`}>{direction.charAt(0).toUpperCase() + direction.slice(1)}:</label>
            <input
              id={`${direction}-input`}
              type="number"
              step="0.01"
              value={satelliteInputs[direction]}
              onChange={(e) => handleInputChange(direction, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className={styles.input__row}>
        {['north', 'south'].map(direction => (
          <div key={direction} className={styles.input__group}>
            <label htmlFor={`${direction}-input`}>{direction.charAt(0).toUpperCase() + direction.slice(1)}:</label>
            <input
              id={`${direction}-input`}
              type="number"
              step="0.01"
              value={satelliteInputs[direction]}
              onChange={(e) => handleInputChange(direction, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>

    <div className={styles.dropdown__buttons}>
      <button
        className={styles.button__search}
        onClick={handleSearch}
        disabled={isLoading}
        title="Search for imagery"
      >
        {isLoading
          ? <Loader size={ICON_SIZE} className={styles.spinner} />
          : <Search size={ICON_SIZE} />}
        <span>{isLoading ? "Processing..." : "Search"}</span>
      </button>
      <button
        className={`${styles.button__download} ${!searchResult ? styles.button__disabled : ''}`}
        onClick={handleDownload}
        disabled={!searchResult}
        title="Download imagery"
      >
        <Download size={ICON_SIZE} />
        <span>Download</span>
      </button>
    </div>

    {error && <div className={styles.error__message}>{error}</div>}

    {searchResult && (
      <div className={styles.result__container}>
        <h4>Result Preview</h4>
        <img
          src={searchResult.imagePath}
          alt="Satellite imagery result"
          className={styles.result__image}
        />
        <div className={styles.result__metadata}>
          <p><strong>Collection:</strong> {searchResult.metadata.collection}</p>
          <p><strong>Date Range:</strong> {searchResult.metadata.dateRange}</p>
          <p><strong>Bands:</strong> {searchResult.metadata.bands}</p>
        </div>
      </div>
    )}
  </div>
);

export default SatelliteInputForm;
