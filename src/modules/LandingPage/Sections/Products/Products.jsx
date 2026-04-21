import styles from './Products.module.scss'
import ProductCard from './ProductCard';

const productsData = [
  {
    id: 1,
    title: 'Архивные отчеты данных MODIS и VIIRS',
    description: 'Пространственно-временные связи пожарной активности в Казахстане с 2001 по 2024 годы с использованием спутниковых данных MODIS и VIIRS. С помощью ГИС-анализа оценивается влияние земельного покрова, инфраструктуры, изменений климата и рельефа на динамику пожаров.',
    image: '/report-img.png',
    link: '/report',
    buttonText: 'Открыть дэшборд',
    variant: 'wide',
    theme: 'light'
  },
  {
    id: 2,
    title: 'Точки пожаров',
    description: 'Fires KZ отображает активные очаги возгораний, обнаруженные спутниками MODIS, VIIRS и Sentinel. Данные обновляются регулярно и показывают интенсивность, координаты и время регистрации.',
    image: '/firepoints.png',
    link: '#map',
    buttonText: 'Открыть карту',
    variant: 'regular',
    theme: 'purple'
  },
  {
    id: 3,
    title: 'Прогностические модели',
    description: 'Наши алгоритмы прогнозирования используют метеоданные, спутниковые снимки и исторические наблюдения, чтобы оценивать вероятность возникновения пожаров. Модель показывает, какие регионы могут стать уязвимыми в ближайшие дни — полезно для планирования и профилактики.',
    image: '/fireforecast.png',
    link: '#map',
    buttonText: 'Открыть карту',
    variant: 'regular',
    theme: 'light'
  },
  {
    id: 4,
    title: 'Аналитика пожаров',
    description: 'Пространственно-временные связи пожарной активности в Казахстане с 2001 по 2024 годы с использованием спутниковых данных MODIS и VIIRS. С помощью ГИС-анализа оценивается влияние земельного покрова, инфраструктуры, изменений климата и рельефа на динамику пожаров.',
    image: '/firerisk.png',
    link: '#analytics',
    buttonText: 'Открыть дэшборд',
    variant: 'wide',
    theme: 'purple'
  }
];

const Products = () => {
  return (
    <section id="products" className={styles.products}>
      <div className={styles.products__container}>
        <header className={styles.products__header}>
          <h4 className={styles.products__subtitle}>Продукты</h4>
          <h2 className={styles.products__title}>Продукты</h2>
        </header>

        <div className={styles.products__grid}>
          {productsData.map((product) => (
            <ProductCard 
              key={product.id}
              {...product}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;