import styles from './ToggleSwitch.module.scss';

const ToggleSwitch = ({ isChecked, onChange, disabled = false, size = 'medium' }) => {
  return (
    <label className={`${styles.toggle} ${styles[size]} ${disabled ? styles.disabled : ''}`}>
      <input 
        type="checkbox" 
        checked={isChecked} 
        onChange={onChange}
        disabled={disabled}
        className={styles.input}
      />
      <span className={styles.slider}>
        <span className={styles.thumb}></span>
      </span>
    </label>
  );
};

export default ToggleSwitch;