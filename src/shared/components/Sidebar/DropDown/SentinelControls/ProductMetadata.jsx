import styles from './SentinelControls.module.scss';
import {
  Satellite, Calendar as CalendarIcon, Database,
  Settings, Image,
} from "lucide-react";
import { formatDate, formatFileSize } from "src/utils/sentinelUtils";

const ProductMetadata = ({ product }) => {

    return (
        <div className={styles.metadata}>
            <div className={styles.metadata__grid}>
            <div className={styles.metadata__item}>
                <div className={styles.metadata__icon}>
                    <Satellite size={16} />
                </div>
                <div className={styles.metadata__content}>
                    <span className={styles.metadata__label}>Платформа</span>
                    <span className={styles.metadata__value}>
                        {product.Platform || "N/A"}
                    </span>
                </div>
            </div>

            <div className={styles.metadata__item}>
                <div className={styles.metadata__icon}>
                <Database size={16} />
                </div>
                <div className={styles.metadata__content}>
                <span className={styles.metadata__label}>Тип продукта</span>
                <span className={styles.metadata__value}>
                    {product.ProductType || "N/A"}
                </span>
                </div>
            </div>

            <div className={styles.metadata__item}>
                <div className={styles.metadata__icon}>
                <Settings size={16} />
                </div>
                <div className={styles.metadata__content}>
                <span className={styles.metadata__label}>Уровень обработки</span>
                <span className={styles.metadata__value}>
                    {product.ProcessingLevel || "N/A"}
                </span>
                </div>
            </div>

            <div className={styles.metadata__item}>
                <div className={styles.metadata__icon}>
                <CalendarIcon size={16} />
                </div>
                <div className={styles.metadata__content}>
                <span className={styles.metadata__label}>Дата загрузки</span>
                <span className={styles.metadata__value}>
                    {formatDate(product.IngestionDate)}
                </span>
                </div>
            </div>

            <div className={styles.metadata__item}>
                <div className={styles.metadata__icon}>
                <span className={styles.metadata__orbitIcon}>🛰️</span>
                </div>
                <div className={styles.metadata__content}>
                <span className={styles.metadata__label}>Номер орбиты</span>
                <span className={styles.metadata__value}>
                    {product.OrbitNumber || "N/A"}
                </span>
                </div>
            </div>

            <div className={styles.metadata__item}>
                <div className={styles.metadata__icon}>
                <span className={styles.metadata__tileIcon}>🗂️</span>
                </div>
                <div className={styles.metadata__content}>
                <span className={styles.metadata__label}>ID тайла</span>
                <span className={styles.metadata__value}>
                    {product.TileId || "N/A"}
                </span>
                </div>
            </div>

            {product.Size && (
                <div className={styles.metadata__item}>
                <div className={styles.metadata__icon}>
                    <span className={styles.metadata__sizeIcon}>💾</span>
                </div>
                <div className={styles.metadata__content}>
                    <span className={styles.metadata__label}>Размер файла</span>
                    <span className={styles.metadata__value}>
                    {formatFileSize(product.Size)}
                    </span>
                </div>
                </div>
            )}
            </div>

            {product.ThumbnailUrl && (
            <div className={styles.metadata__thumbnail}>
                <div className={styles.metadata__thumbnailHeader}>
                <Image size={16} />
                <span>Превью</span>
                </div>
                <img
                src={product.ThumbnailUrl}
                alt="Product thumbnail"
                className={styles.metadata__thumbnailImage}
                onError={(e) => (e.target.style.display = "none")}
                />
            </div>
            )}
        </div>
    );
}

export default ProductMetadata;